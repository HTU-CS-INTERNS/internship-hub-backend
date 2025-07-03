import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Enable CORS for frontend
  // app.setGlobalPrefix('api'); // Optional: set global prefix

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}`);
}
void bootstrap();
