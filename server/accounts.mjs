import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {rateLimit} from 'express-rate-limit';
import {query,transaction} from './db.mjs';
import {normalizeLogin,hashPassword,verifyPassword} from './passwords.mjs';
const dummy=await hashPassword(randomUUID());
const password=z.string().min(10).max(128);
const username=z.string().max(80).transform(normalizeLogin).pipe(z.string().regex(/^[\p{L}\p{N}_-]{3,40}$/u));
const schema=z.object({username,password});
async function establish(req,id,version){await new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));req.session.userId=id;req.session.authVersion=version;await new Promise((resolve,reject)=>req.session.save(e=>e?reject(e):resolve()));}
export async function authenticatedUser(req){if(!req.session.userId)return null;const user=(await query('SELECT * FROM users WHERE id=?',[req.session.userId]))[0];if(!user)return null;const credential=(await query('SELECT login,version FROM credentials WHERE user_id=?',[user.id]))[0];if(credential&&credential.version!==req.session.authVersion)return null;return {...user,login:credential?.login,canChangePassword:Boolean(credential)};}
export function installAccounts(app,requireUser){
const limit=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:true,legacyHeaders:false,message:{error:'Слишком много попыток. Попробуйте через 15 минут.'}});
app.post('/api/auth/register',limit,async(req,res)=>{const b=schema.parse(req.body),hash=await hashPassword(b.password),id='account:'+randomUUID();try{await transaction(async()=>{await query('INSERT INTO users(id,name,role,created_at) VALUES(?,?,?,?)',[id,req.body.username.normalize('NFKC').trim(),'user',new Date().toISOString()]);await query('INSERT INTO credentials(login,user_id,password_hash,created_at) VALUES(?,?,?,?)',[b.username,id,hash,new Date().toISOString()]);});}catch(e){if(e.code==='23505'||String(e.message).includes('UNIQUE constraint'))return res.status(409).json({error:'Это имя уже занято. Выберите другое.'});throw e;}await establish(req,id,1);res.status(201).json({ok:true});});
app.post('/api/auth/login',limit,async(req,res)=>{const b=schema.parse(req.body),c=(await query('SELECT * FROM credentials WHERE login=?',[b.username]))[0];const valid=await verifyPassword(b.password,c?.password_hash||dummy);if(!c||!valid)return res.status(401).json({error:'Неверное имя или пароль.'});await establish(req,c.user_id,c.version);res.json({ok:true});});
app.post('/api/profile/password',requireUser,limit,async(req,res)=>{const b=z.object({currentPassword:password,newPassword:password}).parse(req.body);const c=(await query('SELECT * FROM credentials WHERE user_id=?',[req.user.id]))[0];if(!c||!await verifyPassword(b.currentPassword,c.password_hash))return res.status(400).json({error:'Текущий пароль указан неверно.'});if(b.currentPassword===b.newPassword)return res.status(400).json({error:'Новый пароль должен отличаться от текущего.'});const hash=await hashPassword(b.newPassword);const rows=await query('UPDATE credentials SET password_hash=?,version=version+1 WHERE user_id=? AND version=? RETURNING version',[hash,req.user.id,c.version]);if(!rows.length)return res.status(409).json({error:'Пароль уже изменён. Войдите заново.'});await establish(req,req.user.id,rows[0].version);res.json({ok:true});});
}
