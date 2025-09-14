import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openRouterApiKey: string;
  private readonly openRouterBaseUrl = 'https://openrouter.ai/api/v1';

  constructor(private readonly configService: ConfigService) {
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    model: string = 'openrouter/sonoma-sky-alpha',
    maxTokens: number = 1000,
    temperature: number = 0.7,
  ): Promise<{
    response: string;
    usage?: {
      tokens_used: number;
      model_used: string;
    };
  }> {
    try {
      const startTime = Date.now();

      if (!this.openRouterApiKey) {
        this.logger.warn('No OpenRouter API key configured, using fallback response');
        return {
          response: 'I\'m here to help! However, I need an OpenRouter API key to provide AI-powered responses. Please configure OPENROUTER_API_KEY in your environment.',
          usage: {
            tokens_used: 0,
            model_used: 'fallback',
          },
        };
      }

      const response = await fetch(`${this.openRouterBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://github.com/fanpit-platform',
          'X-Title': 'Fanpit Platform AI Agents',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          // Payment required - fallback response
          this.logger.warn('OpenRouter API payment required, using fallback');
          return {
            response: 'I understand your request, but I\'m currently running on limited resources. I can still help you with basic information about space booking, pricing, and event planning. What would you like to know?',
            usage: {
              tokens_used: 0,
              model_used: 'fallback',
            },
          };
        }
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      const responseTime = Date.now() - startTime;

      this.logger.log(`Generated response in ${responseTime}ms using model: ${model}`);

      return {
        response: aiResponse,
        usage: {
          tokens_used: data.usage?.total_tokens || 0,
          model_used: model,
        },
      };
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      
      // Fallback response
      return {
        response: 'I\'m experiencing some technical difficulties, but I\'m still here to help! Could you please rephrase your question or let me know what specific information you need about our platform?',
        usage: {
          tokens_used: 0,
          model_used: 'fallback',
        },
      };
    }
  }

  createSystemPrompt(agentType: string): string {
    const basePrompt = `You are Fanpit AI, an intelligent assistant for a premium space booking platform. You help users discover, book, and manage workspace rentals.`;

    const agentPrompts = {
      smart_space_discovery: `${basePrompt}

ROLE: Smart Space Discovery Agent
EXPERTISE: Finding and recommending perfect spaces based on user needs

CAPABILITIES:
- Natural language understanding of space requirements
- Semantic search through space descriptions and amenities
- Personalized recommendations based on user history
- Real-time availability checking
- Location-based suggestions

RESPONSE STYLE: Helpful, informative, and action-oriented. Always provide specific space suggestions with key details.`,

      intelligent_booking: `${basePrompt}

ROLE: Intelligent Booking Assistant
EXPERTISE: Optimizing bookings and scheduling

CAPABILITIES:
- Smart time slot optimization
- Calendar integration and conflict detection
- Price optimization suggestions
- Booking confirmation and management
- Scheduling recommendations

RESPONSE STYLE: Efficient and precise. Focus on optimal booking solutions and time management.`,

      dynamic_pricing: `${basePrompt}

ROLE: Dynamic Pricing AI
EXPERTISE: Real-time pricing analysis and revenue optimization

CAPABILITIES:
- Demand forecasting and trend analysis
- Competitor price monitoring
- Revenue optimization strategies
- Market insights and recommendations
- Price alerts and notifications

RESPONSE STYLE: Data-driven and analytical. Provide clear pricing insights with actionable recommendations.`,

      event_planning: `${basePrompt}

ROLE: Event Planning Assistant
EXPERTISE: Complete event coordination and planning

CAPABILITIES:
- End-to-end event requirement analysis
- Venue selection and optimization
- Vendor recommendations and coordination
- Budget planning and optimization
- Timeline and checklist generation

RESPONSE STYLE: Comprehensive and organized. Provide detailed plans with clear next steps.`,

      virtual_concierge: `${basePrompt}

ROLE: Virtual Concierge
EXPERTISE: Customer support and platform assistance

CAPABILITIES:
- 24/7 customer support and guidance
- Platform feature explanations
- Issue resolution and troubleshooting
- Account management assistance
- General inquiries and help

RESPONSE STYLE: Friendly, professional, and solution-focused. Always aim to resolve issues quickly.`,
    };

    return agentPrompts[agentType] || agentPrompts.virtual_concierge;
  }
}
