import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigin = configService.get('CORS_ORIGIN') || 'http://localhost:3001';
  app.enableCors({
    origin: corsOrigin.split(',').map((o: string) => o.trim()),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI Media Buying Intelligence Platform API')
      .setDescription(
        'Production-grade API for AI-powered advertising decision intelligence',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Users')
      .addTag('Ad Accounts')
      .addTag('Dashboard')
      .addTag('Decisions')
      .addTag('AI')
      .addTag('Creatives')
      .addTag('Agent')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║   AI Media Buying Intelligence Platform - Backend    ║
    ║                                                       ║
    ║   Environment: ${configService.get('NODE_ENV')?.padEnd(37)}    ║
    ║   API URL:     http://localhost:${port}/${apiPrefix.padEnd(19)}    ║
    ║   Swagger:     http://localhost:${port}/api/docs${' '.repeat(13)}    ║
    ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
