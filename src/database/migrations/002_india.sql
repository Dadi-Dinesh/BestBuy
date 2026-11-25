CREATE TABLE bestbuy.india_catalogue (
  id text PRIMARY KEY,
  details jsonb NOT NULL
);
CREATE UNIQUE INDEX india_catalogue_identity ON bestbuy.india_catalogue
  (lower(trim(details->>'manufacturer')),lower(trim(details->>'model')));

CREATE TABLE bestbuy.test_drive_slots (
  dealer_id uuid REFERENCES bestbuy.dealers(id),
  day date NOT NULL,
  slot text NOT NULL CHECK (slot IN ('10:00','11:00','12:00','14:00','15:00','16:00','17:00')),
  is_open boolean NOT NULL,
  PRIMARY KEY (dealer_id,day,slot)
);
CREATE TABLE bestbuy.test_drives (
  id uuid PRIMARY KEY,
  dealer_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES bestbuy.customers(user_id),
  listing_id uuid NOT NULL,
  day date NOT NULL,
  slot text NOT NULL,
  status text NOT NULL CHECK (status IN ('requested','confirmed','rejected','cancelled','completed')),
  details jsonb NOT NULL,
  FOREIGN KEY (listing_id,dealer_id) REFERENCES bestbuy.inventory(id,dealer_id),
  FOREIGN KEY (dealer_id,day,slot) REFERENCES bestbuy.test_drive_slots(dealer_id,day,slot)
);
CREATE UNIQUE INDEX test_drive_slot_occupied ON bestbuy.test_drives(dealer_id,day,slot)
  WHERE status IN ('requested','confirmed','completed');
CREATE INDEX test_drive_customer_date ON bestbuy.test_drives(customer_id,day DESC);
CREATE INDEX test_drive_dealer_date ON bestbuy.test_drives(dealer_id,day DESC);

CREATE TABLE bestbuy.india_marketplace_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  booking_horizon integer NOT NULL CHECK (booking_horizon BETWEEN 7 AND 120)
);
INSERT INTO bestbuy.india_marketplace_settings(booking_horizon) VALUES (60);
