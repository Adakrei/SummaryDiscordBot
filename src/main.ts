import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables directly
dotenv.config();

async function bootstrap() {
    // Log environment file status
    const envPath = path.resolve(process.cwd(), '.env');
    console.log(`Checking for .env file at: ${envPath}`);
    console.log(`.env file exists: ${fs.existsSync(envPath)}`);

    if (fs.existsSync(envPath)) {
        console.log('.env file found');
    }

    // Create and start the application
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('application.port') || 3000;

    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
