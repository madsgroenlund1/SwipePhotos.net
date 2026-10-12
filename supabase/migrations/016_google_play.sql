-- Android (Google Play Billing) subscriptions
alter table users add column if not exists google_purchase_token text;
alter table users add column if not exists google_product_id text;
alter table users add column if not exists google_expires_at timestamptz;
alter table users add column if not exists google_auto_renew boolean;
alter table orders add column if not exists google_purchase_token text;
create unique index if not exists orders_google_purchase_token_key
  on orders (google_purchase_token) where google_purchase_token is not null;
