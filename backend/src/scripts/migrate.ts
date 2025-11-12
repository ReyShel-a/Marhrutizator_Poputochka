import dotenv from 'dotenv';
import { runMigrations } from '../config/migrations';
import { pool } from '../config/database';

dotenv.config();

const migrate = async () => {
  try {
    await runMigrations();
    console.log('Migration script completed');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration script failed:', error);
    await pool.end();
    process.exit(1);
  }
};

migrate();
