import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { OpenAIService } from './services/openai.service';
import { ChatbotOrchestratorService } from './services/chatbot-orchestrator.service';
import { SmartSpaceDiscoveryService } from './services/smart-space-discovery.service';
import { IntelligentBookingService } from './services/intelligent-booking.service';
import { DynamicPricingService } from './services/dynamic-pricing.service';
import { EventPlanningService } from './services/event-planning.service';
import { VirtualConciergeService } from './services/virtual-concierge.service';

@Module({
  imports: [ConfigModule],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    OpenAIService,
    ChatbotOrchestratorService,
    SmartSpaceDiscoveryService,
    IntelligentBookingService,
    DynamicPricingService,
    EventPlanningService,
    VirtualConciergeService,
  ],
  exports: [AgentsService, ChatbotOrchestratorService],
})
export class AgentsModule {}
