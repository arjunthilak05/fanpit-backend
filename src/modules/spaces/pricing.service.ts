import { Injectable } from '@nestjs/common';
import { PricingRule } from '../../schemas/space.schema';

export interface PriceCalculationResult {
  baseAmount: number;
  taxes: number;
  discounts: number;
  totalAmount: number;
  appliedRules: string[];
  promoCode?: string;
}

@Injectable()
export class PricingService {
  calculatePrice(
    pricingRules: PricingRule[],
    date: Date,
    startTime: string,
    duration: number,
    promoCode?: string,
  ): PriceCalculationResult {
    let baseAmount = 0;
    let discountAmount = 0;
    const appliedRules: string[] = [];

    // Filter active rules
    const activeRules = pricingRules.filter(rule => rule.isActive);

    // Find applicable pricing rules based on date, time, and conditions
    for (const rule of activeRules) {
      if (this.isRuleApplicable(rule, date, startTime, duration)) {
        appliedRules.push(rule.name);

        switch (rule.type) {
          case 'hourly':
            baseAmount += rule.basePrice * duration;
            break;
          case 'daily':
            baseAmount += rule.basePrice;
            break;
          case 'bundle':
            if (duration >= (rule.conditions.minDuration || 0)) {
              baseAmount += rule.basePrice;
            } else {
              baseAmount += rule.basePrice * (duration / (rule.conditions.minDuration || 1));
            }
            break;
          case 'promo':
            if (promoCode === rule.promoCode) {
              discountAmount += (baseAmount * (rule.discountPercentage || 0)) / 100;
            }
            break;
        }

        // Apply peak multiplier if applicable
        if (rule.conditions.peakMultiplier && this.isPeakTime(date, startTime)) {
          baseAmount *= rule.conditions.peakMultiplier;
        }
      }
    }

    // If no specific rules found, use default hourly rate
    if (baseAmount === 0) {
      const defaultRule = activeRules.find(r => r.type === 'hourly' && !r.conditions.timeSlots);
      if (defaultRule) {
        baseAmount = defaultRule.basePrice * duration;
        appliedRules.push(defaultRule.name);
      }
    }

    // Calculate taxes (18% GST in India)
    const taxes = Math.round(baseAmount * 0.18);
    
    const totalAmount = baseAmount + taxes - discountAmount;

    return {
      baseAmount: Math.round(baseAmount),
      taxes,
      discounts: Math.round(discountAmount),
      totalAmount: Math.round(totalAmount),
      appliedRules,
      promoCode,
    };
  }

  private isRuleApplicable(
    rule: PricingRule,
    date: Date,
    startTime: string,
    duration: number,
  ): boolean {
    const { conditions } = rule;

    // Check date range
    if (conditions.dateRange) {
      const checkDate = new Date(date);
      if (checkDate < conditions.dateRange.start || checkDate > conditions.dateRange.end) {
        return false;
      }
    }

    // Check day of week
    if (conditions.dayOfWeek && conditions.dayOfWeek.length > 0) {
      const dayOfWeek = date.getDay();
      if (!conditions.dayOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check time slots
    if (conditions.timeSlots && conditions.timeSlots.length > 0) {
      const isTimeSlotMatched = conditions.timeSlots.some(slot => {
        const [slotStart, slotEnd] = slot.split('-');
        return startTime >= slotStart && startTime <= slotEnd;
      });
      if (!isTimeSlotMatched) {
        return false;
      }
    }

    // Check duration limits
    if (conditions.minDuration && duration < conditions.minDuration) {
      return false;
    }
    
    if (conditions.maxDuration && duration > conditions.maxDuration) {
      return false;
    }

    return true;
  }

  private isPeakTime(date: Date, startTime: string): boolean {
    const dayOfWeek = date.getDay();
    const hour = parseInt(startTime.split(':')[0]);

    // Weekend is peak time
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }

    // Weekday peak hours: 9-11 AM and 6-8 PM
    if ((hour >= 9 && hour <= 11) || (hour >= 18 && hour <= 20)) {
      return true;
    }

    return false;
  }

  validatePromoCode(pricingRules: PricingRule[], promoCode: string): boolean {
    return pricingRules.some(
      rule => 
        rule.type === 'promo' && 
        rule.promoCode === promoCode && 
        rule.isActive
    );
  }
}