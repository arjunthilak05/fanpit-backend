import { Injectable, Logger } from '@nestjs/common';
import { ChatMessageDto, ChatResponseDto } from './dto/chat.dto';
import { ChatbotOrchestratorService } from './services/chatbot-orchestrator.service';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly chatbotOrchestrator: ChatbotOrchestratorService,
  ) {}

  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: {
        api: 'healthy',
        database: 'connected',
        ai: 'ready',
      },
    };
  }

  async processMessage(chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    this.logger.log(`Processing message from user: ${chatMessageDto.userId || 'anonymous'}`);
    
    try {
      const response = await this.chatbotOrchestrator.processMessage(chatMessageDto);
      return response;
    } catch (error) {
      this.logger.error('Error processing message:', error);
      
      // Fallback response
      return {
        response: `I understand you're asking about: "${chatMessageDto.message}". I can help you with space booking, pricing, event planning, or general questions. What would you like to know more about?`,
        agent: 'fallback_assistant',
        confidence: 0.7,
        suggestions: ['Find a space', 'Check pricing', 'Plan an event', 'Get support'],
        actions: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAvailableAgents() {
    return [
      {
        id: 'smart_space_discovery',
        name: 'Smart Space Discovery',
        description: 'Find and recommend perfect spaces using AI-powered search',
        capabilities: [
          'Natural language space search',
          'Vector-based similarity matching',
          'Personalized recommendations',
          'Real-time availability checking'
        ],
        status: 'active',
        icon: '🔍',
        color: '#4facfe'
      },
      {
        id: 'intelligent_booking',
        name: 'Intelligent Booking Assistant',
        description: 'Optimize bookings with smart scheduling and conflict detection',
        capabilities: [
          'Smart time slot optimization',
          'Calendar integration',
          'Conflict detection and resolution',
          'Price optimization suggestions'
        ],
        status: 'active',
        icon: '📅',
        color: '#00f2fe'
      },
      {
        id: 'dynamic_pricing',
        name: 'Dynamic Pricing AI',
        description: 'Real-time pricing analysis and revenue optimization',
        capabilities: [
          'Demand forecasting',
          'Competitor price analysis',
          'Revenue optimization',
          'Market trend analysis'
        ],
        status: 'active',
        icon: '💰',
        color: '#667eea'
      },
      {
        id: 'event_planning',
        name: 'Event Planning Assistant',
        description: 'Complete event planning with venue and vendor coordination',
        capabilities: [
          'End-to-end event planning',
          'Vendor recommendations',
          'Budget optimization',
          'Timeline generation'
        ],
        status: 'active',
        icon: '🎉',
        color: '#764ba2'
      },
      {
        id: 'virtual_concierge',
        name: 'Virtual Concierge',
        description: '24/7 customer support with multilingual capabilities',
        capabilities: [
          '24/7 customer support',
          'Multilingual assistance',
          'Issue resolution',
          'Platform guidance'
        ],
        status: 'active',
        icon: '🤝',
        color: '#f093fb'
      }
    ];
  }
}
