import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// --------------------------------------
// 1️⃣ הגדרת חיבור למסד נתונים
// --------------------------------------
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    `❌ No database URL provided. Make sure ${
      isProduction ? 'DATABASE_URL' : 'LOCAL_DATABASE_URL'
    } is set in your .env`
  );
}

// --------------------------------------
// 2️⃣ יצירת Pool של חיבורים
// --------------------------------------
// Allow opting into SSL in dev if DB requires it (e.g., Render/local proxy)
const shouldUseSsl = isProduction || process.env.DB_SSL === 'true' || /sslmode=require/i.test(databaseUrl || '');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000, // 30 שניות במקום 2
  statement_timeout: 30000,
  query_timeout: 30000,
});

console.log(
  `🔗 Connected to ${isProduction ? 'Render (CLOUD)' : 'Local (DEV)'} database (SSL: ${shouldUseSsl ? 'on' : 'off'})`
);

// --------------------------------------
// 3️⃣ בדיקה פשוטה של חיבור למסד
// --------------------------------------
export const testConnection = async (): Promise<boolean> => {
  let client;
  try {
    console.log('Testing database connection...');
    client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('Retrying in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      client = await pool.connect();
      await client.query('SELECT NOW()');
      console.log('✅ Database connection successful on retry');
      return true;
    } catch (retryError) {
      console.error('❌ Database connection failed on retry:', retryError);
      return false;
    }
  } finally {
    if (client) client.release();
  }
};

// --------------------------------------
// 4️⃣ פונקציה להרצת שאילתות
// --------------------------------------
export const query = async (text: string, params: any[] = []): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// --------------------------------------
// 5️⃣ קבלת client מה-Pool (לטרנזקציות)
// --------------------------------------
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// --------------------------------------
// 6️⃣ אתחול מסד נתונים (יצירת טבלאות אם לא קיימות)
// --------------------------------------
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database...');

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'agent',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        full_name TEXT,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// --------------------------------------
// 7️⃣ סגירת Pool בצורה נקייה
// --------------------------------------
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

// --------------------------------------
// 8️⃣ export ברירת מחדל
// --------------------------------------
export default pool;