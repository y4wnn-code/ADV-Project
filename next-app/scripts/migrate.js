const fs = require('fs');
const pool = require('../lib/db');

async function run(){
  try{
    const sql = fs.readFileSync(__dirname + '/../db/migrations/create_schema.sql', 'utf8');
    
    const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for(const s of stmts){
      await pool.query(s);
    }
    console.log('Migrations applied.');
    process.exit(0);
  }catch(err){
    console.error('Migration failed', err);
    process.exit(1);
  }
}

run();
