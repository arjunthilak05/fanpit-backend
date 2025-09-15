import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalAuthGuard } from './common/guards/global-auth.guard';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://fanpit-frontend.vercel.app'
  ];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global guards
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new GlobalAuthGuard(reflector));

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Serve static files from uploads directory
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Fanpit Space Booking Platform API')
    .setDescription('Production-ready API for space booking platform with comprehensive features')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Spaces', 'Space management for brand owners')
    .addTag('Bookings', 'Reservation and booking management')
    .addTag('Payments', 'Payment processing with Razorpay')
    .addTag('Staff', 'Staff dashboard for check-ins/check-outs')
    .addTag('Analytics', 'Analytics and reporting for brand owners')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
  logger.log(`📚 Swagger docs available at: ${await app.getUrl()}/api/docs`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🔗 Allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});