import {scrypt,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt),options={N:32768,r:8,p:1,maxmem:64*1024*1024};
export const normalizeLogin=s=>s.normalize('NFKC').trim().toLocaleLowerCase('ru');
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');return `scrypt$${salt}$${(await derive(password,salt,64,options)).toString('hex')}`;}
export async function verifyPassword(password,hash){const [kind,salt,key]=String(hash).split('$');if(kind!=='scrypt'||! /^[a-f0-9]{32}$/.test(salt)||! /^[a-f0-9]{128}$/.test(key))return false;return timingSafeEqual(await derive(password,salt,64,options),Buffer.from(key,'hex'));}
