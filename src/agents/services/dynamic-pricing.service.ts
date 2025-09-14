import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);

  async getEnhancements(message: string, response: string): Promise<{
    suggestions: string[];
    actions: Array<{ type: string; label: string; data?: any }>;
  }> {
    const lowerMessage = message.toLowerCase();
    
    const suggestions = [];
    const actions = [];

    // Price comparison suggestions
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      suggestions.push('Compare prices', 'View price trends', 'Get price alerts', 'Find deals');
      actions.push({
        type: 'price_comparison',
        label: 'Compare Prices',
        data: {}
      });
    }

    // Budget-related suggestions
    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      suggestions.push('Find budget options', 'View discounts', 'Check off-peak rates');
      actions.push({
        type: 'budget_filter',
        label: 'Show Budget Options',
        data: { price_range: 'low' }
      });
    }

    if (lowerMessage.includes('expensive') || lowerMessage.includes('premium')) {
      suggestions.push('View premium spaces', 'Check luxury amenities', 'Compare features');
      actions.push({
        type: 'premium_filter',
        label: 'Show Premium Options',
        data: { price_range: 'high' }
      });
    }

    // Discount and offers
    if (lowerMessage.includes('discount') || lowerMessage.includes('offer') || lowerMessage.includes('deal')) {
      suggestions.push('View current offers', 'Check bulk discounts', 'Find promotions');
      actions.push({
        type: 'show_offers',
        label: 'View Current Offers',
        data: {}
      });
    }

    // Time-based pricing
    if (lowerMessage.includes('peak') || lowerMessage.includes('off-peak')) {
      suggestions.push('Check peak hours', 'Find off-peak rates', 'Optimize timing');
      actions.push({
        type: 'time_based_pricing',
        label: 'View Time-Based Rates',
        data: {}
      });
    }

    // Market analysis
    if (lowerMessage.includes('market') || lowerMessage.includes('trend')) {
      suggestions.push('View market trends', 'Check demand forecast', 'Price predictions');
      actions.push({
        type: 'market_analysis',
        label: 'View Market Analysis',
        data: {}
      });
    }

    // Default pricing suggestions
    if (suggestions.length === 0) {
      suggestions.push('Check current rates', 'View pricing tiers', 'Get quote', 'Price alerts');
      actions.push({
        type: 'get_quote',
        label: 'Get Price Quote',
        data: {}
      });
    }

    // Extract budget if mentioned
    const budget = this.extractBudget(lowerMessage);
    if (budget > 0) {
      actions.push({
        type: 'budget_search',
        label: `Find spaces under ₹${budget}`,
        data: { max_budget: budget }
      });
    }

    return { suggestions, actions };
  }

  private extractBudget(message: string): number {
    // Look for currency patterns
    const patterns = [
      /₹\s*(\d+(?:,\d+)*)/g,
      /rs\.?\s*(\d+(?:,\d+)*)/gi,
      /rupees?\s*(\d+(?:,\d+)*)/gi,
      /\b(\d+(?:,\d+)*)\s*(?:rupees?|rs\.?|₹)/gi,
    ];

    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        const numbers = matches.map(match => {
          const num = match.replace(/[^\d,]/g, '').replace(/,/g, '');
          return parseInt(num);
        }).filter(n => !isNaN(n) && n > 0);
        
        if (numbers.length > 0) {
          return Math.max(...numbers);
        }
      }
    }

    return 0;
  }
}
