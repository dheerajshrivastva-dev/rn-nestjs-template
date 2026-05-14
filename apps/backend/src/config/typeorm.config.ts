import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_DATABASE || 'forge_db',

  // Entity paths - includes both module and common entities
  entities: [
    __dirname + '/../**/*.entity{.ts,.js}',
  ],

  // Migration configuration
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  // IMPORTANT: Set to false in production
  // For test environment, auto-sync schema
  synchronize: process.env.NODE_ENV === 'test' ? true : false,

  // Enable logging for debugging migrations
  logging: process.env.DB_LOGGING === 'true',

  // Connection pool settings
  extra: {
    max: 50,
    min: 10,
  },
};

// Create and export the DataSource instance (required for TypeORM CLI)
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;