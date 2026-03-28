import { Module } from "@nestjs/common";
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from "cache-manager-ioredis-yet";

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
          console.warn('REDIS_URL no definida — usando cache en memoria');
          return { ttl: 5 * 60 * 1000 };
        }

        try {
          const url = new URL(redisUrl);
          const isTls = url.protocol === 'rediss:';

          const store = await redisStore({
            socket: {
              host: url.hostname,
              port: parseInt(url.port || '6379'),
              tls: isTls,
            },
            password: url.password || undefined,
          });

          console.log('Redis cache conectado');
          return { store, ttl: 5 * 60 * 1000 };

        } catch (error) {
          console.warn('Redis no disponible — usando cache en memoria:', error.message);
          return { ttl: 5 * 60 * 1000 };
        }
      },
    }),
  ],
})
export class AppCacheModule {}
