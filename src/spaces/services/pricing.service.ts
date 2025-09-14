import { Injectable, Logger } from '@nestjs/common';
import { Space } from '../schemas/space.schema';

export interface PricingCalculationOptions {
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration?: number; // in hours
  promoCode?: string;
  pricingOverride?: 'peak' | 'offpeak' | 'weekend' | 'special';
}

export interface PricingCalculationResult {
  basePrice: number;
  adjustedPrice: number;
  finalPrice: number;
  breakdown: {
    base: number;
    peakAdjustment?: number;
    weekendAdjustment?: number;
    specialEventAdjustment?: number;
    promoDiscount?: number;
  };
  appliedMultipliers: string[];
  timeBlockMatch?: {
    title: string;
    duration: number;
    price: number;
    savings: number;
  };
  promoCodeApplied?: {
    code: string;
    discount: number;
    type: string;
  };
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  /**
   * Calculate dynamic price for a space booking
   */
  calculatePrice(
    space: Space,
    options: PricingCalculationOptions,
  ): PricingCalculationResult {
    const { date, startTime, endTime, duration, promoCode } = options;
    
    // Base price
    let basePrice = space.pricing.basePrice;
    let adjustedPrice = basePrice;
    const breakdown: any = { base: basePrice };
    const appliedMultipliers: string[] = [];

    // Handle free spaces
    if (space.pricing.priceType === 'free') {
      return {
        basePrice: 0,
        adjustedPrice: 0,
        finalPrice: 0,
        breakdown: { base: 0 },
        appliedMultipliers: ['free'],
      };
    }

    // Calculate duration if not provided
    const calculatedDuration = duration || this.calculateDuration(startTime, endTime);

    // Check for special event pricing first (highest priority)
    const specialEventPrice = this.getSpecialEventPrice(space, date);
    if (specialEventPrice !== null) {
      adjustedPrice = specialEventPrice;
      breakdown.specialEventAdjustment = specialEventPrice - basePrice;
      appliedMultipliers.push('special-event');
    } else {
      // Check for time block packages
      const timeBlockMatch = this.findBestTimeBlock(space, calculatedDuration);
      if (timeBlockMatch) {
        const regularPrice = this.calculateRegularPrice(
          space,
          date,
          startTime,
          endTime,
          calculatedDuration,
        );
        
        if (timeBlockMatch.price < regularPrice.adjustedPrice) {
          return {
            basePrice,
            adjustedPrice: timeBlockMatch.price,
            finalPrice: this.applyPromoCode(space, timeBlockMatch.price, promoCode).finalPrice,
            breakdown: { base: timeBlockMatch.price },
            appliedMultipliers: ['time-block'],
            timeBlockMatch: {
              title: timeBlockMatch.title,
              duration: timeBlockMatch.duration,
              price: timeBlockMatch.price,
              savings: regularPrice.adjustedPrice - timeBlockMatch.price,
            },
            promoCodeApplied: this.applyPromoCode(space, timeBlockMatch.price, promoCode).promoCodeApplied,
          };
        }
      }

      // Apply regular pricing logic
      const regularPricing = this.calculateRegularPrice(
        space,
        date,
        startTime,
        endTime,
        calculatedDuration,
      );
      
      adjustedPrice = regularPricing.adjustedPrice;
      Object.assign(breakdown, regularPricing.breakdown);
      appliedMultipliers.push(...regularPricing.appliedMultipliers);
    }

    // Apply promo code
    const promoResult = this.applyPromoCode(space, adjustedPrice, promoCode);
    const finalPrice = promoResult.finalPrice;
    
    if (promoResult.promoCodeApplied) {
      breakdown.promoDiscount = promoResult.promoCodeApplied.discount;
    }

    return {
      basePrice,
      adjustedPrice,
      finalPrice,
      breakdown,
      appliedMultipliers,
      promoCodeApplied: promoResult.promoCodeApplied,
    };
  }

  /**
   * Calculate regular pricing with multipliers
   */
  private calculateRegularPrice(
    space: Space,
    date: Date,
    startTime: string,
    endTime: string,
    duration: number,
  ): Omit<PricingCalculationResult, 'finalPrice' | 'promoCodeApplied'> {
    let basePrice = space.pricing.basePrice;
    let adjustedPrice = basePrice;
    const breakdown: any = { base: basePrice };
    const appliedMultipliers: string[] = [];

    // Apply duration multiplier for hourly pricing
    if (space.pricing.priceType === 'hourly') {
      adjustedPrice *= duration;
      breakdown.base = adjustedPrice;
    }

    // Check if it's weekend
    const isWeekend = this.isWeekend(date);
    if (isWeekend && space.pricing.weekendMultiplier && space.pricing.weekendMultiplier !== 1) {
      const weekendAdjustment = adjustedPrice * (space.pricing.weekendMultiplier - 1);
      adjustedPrice *= space.pricing.weekendMultiplier;
      breakdown.weekendAdjustment = weekendAdjustment;
      appliedMultipliers.push('weekend');
    }

    // Check for peak hours (only on weekdays or if no weekend multiplier)
    if (!isWeekend || !space.pricing.weekendMultiplier) {
      const peakMultiplier = this.getPeakHoursMultiplier(space, startTime, endTime);
      if (peakMultiplier !== 1) {
        const peakAdjustment = adjustedPrice * (peakMultiplier - 1);
        adjustedPrice *= peakMultiplier;
        breakdown.peakAdjustment = peakAdjustment;
        appliedMultipliers.push(peakMultiplier > 1 ? 'peak' : 'off-peak');
      }
    }

    return {
      basePrice,
      adjustedPrice,
      breakdown,
      appliedMultipliers,
    };
  }

  /**
   * Apply promo code discount
   */
  private applyPromoCode(
    space: Space,
    price: number,
    promoCode?: string,
  ): { finalPrice: number; promoCodeApplied?: any } {
    if (!promoCode) {
      return { finalPrice: price };
    }

    const promo = space.promoCodes.find(
      p => p.code === promoCode.toUpperCase() && 
           p.isActive && 
           new Date() >= p.validFrom && 
           new Date() <= p.validTo &&
           (!p.usageLimit || p.usedCount < p.usageLimit)
    );

    if (!promo) {
      this.logger.warn(`Invalid or expired promo code: ${promoCode}`);
      return { finalPrice: price };
    }

    let discount = 0;
    if (promo.type === 'percentage') {
      discount = price * (promo.discount / 100);
    } else {
      discount = Math.min(promo.discount, price); // Don't discount more than the price
    }

    const finalPrice = Math.max(0, price - discount);

    return {
      finalPrice,
      promoCodeApplied: {
        code: promo.code,
        discount,
        type: promo.type,
      },
    };
  }

  /**
   * Find the best matching time block for the given duration
   */
  private findBestTimeBlock(
    space: Space,
    duration: number,
  ): { title: string; duration: number; price: number } | null {
    if (!space.pricing.timeBlocks || space.pricing.timeBlocks.length === 0) {
      return null;
    }

    // Find exact match first
    let bestMatch = space.pricing.timeBlocks.find(block => block.duration === duration);
    
    // If no exact match, find the closest match that covers the duration
    if (!bestMatch) {
      const suitableBlocks = space.pricing.timeBlocks.filter(block => block.duration >= duration);
      if (suitableBlocks.length > 0) {
        bestMatch = suitableBlocks.reduce((prev, current) => 
          prev.duration < current.duration ? prev : current
        );
      }
    }

    return bestMatch || null;
  }

  /**
   * Get special event pricing for a specific date
   */
  private getSpecialEventPrice(space: Space, date: Date): number | null {
    if (!space.pricing.specialEventPricing) {
      return null;
    }

    const dateStr = date.toISOString().split('T')[0];
    const specialEvent = space.pricing.specialEventPricing.find(
      event => new Date(event.date).toISOString().split('T')[0] === dateStr
    );

    return specialEvent ? specialEvent.price : null;
  }

  /**
   * Calculate peak hours multiplier based on time range
   */
  private getPeakHoursMultiplier(space: Space, startTime: string, endTime: string): number {
    if (!space.pricing.peakHours) {
      return space.pricing.offPeakMultiplier || 1;
    }

    const peakStart = this.timeToMinutes(space.pricing.peakHours.start);
    const peakEnd = this.timeToMinutes(space.pricing.peakHours.end);
    const bookingStart = this.timeToMinutes(startTime);
    const bookingEnd = this.timeToMinutes(endTime);

    // Check if booking overlaps with peak hours
    const overlapStart = Math.max(peakStart, bookingStart);
    const overlapEnd = Math.min(peakEnd, bookingEnd);
    
    if (overlapStart < overlapEnd) {
      // There's an overlap
      const overlapDuration = overlapEnd - overlapStart;
      const totalDuration = bookingEnd - bookingStart;
      const overlapRatio = overlapDuration / totalDuration;
      
      // Apply weighted multiplier based on overlap
      if (overlapRatio >= 0.5) {
        // More than half is in peak hours
        return space.pricing.peakHours.multiplier;
      } else {
        // Less than half in peak hours, apply proportional multiplier
        const offPeakMultiplier = space.pricing.offPeakMultiplier || 1;
        return (space.pricing.peakHours.multiplier * overlapRatio) + 
               (offPeakMultiplier * (1 - overlapRatio));
      }
    }

    // No overlap with peak hours
    return space.pricing.offPeakMultiplier || 1;
  }

  /**
   * Check if date is weekend
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Calculate duration between start and end time
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    if (end <= start) {
      throw new Error('End time must be after start time');
    }
    
    return (end - start) / 60; // Convert minutes to hours
  }

  /**
   * Convert time string (HH:mm) to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get available pricing options for a space
   */
  getPricingOptions(space: Space): any {
    return {
      basePrice: space.pricing.basePrice,
      priceType: space.pricing.priceType,
      hasPeakPricing: !!space.pricing.peakHours,
      hasWeekendPricing: !!space.pricing.weekendMultiplier && space.pricing.weekendMultiplier !== 1,
      hasTimeBlocks: !!(space.pricing.timeBlocks && space.pricing.timeBlocks.length > 0),
      hasMonthlyPass: !!space.pricing.monthlyPass,
      hasPromoCodes: space.promoCodes && space.promoCodes.length > 0,
      hasSpecialEventPricing: !!(space.pricing.specialEventPricing && space.pricing.specialEventPricing.length > 0),
      peakHours: space.pricing.peakHours,
      timeBlocks: space.pricing.timeBlocks,
      monthlyPass: space.pricing.monthlyPass,
    };
  }

  /**
   * Validate promo code
   */
  validatePromoCode(space: Space, code: string): { valid: boolean; promo?: any; reason?: string } {
    const promo = space.promoCodes.find(p => p.code === code.toUpperCase());
    
    if (!promo) {
      return { valid: false, reason: 'Promo code not found' };
    }

    if (!promo.isActive) {
      return { valid: false, reason: 'Promo code is inactive' };
    }

    const now = new Date();
    if (now < promo.validFrom) {
      return { valid: false, reason: 'Promo code is not yet active' };
    }

    if (now > promo.validTo) {
      return { valid: false, reason: 'Promo code has expired' };
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return { valid: false, reason: 'Promo code usage limit exceeded' };
    }

    return { valid: true, promo };
  }
}