import pg from 'pg';import {readFileSync} from 'node:fs';
if(!process.env.DATABASE_URL_UNPOOLED || process.env.CONFIRM_DEV_DATABASE!=='yes')throw Error('Set direct DATABASE_URL_UNPOOLED and CONFIRM_DEV_DATABASE=yes only for an isolated development database.');
const db=new pg.Client({connectionString:process.env.DATABASE_URL_UNPOOLED});await db.connect();
try{await db.query('BEGIN');await db.query("SELECT pg_advisory_xact_lock(43174317)");for(const f of ['001.sql','002-postgres.sql','003-credentials.sql'])await db.query(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));await db.query('COMMIT');console.log('Migrations applied.');}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
