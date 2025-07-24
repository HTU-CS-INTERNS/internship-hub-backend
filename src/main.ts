import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Helmet for security headers
  app.use(helmet());

  // Set Global API Prefix
  // app.setGlobalPrefix('api'); // <--- ADD THIS LINE!

  // --- ADD THIS CONSOLE.LOG ---
  console.log(`Backend is loading FRONTEND_URL as: ${process.env.FRONTEND_URL}`);
  // --- END CONSOLE.LOG ---


  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:9002', // Restrict to frontend URL in production
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}`);
}
void bootstrap();
