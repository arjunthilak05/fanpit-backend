import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AgentsService } from './agents.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat.dto';

@ApiTags('AI Agents')
@Controller('agents')
@Public()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check agents system health' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agents system is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 12345 },
        version: { type: 'string', example: '1.0.0' },
        services: {
          type: 'object',
          properties: {
            api: { type: 'string', example: 'healthy' },
            database: { type: 'string', example: 'connected' },
            ai: { type: 'string', example: 'ready' }
          }
        }
      }
    }
  })
  async getHealth() {
    return this.agentsService.getHealth();
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send message to AI chatbot' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI response generated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - message is required',
  })
  async chat(@Body() chatMessageDto: ChatMessageDto): Promise<ChatResponseDto> {
    return this.agentsService.processMessage(chatMessageDto);
  }

  @Get('agents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of available AI agents' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available agents',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'smart_space_discovery' },
          name: { type: 'string', example: 'Smart Space Discovery' },
          description: { type: 'string', example: 'Find and recommend perfect spaces' },
          capabilities: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['Natural language search', 'Vector search', 'Recommendations']
          },
          status: { type: 'string', example: 'active' }
        }
      }
    }
  })
  async getAgents() {
    return this.agentsService.getAvailableAgents();
  }
}
