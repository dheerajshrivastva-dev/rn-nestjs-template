import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  // IMPORTANT: synchronize should ALWAYS be false in production
  // Migrations are the safe way to manage schema changes
  synchronize: false,

  // Run migrations automatically on app start (optional - disable in production)
  migrationsRun: configService.get<boolean>('DB_MIGRATIONS_RUN') || false,

  logging: configService.get<boolean>('DB_LOGGING'),
  autoLoadEntities: true,
  extra: {
    max: 50, // Maximum pool size
    min: 10, // Minimum pool size
  },
});
