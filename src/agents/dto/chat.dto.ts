import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum AIModel {
  SONOMA_SKY_ALPHA = 'openrouter/sonoma-sky-alpha',
  GPT_4O_MINI = 'openai/gpt-4o-mini',
  CLAUDE_3_HAIKU = 'anthropic/claude-3-haiku',
  GPT_4 = 'openai/gpt-4',
}

export class ChatMessageDto {
  @ApiProperty({
    description: 'The user message to send to the AI',
    example: 'Find me a conference room for 10 people tomorrow at 2 PM',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'User ID for personalization (optional)',
    example: 'user_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'AI model to use',
    enum: AIModel,
    example: AIModel.SONOMA_SKY_ALPHA,
    required: false,
  })
  @IsOptional()
  @IsEnum(AIModel)
  model?: AIModel;

  @ApiProperty({
    description: 'Conversation context (optional)',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  context?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'AI-generated response',
    example: 'I found several conference rooms available tomorrow at 2 PM. Here are the best options for 10 people...',
  })
  response: string;

  @ApiProperty({
    description: 'Agent that handled the request',
    example: 'smart_space_discovery',
  })
  agent: string;

  @ApiProperty({
    description: 'Confidence score of the response',
    example: 0.95,
  })
  confidence: number;

  @ApiProperty({
    description: 'Suggested follow-up actions',
    type: [String],
    example: ['Book this space', 'View more options', 'Check availability'],
  })
  suggestions: string[];

  @ApiProperty({
    description: 'Available actions the user can take',
    type: [Object],
    example: [
      {
        type: 'book_space',
        spaceId: 'space_123',
        label: 'Book Conference Room A',
        data: { price: 50, duration: 2 }
      }
    ],
  })
  actions: Array<{
    type: string;
    label: string;
    data?: any;
  }>;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-01T14:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Usage statistics',
    example: {
      tokens_used: 150,
      response_time_ms: 1200,
      model_used: 'openrouter/sonoma-sky-alpha'
    },
  })
  usage?: {
    tokens_used: number;
    response_time_ms: number;
    model_used: string;
  };
}
