# BloggWatch — Next.js + MySQL migration

This repository contains the original Express/static app plus a Next.js skeleton in `next-app/` with a MySQL schema.

Quick steps to convert and run the Next.js app locally:

1. Install dependencies for the Next.js app

```powershell
cd next-app
npm install
```

2. Configure MySQL credentials

Copy `next-app/.env.example` to `next-app/.env` and set `DB_HOST`, `DB_USER`, `DB_PASS`, and `DB_NAME`.

3. Create the database and run migrations

Either run the SQL migration directly or use the included script:

```powershell
# from repo root
cd next-app
# create database in your MySQL server then run migrate script
node scripts/migrate.js
```

4. Import existing `database.json` data into MySQL

From the repository root (the script expects `database.json` at repo root):

```powershell
node next-app/scripts/import_db.js
```

This will:
- Hash and insert users
- Insert posts (preserving numeric IDs where possible)
- Insert reactions

5. Copy uploads

If you have files in `public/uploads/` you should copy them into `next-app/public/uploads/` so the Next.js app serves the same images.

6. Start the Next.js app

```powershell
cd next-app
npm run dev
# or from repo root:
# npm run start-next
```

If you hit errors, paste the terminal output here and I will help resolve them.
