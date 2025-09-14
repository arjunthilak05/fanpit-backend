import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventPlanningService {
  private readonly logger = new Logger(EventPlanningService.name);

  async getEnhancements(message: string, response: string): Promise<{
    suggestions: string[];
    actions: Array<{ type: string; label: string; data?: any }>;
  }> {
    const lowerMessage = message.toLowerCase();
    
    const suggestions = [];
    const actions = [];

    // Event type specific suggestions
    if (lowerMessage.includes('conference') || lowerMessage.includes('seminar')) {
      suggestions.push('Find conference venues', 'Check A/V equipment', 'Arrange catering', 'Book speakers');
      actions.push({
        type: 'plan_conference',
        label: 'Plan Conference',
        data: { event_type: 'conference' }
      });
    }

    if (lowerMessage.includes('party') || lowerMessage.includes('celebration')) {
      suggestions.push('Find party venues', 'Arrange decorations', 'Book entertainment', 'Plan menu');
      actions.push({
        type: 'plan_party',
        label: 'Plan Party',
        data: { event_type: 'party' }
      });
    }

    if (lowerMessage.includes('wedding') || lowerMessage.includes('marriage')) {
      suggestions.push('Find wedding venues', 'Check packages', 'Book vendors', 'Plan timeline');
      actions.push({
        type: 'plan_wedding',
        label: 'Plan Wedding',
        data: { event_type: 'wedding' }
      });
    }

    if (lowerMessage.includes('corporate') || lowerMessage.includes('business')) {
      suggestions.push('Find corporate venues', 'Arrange team building', 'Book facilities', 'Plan agenda');
      actions.push({
        type: 'plan_corporate',
        label: 'Plan Corporate Event',
        data: { event_type: 'corporate' }
      });
    }

    // Service-specific suggestions
    if (lowerMessage.includes('catering') || lowerMessage.includes('food')) {
      suggestions.push('Browse caterers', 'View menus', 'Check dietary options', 'Get quotes');
      actions.push({
        type: 'find_catering',
        label: 'Find Caterers',
        data: { service: 'catering' }
      });
    }

    if (lowerMessage.includes('decoration') || lowerMessage.includes('decor')) {
      suggestions.push('Browse decorators', 'View themes', 'Check packages', 'Get estimates');
      actions.push({
        type: 'find_decoration',
        label: 'Find Decorators',
        data: { service: 'decoration' }
      });
    }

    if (lowerMessage.includes('photography') || lowerMessage.includes('photographer')) {
      suggestions.push('Find photographers', 'View portfolios', 'Check packages', 'Book sessions');
      actions.push({
        type: 'find_photography',
        label: 'Find Photographers',
        data: { service: 'photography' }
      });
    }

    // Planning tools
    if (lowerMessage.includes('timeline') || lowerMessage.includes('schedule')) {
      suggestions.push('Create timeline', 'Set milestones', 'Track progress', 'Send reminders');
      actions.push({
        type: 'create_timeline',
        label: 'Create Event Timeline',
        data: {}
      });
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      suggestions.push('Create budget', 'Track expenses', 'Find savings', 'Compare quotes');
      actions.push({
        type: 'budget_planner',
        label: 'Create Budget Plan',
        data: {}
      });
    }

    // Default event planning suggestions
    if (suggestions.length === 0) {
      suggestions.push('Start planning', 'Find venues', 'Browse vendors', 'Create checklist');
      actions.push({
        type: 'start_planning',
        label: 'Start Event Planning',
        data: {}
      });
    }

    // Extract guest count if mentioned
    const guestCount = this.extractGuestCount(lowerMessage);
    if (guestCount > 0) {
      actions.push({
        type: 'plan_for_guests',
        label: `Plan for ${guestCount} guests`,
        data: { guest_count: guestCount }
      });
    }

    // Extract event date if mentioned
    const eventDate = this.extractEventDate(lowerMessage);
    if (eventDate) {
      actions.push({
        type: 'set_event_date',
        label: `Plan for ${eventDate}`,
        data: { event_date: eventDate }
      });
    }

    return { suggestions, actions };
  }

  private extractGuestCount(message: string): number {
    const patterns = [
      /\b(\d+)\s*(?:guests?|people|persons?|attendees?)\b/gi,
      /\b(?:for|about|around)\s*(\d+)\b/gi,
    ];

    for (const pattern of patterns) {
      const matches = message.match(pattern);
      if (matches) {
        const numbers = matches.map(match => {
          const num = match.replace(/\D/g, '');
          return parseInt(num);
        }).filter(n => !isNaN(n) && n > 0 && n <= 10000);
        
        if (numbers.length > 0) {
          return Math.max(...numbers);
        }
      }
    }

    return 0;
  }

  private extractEventDate(message: string): string | null {
    const datePatterns = [
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\bnext\s+(?:week|month|year)\b/gi,
      /\bthis\s+(?:weekend|month)\b/gi,
    ];

    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }
}
