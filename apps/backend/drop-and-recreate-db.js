const { Client } = require('pg');

async function dropAndRecreateDatabase() {
  // Connect to postgres database (not demi_db)
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres123',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'demi_db'
        AND pid <> pg_backend_pid();
    `);
    console.log('Terminated existing connections');

    // Drop database
    await client.query('DROP DATABASE IF EXISTS demi_db;');
    console.log('Dropped database: demi_db');

    // Create database
    await client.query('CREATE DATABASE demi_db;');
    console.log('Created database: demi_db');

    console.log('\n✅ Database successfully recreated!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dropAndRecreateDatabase();
