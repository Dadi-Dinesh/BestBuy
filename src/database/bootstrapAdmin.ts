import { config } from 'dotenv';
import { createPostgresPool } from './postgres';
import { hashPassword } from './passwords';
import { adminInput } from './validation';

async function createAdmin() {
  config({ path: process.env.BESTBUY_ENV_FILE || '.env', quiet: true });
  const parsed = adminInput.safeParse({
    email: process.env.BESTBUY_ADMIN_EMAIL,
    name: process.env.BESTBUY_ADMIN_NAME,
    password: process.env.BESTBUY_ADMIN_PASSWORD,
  });
  if (!parsed.success) throw new Error('Set BESTBUY_ADMIN_EMAIL, BESTBUY_ADMIN_NAME, and a password of at least 12 characters.');
  const pool = createPostgresPool(process.env.DATABASE_URL);
  try {
    const { email, name, password } = parsed.data;
    const result = await pool.query(
      "INSERT INTO bestbuy.users(email,name,password_hash,role) VALUES ($1,$2,$3,'admin') ON CONFLICT (email) DO NOTHING",
      [email, name, await hashPassword(password)],
    );
    if (!result.rowCount) throw new Error('An account already uses that email address.');
    console.log('Administrator account created.');
  } finally { await pool.end(); }
}

void createAdmin().catch((error: Error & { code?: string }) => {
  if (error.code) console.error('Administrator setup failed.', error.code);
  else console.error('Administrator setup failed.', error.message);
  process.exitCode = 1;
});
