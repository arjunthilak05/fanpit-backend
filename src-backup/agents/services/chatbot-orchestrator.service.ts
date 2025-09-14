import { Injectable, Logger } from '@nestjs/common';
import { ChatMessageDto, ChatResponseDto } from '../dto/chat.dto';
import { OpenAIService } from './openai.service';
import { SmartSpaceDiscoveryService } from './smart-space-discovery.service';
import { IntelligentBookingService } from './intelligent-booking.service';
import { DynamicPricingService } from './dynamic-pricing.service';
import { EventPlanningService } from './event-planning.service';
import { VirtualConciergeService } from './virtual-concierge.service';

@Injectable()
export class ChatbotOrchestratorService {
  private readonly logger = new Logger(ChatbotOrchestratorService.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly spaceDiscovery: SmartSpaceDiscoveryService,
    private readonly bookingService: IntelligentBookingService,
    private readonly pricingService: DynamicPricingService,
    private readonly eventPlanning: EventPlanningService,
    private readonly conciergeService: VirtualConciergeService,
  ) {}

  async processMessage(chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    const startTime = Date.now();
    const { message, userId, model, context } = chatMessageDto;

    this.logger.log(`Processing message: "${message.substring(0, 50)}..."`);

    // Determine which agent should handle this request
    const agentType = this.determineAgent(message);
    this.logger.log(`Routing to agent: ${agentType}`);

    // Build conversation context
    const messages = this.buildConversationContext(message, agentType, context);

    try {
      // Generate AI response
      const aiResult = await this.openAIService.generateResponse(
        messages,
        model || 'openrouter/sonoma-sky-alpha',
        1000,
        0.7,
      );

      // Get agent-specific enhancements
      const agentEnhancements = await this.getAgentEnhancements(agentType, message, aiResult.response);

      const responseTime = Date.now() - startTime;

      return {
        response: aiResult.response,
        agent: agentType,
        confidence: this.calculateConfidence(agentType, message),
        suggestions: agentEnhancements.suggestions,
        actions: agentEnhancements.actions,
        timestamp: new Date().toISOString(),
        usage: {
          ...aiResult.usage,
          response_time_ms: responseTime,
        },
      };
    } catch (error) {
      this.logger.error('Error in chatbot orchestrator:', error);
      throw error;
    }
  }

  private determineAgent(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Space discovery keywords
    if (this.containsKeywords(lowerMessage, [
      'find', 'search', 'space', 'room', 'office', 'coworking', 'venue',
      'location', 'area', 'capacity', 'amenities', 'facilities'
    ])) {
      return 'smart_space_discovery';
    }

    // Booking keywords
    if (this.containsKeywords(lowerMessage, [
      'book', 'reserve', 'schedule', 'appointment', 'calendar', 'availability',
      'confirm', 'time slot', 'date', 'duration'
    ])) {
      return 'intelligent_booking';
    }

    // Pricing keywords
    if (this.containsKeywords(lowerMessage, [
      'price', 'cost', 'rate', 'pricing', 'fee', 'charge', 'expensive',
      'cheap', 'budget', 'discount', 'offer'
    ])) {
      return 'dynamic_pricing';
    }

    // Event planning keywords
    if (this.containsKeywords(lowerMessage, [
      'event', 'party', 'conference', 'meeting', 'workshop', 'seminar',
      'celebration', 'gathering', 'ceremony', 'plan', 'organize'
    ])) {
      return 'event_planning';
    }

    // Default to virtual concierge for general queries
    return 'virtual_concierge';
  }

  private containsKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  private buildConversationContext(
    message: string,
    agentType: string,
    context?: Array<{ role: string; content: string; timestamp: string }>,
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt
    messages.push({
      role: 'system',
      content: this.openAIService.createSystemPrompt(agentType),
    });

    // Add conversation history if provided
    if (context && context.length > 0) {
      const recentContext = context.slice(-5); // Last 5 messages for context
      messages.push(...recentContext.map(ctx => ({
        role: ctx.role,
        content: ctx.content,
      })));
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });

    return messages;
  }

  private calculateConfidence(agentType: string, message: string): number {
    const lowerMessage = message.toLowerCase();
    
    const agentKeywords = {
      smart_space_discovery: ['find', 'search', 'space', 'room', 'office', 'venue'],
      intelligent_booking: ['book', 'reserve', 'schedule', 'calendar', 'availability'],
      dynamic_pricing: ['price', 'cost', 'rate', 'pricing', 'budget'],
      event_planning: ['event', 'party', 'conference', 'plan', 'organize'],
      virtual_concierge: ['help', 'support', 'question', 'how', 'what', 'why'],
    };

    const keywords = agentKeywords[agentType] || [];
    const matchCount = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    
    return Math.min(0.6 + (matchCount * 0.1), 0.95);
  }

  private async getAgentEnhancements(
    agentType: string,
    message: string,
    response: string,
  ): Promise<{ suggestions: string[]; actions: Array<{ type: string; label: string; data?: any }> }> {
    switch (agentType) {
      case 'smart_space_discovery':
        return this.spaceDiscovery.getEnhancements(message, response);
      
      case 'intelligent_booking':
        return this.bookingService.getEnhancements(message, response);
      
      case 'dynamic_pricing':
        return this.pricingService.getEnhancements(message, response);
      
      case 'event_planning':
        return this.eventPlanning.getEnhancements(message, response);
      
      case 'virtual_concierge':
      default:
        return this.conciergeService.getEnhancements(message, response);
    }
  }
}
