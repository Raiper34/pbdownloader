import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = app.get(ConfigService);

  // Ensure downloads directory exists
  const downloadsDir = config.get<string>('downloadsPath')!;
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const port = config.get<number>('port')!;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
