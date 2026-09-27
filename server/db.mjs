import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import pg from 'pg';
import {AsyncLocalStorage} from 'node:async_hooks';
const context=new AsyncLocalStorage();let queue=Promise.resolve();const locked=fn=>{const p=queue.then(fn,fn);queue=p.catch(()=>{});return p;};
export const postgres = Boolean(process.env.DATABASE_URL);
let sqlite, pool;
if(postgres) pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:5000});
else {if(process.env.NODE_ENV==='production')throw Error('Production requires PostgreSQL');mkdirSync('.local',{recursive:true});sqlite=new DatabaseSync(process.env.TEST_DB||'.local/coach.sqlite');sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');}
async function rawQuery(sql,params=[]){
 if(pool){let n=0;return (await (context.getStore()?.client||pool).query(sql.replace(/\?/g,()=>`$${++n}`),params)).rows;}
 const statement=sqlite.prepare(sql); return statement.columns().length ? statement.all(...params) : (statement.run(...params),[]);
}
export async function query(sql,params=[]){return pool||context.getStore()?rawQuery(sql,params):locked(()=>rawQuery(sql,params));}
export async function transaction(fn){
 if(pool){const client=await pool.connect();try{await client.query('BEGIN');const result=await context.run({client},fn);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
 return locked(async()=>{sqlite.exec('BEGIN IMMEDIATE');try{const result=await context.run({local:true},fn);sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}});
}
export async function init(){
 if(postgres){await query('SELECT id FROM users LIMIT 1');return;}
 sqlite.exec(readFileSync(new URL('../migrations/001.sql',import.meta.url),'utf8'));
 sqlite.exec("CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(id UNINDEXED,title,body,tokenize='unicode61');");
}
export async function indexArticle(a){if(!postgres){await query('DELETE FROM articles_fts WHERE id=?',[a.id]);await query('INSERT INTO articles_fts(id,title,body) VALUES(?,?,?)',[a.id,a.title,a.body]);}}
export async function search(q,topic,offset=0){
 const args=[];let where="a.status='published'";if(topic){where+=' AND a.topic=?';args.push(topic);}
 if(q){if(postgres){where+=" AND a.search_vector @@ websearch_to_tsquery('russian', ?)";args.push(q);}else{const terms=q.match(/[\p{L}\p{N}]+/gu)||[];if(!terms.length)return [];where+=' AND a.id IN (SELECT id FROM articles_fts WHERE articles_fts MATCH ?)';args.push(terms.map(x=>'"'+x+'"*').join(' AND '));}}
 return query(`SELECT a.* FROM articles a WHERE ${where} ORDER BY a.sort_order,a.title LIMIT 40 OFFSET ?`,[...args,offset]);
}
export async function close(){if(pool)await pool.end();else sqlite.close();}
