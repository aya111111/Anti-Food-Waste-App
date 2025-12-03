CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  expiry_date DATE,
  is_shareable BOOLEAN DEFAULT false,
  image_url TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  user_id INTEGER REFERENCES users(id),
  role TEXT DEFAULT 'member'
);

CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  claimer_id INTEGER REFERENCES users(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  claimed_at TIMESTAMP DEFAULT now()
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT,
  payload JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
