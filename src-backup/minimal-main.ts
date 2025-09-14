import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MinimalAppModule } from './minimal-app.module';

async function bootstrap() {
  const app = await NestFactory.create(MinimalAppModule);
  
  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:3002',
      'https://your-frontend-app.vercel.app', // Update this to your Vercel URL
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend running on: http://localhost:${port}/api/v1`);
}

bootstrap().catch(console.error);
