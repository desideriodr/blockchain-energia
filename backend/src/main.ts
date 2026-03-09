import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // ValidationPipe -> automatiza la validación y sanitización de DTOs/inputs
import { AppModule } from './app.module';
import helmet from 'helmet'; //helmet -> para headers HTTP seguros

function validateEnvVars(): void {
  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASS',
    'DB_NAME',
    'JWT_SECRET',
    'PLATFORM_PRIVATE_KEY',
    'BLOCKCHAIN_RPC',
    'WALLET_ENCRYPTION_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('Variables de entorno faltantes:', missing.join(', '));
    process.exit(1);
  }

  if ((process.env.JWT_SECRET ?? '').length < 32) {
    console.error('JWT_SECRET debe tener al menos 32 caracteres');
    process.exit(1);
  }

  if ((process.env.WALLET_ENCRYPTION_KEY ?? '').length !== 32) {
    console.error('WALLET_ENCRYPTION_KEY debe tener exactamente 32 caracteres (AES-256)');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnvVars();

  const app = await NestFactory.create(AppModule);

  // Helmet: configura headers HTTP de seguridad para producción.
  // Se relaja CSP en desarrollo para permitir usar GraphQL Playground.
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ValidationPipe global: valida todos los @InputType() de GraphQL.
  // whitelist elimina campos no declarados en el schema.
  // forbidNonWhitelisted lanza error si llegan campos extras.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL ?? 'http://localhost:4200')
        : ['http://localhost:4200', 'http://127.0.0.1:4200', 'https://localhost:4200', 'https://127.0.0.1:4200'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend corriendo en http://localhost:${port}/graphql`);
}

bootstrap();
