# BloggWatch — Next.js + MySQL (migration)

This folder contains a minimal Next.js + MySQL skeleton that implements the missing assignment requirements:

- Next.js frontend pages + API routes
- MySQL connection helper
- SQL migration to create at least 6 tables
- Auth (register/login) with password hashing (bcrypt)
- Media upload endpoint for profile pictures

Quick start (local):

1) Create a MySQL database and user.
2) Copy .env.example to .env and set DB_* values.
3) From next-app run `npm install` then run the migration SQL (see db/migrations/create_schema.sql).
4) Start dev server: npm run dev

Wiping MySQL tables
- If you need to completely wipe the MySQL tables created by the migration, I added a helper script: `npm run wipe-db` (runs `next-app/scripts/wipe_db.js`).
	- Make sure `next-app/.env` is present and points to your MySQL instance before running the wipe script.
