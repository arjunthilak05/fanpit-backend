import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmartSpaceDiscoveryService {
  private readonly logger = new Logger(SmartSpaceDiscoveryService.name);

  async getEnhancements(message: string, response: string): Promise<{
    suggestions: string[];
    actions: Array<{ type: string; label: string; data?: any }>;
  }> {
    const lowerMessage = message.toLowerCase();
    
    // Generate contextual suggestions based on the query
    const suggestions = [];
    const actions = [];

    if (lowerMessage.includes('conference') || lowerMessage.includes('meeting')) {
      suggestions.push('View conference rooms', 'Check A/V equipment', 'See capacity options');
      actions.push({
        type: 'filter_spaces',
        label: 'Show Conference Rooms',
        data: { category: 'conference', amenities: ['projector', 'whiteboard'] }
      });
    }

    if (lowerMessage.includes('coworking') || lowerMessage.includes('desk')) {
      suggestions.push('Browse coworking spaces', 'Check daily rates', 'View amenities');
      actions.push({
        type: 'filter_spaces',
        label: 'Show Coworking Spaces',
        data: { category: 'coworking', amenities: ['wifi', 'coffee'] }
      });
    }

    if (lowerMessage.includes('event') || lowerMessage.includes('party')) {
      suggestions.push('View event venues', 'Check catering options', 'See capacity');
      actions.push({
        type: 'filter_spaces',
        label: 'Show Event Venues',
        data: { category: 'event', amenities: ['catering', 'sound_system'] }
      });
    }

    // Default suggestions if no specific category detected
    if (suggestions.length === 0) {
      suggestions.push('Browse all spaces', 'Filter by location', 'Check availability', 'View pricing');
      actions.push({
        type: 'browse_spaces',
        label: 'Browse All Spaces',
        data: {}
      });
    }

    // Add location-based action if location mentioned
    if (this.containsLocation(lowerMessage)) {
      actions.push({
        type: 'search_by_location',
        label: 'Search This Area',
        data: { location: this.extractLocation(lowerMessage) }
      });
    }

    // Add capacity-based action if numbers mentioned
    const capacity = this.extractCapacity(lowerMessage);
    if (capacity > 0) {
      actions.push({
        type: 'filter_by_capacity',
        label: `Spaces for ${capacity}+ people`,
        data: { min_capacity: capacity }
      });
    }

    return { suggestions, actions };
  }

  private containsLocation(message: string): boolean {
    const locations = [
      'downtown', 'city center', 'cbd', 'bandra', 'andheri', 'powai', 'mumbai',
      'delhi', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata',
      'gurgaon', 'noida', 'whitefield', 'koramangala', 'indiranagar'
    ];
    return locations.some(location => message.includes(location));
  }

  private extractLocation(message: string): string {
    const locations = [
      'downtown', 'city center', 'cbd', 'bandra', 'andheri', 'powai', 'mumbai',
      'delhi', 'bangalore', 'pune', 'hyderabad', 'chennai', 'kolkata',
      'gurgaon', 'noida', 'whitefield', 'koramangala', 'indiranagar'
    ];
    
    for (const location of locations) {
      if (message.includes(location)) {
        return location;
      }
    }
    return '';
  }

  private extractCapacity(message: string): number {
    const numbers = message.match(/\b(\d+)\b/g);
    if (numbers) {
      // Find the largest reasonable number (likely capacity)
      const nums = numbers.map(n => parseInt(n)).filter(n => n >= 1 && n <= 1000);
      return nums.length > 0 ? Math.max(...nums) : 0;
    }
    return 0;
  }
}
