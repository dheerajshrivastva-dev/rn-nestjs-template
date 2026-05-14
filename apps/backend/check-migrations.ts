import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: true,
});

async function checkMigrations() {
  await dataSource.initialize();
  const result = await dataSource.query('SELECT * FROM migrations ORDER BY id ASC');
  console.log('Executed migrations:');
  result.forEach((m: any) => console.log(`- ${m.name} (${m.timestamp})`));
  await dataSource.destroy();
}

checkMigrations().catch(console.error);
