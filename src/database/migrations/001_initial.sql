CREATE SCHEMA IF NOT EXISTS bestbuy;
SET LOCAL search_path TO bestbuy, pg_catalog;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(trim(email))),
  password_hash text NOT NULL,
  name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('customer','dealer','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE customers (user_id uuid PRIMARY KEY REFERENCES users(id));
CREATE TABLE dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id),
  name text NOT NULL,
  registration_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  profile jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX dealers_registration ON dealers (lower(trim(registration_number)));
CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  UNIQUE (name,state)
);
CREATE UNIQUE INDEX city_identity ON cities (lower(regexp_replace(trim(name), '[[:space:]]+', ' ', 'g')), lower(trim(state)));
CREATE TABLE dealer_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id),
  city_id uuid NOT NULL REFERENCES cities(id),
  address text NOT NULL,
  postal_code text NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  UNIQUE (id,dealer_id)
);
CREATE UNIQUE INDEX dealer_primary_location ON dealer_locations (dealer_id) WHERE is_primary;
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL
);
CREATE UNIQUE INDEX vehicle_identity ON vehicles (lower(regexp_replace(trim(brand), '[[:space:]]+', ' ', 'g')), lower(regexp_replace(trim(model), '[[:space:]]+', ' ', 'g')));
CREATE TABLE vehicle_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  name text NOT NULL
);
CREATE UNIQUE INDEX variant_identity ON vehicle_variants (vehicle_id,lower(regexp_replace(trim(name), '[[:space:]]+', ' ', 'g')));
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES dealers(id),
  location_id uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES vehicle_variants(id),
  details jsonb NOT NULL,
  dealer_price numeric(14,2) NOT NULL CHECK (dealer_price > 0),
  ex_showroom numeric(14,2) NOT NULL CHECK (ex_showroom > 0),
  on_road numeric(14,2) NOT NULL CHECK (on_road > 0),
  quantity integer NOT NULL CHECK (quantity >= 0),
  availability text NOT NULL CHECK (availability IN ('available','reserved','out_of_stock','sold')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  FOREIGN KEY (location_id,dealer_id) REFERENCES dealer_locations(id,dealer_id),
  UNIQUE (id,dealer_id)
);
CREATE INDEX inventory_dealer ON inventory (dealer_id) WHERE deleted_at IS NULL;
CREATE INDEX inventory_variant ON inventory (variant_id,location_id) WHERE deleted_at IS NULL;
CREATE TABLE price_changes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES inventory(id),
  previous_price numeric(14,2) NOT NULL CHECK (previous_price > 0),
  new_price numeric(14,2) NOT NULL CHECK (new_price > 0),
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX price_changes_listing ON price_changes (listing_id,id);
CREATE TABLE shared_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES vehicle_variants(id),
  city_id uuid NOT NULL REFERENCES cities(id),
  last_position integer NOT NULL DEFAULT 0 CHECK (last_position >= 0),
  UNIQUE (variant_id,city_id)
);
CREATE TABLE queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES shared_queues(id),
  customer_id uuid NOT NULL REFERENCES customers(user_id),
  position integer NOT NULL CHECK (position > 0),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','offered','booked','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (queue_id,position),
  UNIQUE (id,customer_id)
);
CREATE UNIQUE INDEX queue_one_active_customer ON queue_entries(queue_id,customer_id) WHERE status IN ('waiting','offered');
CREATE INDEX queue_customer_history ON queue_entries (customer_id,created_at DESC);
CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id uuid,
  customer_id uuid NOT NULL REFERENCES customers(user_id),
  dealer_id uuid NOT NULL REFERENCES dealers(id),
  listing_id uuid NOT NULL,
  details jsonb NOT NULL,
  offered_price numeric(14,2) NOT NULL CHECK (offered_price > 0),
  original_price numeric(14,2) NOT NULL CHECK (original_price > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at),
  FOREIGN KEY (listing_id,dealer_id) REFERENCES inventory(id,dealer_id),
  FOREIGN KEY (queue_entry_id,customer_id) REFERENCES queue_entries(id,customer_id),
  UNIQUE (id,customer_id,listing_id,dealer_id)
);
CREATE INDEX offers_customer ON offers (customer_id,created_at DESC);
CREATE INDEX offers_dealer ON offers (dealer_id,created_at DESC);
CREATE INDEX offers_expiry ON offers (expires_at) WHERE status = 'pending';
CREATE INDEX offers_queue ON offers (queue_entry_id) WHERE status = 'pending';
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(user_id),
  dealer_id uuid NOT NULL REFERENCES dealers(id),
  listing_id uuid NOT NULL,
  offer_id uuid UNIQUE,
  details jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','payment_pending','booked','cancelled','expired','completed')),
  booked_for timestamptz NOT NULL,
  locked_price numeric(14,2) NOT NULL CHECK (locked_price > 0),
  lock_hours integer NOT NULL CHECK (lock_hours IN (24,48,72,168)),
  locked_until timestamptz NOT NULL,
  status_history jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (listing_id,dealer_id) REFERENCES inventory(id,dealer_id),
  FOREIGN KEY (offer_id,customer_id,listing_id,dealer_id) REFERENCES offers(id,customer_id,listing_id,dealer_id)
);
CREATE INDEX bookings_customer ON bookings (customer_id,created_at DESC);
CREATE INDEX bookings_dealer ON bookings (dealer_id,created_at DESC);
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info','success','warning','error')),
  category text NOT NULL CHECK (category IN ('offer','booking','queue','system')),
  link_to text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user ON notifications (user_id,created_at DESC);
CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES users(id),
  target_id uuid NOT NULL,
  action text NOT NULL,
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_target ON audit_logs (target_id,created_at DESC);
