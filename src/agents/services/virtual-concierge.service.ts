import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VirtualConciergeService {
  private readonly logger = new Logger(VirtualConciergeService.name);

  async getEnhancements(message: string, response: string): Promise<{
    suggestions: string[];
    actions: Array<{ type: string; label: string; data?: any }>;
  }> {
    const lowerMessage = message.toLowerCase();
    
    const suggestions = [];
    const actions = [];

    // Help and support suggestions
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      suggestions.push('Browse FAQ', 'Contact support', 'Video tutorial', 'Live chat');
      actions.push({
        type: 'get_help',
        label: 'Get Help',
        data: { category: 'general' }
      });
    }

    // Account related
    if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('login')) {
      suggestions.push('Manage account', 'Update profile', 'Change password', 'Privacy settings');
      actions.push({
        type: 'account_management',
        label: 'Manage Account',
        data: {}
      });
    }

    // Payment and billing
    if (lowerMessage.includes('payment') || lowerMessage.includes('billing') || lowerMessage.includes('invoice')) {
      suggestions.push('View invoices', 'Payment methods', 'Billing history', 'Refund policy');
      actions.push({
        type: 'billing_support',
        label: 'Billing Support',
        data: {}
      });
    }

    // Platform features
    if (lowerMessage.includes('how to') || lowerMessage.includes('tutorial')) {
      suggestions.push('Video tutorials', 'Step-by-step guide', 'Feature overview', 'Best practices');
      actions.push({
        type: 'tutorials',
        label: 'View Tutorials',
        data: {}
      });
    }

    // Technical issues
    if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('problem')) {
      suggestions.push('Report issue', 'Troubleshoot', 'System status', 'Contact tech support');
      actions.push({
        type: 'report_issue',
        label: 'Report Issue',
        data: {}
      });
    }

    // Booking issues
    if (lowerMessage.includes('booking') && (lowerMessage.includes('cancel') || lowerMessage.includes('modify'))) {
      suggestions.push('Modify booking', 'Cancel booking', 'Reschedule', 'Refund policy');
      actions.push({
        type: 'booking_support',
        label: 'Booking Support',
        data: {}
      });
    }

    // Platform navigation
    if (lowerMessage.includes('find') || lowerMessage.includes('where') || lowerMessage.includes('navigate')) {
      suggestions.push('Platform tour', 'Search help', 'Navigation guide', 'Quick start');
      actions.push({
        type: 'platform_guide',
        label: 'Platform Guide',
        data: {}
      });
    }

    // Policies and terms
    if (lowerMessage.includes('policy') || lowerMessage.includes('terms') || lowerMessage.includes('privacy')) {
      suggestions.push('Privacy policy', 'Terms of service', 'Cancellation policy', 'Usage guidelines');
      actions.push({
        type: 'policies',
        label: 'View Policies',
        data: {}
      });
    }

    // Default concierge suggestions
    if (suggestions.length === 0) {
      suggestions.push('Browse FAQ', 'Contact support', 'Platform guide', 'Get started');
      actions.push({
        type: 'general_help',
        label: 'General Help',
        data: {}
      });
    }

    // Common quick actions
    actions.push(
      {
        type: 'contact_support',
        label: 'Contact Support',
        data: { channels: ['email', 'chat', 'phone'] }
      },
      {
        type: 'faq',
        label: 'Browse FAQ',
        data: {}
      }
    );

    // Priority support for urgent issues
    if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency')) {
      actions.unshift({
        type: 'priority_support',
        label: 'Priority Support',
        data: { priority: 'high' }
      });
    }

    return { suggestions, actions };
  }
}
