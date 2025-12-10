const pool = require('../lib/db');

async function run(){
  try{
    console.log('Starting wipe — this will TRUNCATE tables: notifications,reactions,media,comments,sessions,posts,users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE notifications');
    await pool.query('TRUNCATE TABLE reactions');
    await pool.query('TRUNCATE TABLE media');
    await pool.query('TRUNCATE TABLE comments');
    await pool.query('TRUNCATE TABLE sessions');
    await pool.query('TRUNCATE TABLE posts');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Wipe complete.');
    process.exit(0);
  }catch(err){
    console.error('wipe_db error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
