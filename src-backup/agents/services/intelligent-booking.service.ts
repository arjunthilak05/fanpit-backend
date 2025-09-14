import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IntelligentBookingService {
  private readonly logger = new Logger(IntelligentBookingService.name);

  async getEnhancements(message: string, response: string): Promise<{
    suggestions: string[];
    actions: Array<{ type: string; label: string; data?: any }>;
  }> {
    const lowerMessage = message.toLowerCase();
    
    const suggestions = [];
    const actions = [];

    // Time-based suggestions
    if (lowerMessage.includes('tomorrow') || lowerMessage.includes('today')) {
      suggestions.push('Check availability', 'View time slots', 'Book instantly');
      actions.push({
        type: 'check_availability',
        label: 'Check Today\'s Availability',
        data: { date: new Date().toISOString().split('T')[0] }
      });
    }

    if (lowerMessage.includes('next week') || lowerMessage.includes('week')) {
      suggestions.push('View weekly schedule', 'Book recurring slots', 'Check conflicts');
      actions.push({
        type: 'check_weekly_availability',
        label: 'View Week Schedule',
        data: { week_start: this.getNextWeekStart() }
      });
    }

    // Duration-based suggestions
    if (lowerMessage.includes('hour') || lowerMessage.includes('meeting')) {
      suggestions.push('Book 1-2 hours', 'Extend if needed', 'Set reminders');
      actions.push({
        type: 'suggest_duration',
        label: 'Book 2-Hour Slot',
        data: { duration: 2, unit: 'hours' }
      });
    }

    if (lowerMessage.includes('day') || lowerMessage.includes('full day')) {
      suggestions.push('Book full day', 'Check daily rates', 'Add services');
      actions.push({
        type: 'suggest_duration',
        label: 'Book Full Day',
        data: { duration: 8, unit: 'hours' }
      });
    }

    // Booking actions
    if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
      suggestions.push('Confirm booking', 'View alternatives', 'Check pricing');
      actions.push({
        type: 'start_booking',
        label: 'Start Booking Process',
        data: {}
      });
    }

    // Calendar integration
    if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule')) {
      suggestions.push('Sync calendar', 'Check conflicts', 'Set reminders');
      actions.push({
        type: 'calendar_integration',
        label: 'Connect Calendar',
        data: { providers: ['google', 'outlook'] }
      });
    }

    // Default booking suggestions
    if (suggestions.length === 0) {
      suggestions.push('Check availability', 'View pricing', 'Book now', 'Save for later');
      actions.push({
        type: 'quick_book',
        label: 'Quick Book',
        data: {}
      });
    }

    // Extract time if mentioned
    const timeSlot = this.extractTimeSlot(lowerMessage);
    if (timeSlot) {
      actions.push({
        type: 'book_time_slot',
        label: `Book at ${timeSlot}`,
        data: { time: timeSlot }
      });
    }

    return { suggestions, actions };
  }

  private getNextWeekStart(): string {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + (7 - today.getDay()));
    return nextWeek.toISOString().split('T')[0];
  }

  private extractTimeSlot(message: string): string | null {
    // Common time patterns
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i,
      /\b(\d{1,2})\s*(am|pm)\b/i,
      /\b(\d{1,2}):(\d{2})\b/,
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }
}
