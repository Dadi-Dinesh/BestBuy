ALTER TABLE bestbuy.inventory ADD COLUMN currency text CHECK (currency = 'INR');
ALTER TABLE bestbuy.inventory ALTER COLUMN currency SET DEFAULT 'INR';
ALTER TABLE bestbuy.offers ADD COLUMN currency text CHECK (currency = 'INR');
ALTER TABLE bestbuy.offers ALTER COLUMN currency SET DEFAULT 'INR';
ALTER TABLE bestbuy.bookings ADD COLUMN currency text CHECK (currency = 'INR');
ALTER TABLE bestbuy.bookings ALTER COLUMN currency SET DEFAULT 'INR';

CREATE TABLE bestbuy.demo_seed_records (
  seed_key text PRIMARY KEY,
  record_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bestbuy.password_recovery (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES bestbuy.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
