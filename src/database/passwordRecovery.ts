import { config } from 'dotenv';
import { createHash,randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { createPostgresPool } from './postgres';
import { hashPassword } from './passwords';

const digest=(token:string)=>createHash('sha256').update(token).digest('hex');

export async function redeemRecovery(pool:Pool,token:unknown,password:unknown) {
  if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token)||typeof password!=='string'||password.length<12||password.length>256)
    return {success:false,error:'Enter a valid recovery code and a password of 12–256 characters.'};
  const db=await pool.connect();
  try{
    await db.query('BEGIN');
    const owner=await db.query(`SELECT u.id FROM bestbuy.users u JOIN bestbuy.password_recovery r ON r.user_id=u.id
      WHERE r.token_hash=$1 AND r.expires_at>now() AND u.status='active' FOR UPDATE OF u`,[digest(token)]);
    if(!owner.rowCount){await db.query('ROLLBACK');return {success:false,error:'This recovery code is invalid or expired.'};}
    const code=await db.query('DELETE FROM bestbuy.password_recovery WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',[digest(token)]);
    if(!code.rowCount){await db.query('ROLLBACK');return {success:false,error:'This recovery code is invalid or expired.'};}
    await db.query('UPDATE bestbuy.users SET password_hash=$2 WHERE id=$1',[code.rows[0].user_id,await hashPassword(password)]);
    await db.query('DELETE FROM bestbuy.password_recovery WHERE user_id=$1',[code.rows[0].user_id]);
    await db.query('COMMIT');
    return {success:true};
  }catch{await db.query('ROLLBACK');return {success:false,error:'Password recovery is temporarily unavailable.'};}
  finally{db.release();}
}

export async function issueRecovery(pool:Pool,email:string) {
  const token=randomBytes(32).toString('base64url');
  const db=await pool.connect();
  try{
    await db.query('BEGIN');
    const user=await db.query("SELECT id FROM bestbuy.users WHERE email=$1 AND status='active' FOR UPDATE",[email.trim().toLowerCase()]);
    if(!user.rowCount)throw new Error('An active account was not found.');
    const id=user.rows[0].id;
    await db.query('DELETE FROM bestbuy.password_recovery WHERE user_id=$1',[id]);
    await db.query("INSERT INTO bestbuy.password_recovery(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '30 minutes')",[digest(token),id]);
    await db.query('COMMIT');
    return token;
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}

if(require.main===module){
  config({path:process.env.BESTBUY_ENV_FILE||'.env',quiet:true});
  void (async()=>{
    const email=process.argv[2];
    if(!email)throw new Error('Specify the account email after --.');
    const pool=createPostgresPool(process.env.DATABASE_URL);
    try{console.log(await issueRecovery(pool,email));}finally{await pool.end();}
  })().catch(error=>{console.error('Recovery code could not be issued.',error.code||error.message);process.exitCode=1;});
}
