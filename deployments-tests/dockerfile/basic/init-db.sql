CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO messages (id, title, body) VALUES
  (1, 'Dockerfile detected', 'Aeroplane built this Postgres image with docker build.'),
  (2, 'Postgres seeded', 'This row was inserted by docker-entrypoint-initdb.d/init-db.sql.'),
  (3, 'Data ready', 'Connect to the database and select from the messages table.');
