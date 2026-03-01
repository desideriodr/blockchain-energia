import { Module } from "@nestjs/common";
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from "cache-manager-ioredis-yet";

/* AppCacheModule — Adaptador de infraestructura Redis
 * 
 * Patrón: Adaptador (Hexagonal)
 * Mantenemos la separacion de responsabilidades
 * DashboardService solo interactúa con CACHE_MANAGER (puerto),
 * sin saber si el store es Redis, memoria u otro.
 *
 * isGlobal: true → modulo global 
 * aseguramos disponibilidad en todos los módulos sin necesidad
 * de importar AppCacheModule explícitamente en cada uno.
 *
 * Fallback: si REDIS_URL no está definida (desarrollo sin Docker por ahora),
 * usa store en memoria automáticamente — el código del servicio
 * no cambia en ninguno de los dos casos.
 */

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
          console.warn(' REDIS_URL no definida — usando caché en memoria');
          return { ttl: 5 * 60 * 1000 };
        }

        try {
          const url = new URL(redisUrl);
          const store = await redisStore({
            socket: {
              host: url.hostname,
              port: parseInt(url.port || '6379'),
            },
            password: url.password || undefined,
          });

          console.log(' Redis caché conectado');
          return { store, ttl: 5 * 60 * 1000 };

        } catch (error) {
          console.warn(' Redis no disponible — usando caché en memoria:', error.message);
          return { ttl: 5 * 60 * 1000 };
        }
      },
    }),
  ],
})
export class AppCacheModule {}