import type { Pool } from 'pg';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { emptyIndiaData, type IndiaStore, type IndiaData } from '../services/indiaMarketplace';

export function fileIndiaStore(path: string): IndiaStore {
  let pending: Promise<unknown> = Promise.resolve();
  return { run(write,operation) {
    const work=pending.then(async()=>{
      const data=await readFile(path,'utf8').then(text=>JSON.parse(text) as IndiaData,error=>{
        if (error.code==='ENOENT') return emptyIndiaData();
        throw error;
      });
      const result=operation(data);
      if (write) {
        await writeFile(path+'.tmp',JSON.stringify(data),{mode:0o600});
        await rename(path+'.tmp',path);
      }
      return result;
    });
    pending=work.catch(()=>undefined);
    return work;
  } };
}

export function postgresIndiaStore(pool:Pool):IndiaStore {
  return { async run(write,operation,scope) {
    const db=await pool.connect();
    try {
      await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
      // Serialize the snapshot-to-delta write path across desktop installations.
      // READ COMMITTED takes a fresh snapshot after waiting for this transaction lock.
      if (write) {
        await db.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await db.query("SELECT pg_advisory_xact_lock(hashtext('bestbuy:india-marketplace'))");
      }
      const catalogue=await db.query<{details:IndiaData['catalogue'][number]}>('SELECT details FROM bestbuy.india_catalogue');
      const slots=scope==='catalogue' ? [] : (await db.query<IndiaData['slots'][number]>(
        `SELECT dealer_id AS "dealerId",day::text AS date,slot AS time,is_open AS open FROM bestbuy.test_drive_slots`)).rows;
      const drives=scope==='catalogue' ? [] : (await db.query<{details:IndiaData['drives'][number]}>(
        'SELECT details FROM bestbuy.test_drives ORDER BY day,slot')).rows.map(row=>row.details);
      const bookingHorizon=scope==='catalogue' ? undefined : (await db.query<{booking_horizon:number}>(
        'SELECT booking_horizon FROM bestbuy.india_marketplace_settings')).rows[0]?.booking_horizon;
      const data:IndiaData={ catalogue:catalogue.rows.map(row=>row.details),slots,drives,bookingHorizon };
      const previous=new Map([...data.catalogue,...data.drives].map(item=>[item.id,JSON.stringify(item)]));
      const previousSlots=new Map(data.slots.map(slot=>[`${slot.dealerId}/${slot.date}/${slot.time}`,slot.open]));
      const result=operation(data);
      if (write) {
        if(data.bookingHorizon!==bookingHorizon) await db.query('UPDATE bestbuy.india_marketplace_settings SET booking_horizon=$1',[data.bookingHorizon]);
        for (const car of data.catalogue.filter(item=>previous.get(item.id)!==JSON.stringify(item))) {
          await db.query('INSERT INTO bestbuy.india_catalogue(id,details) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET details=excluded.details',[car.id,car]);
        }
        for (const slot of data.slots.filter(item=>previousSlots.get(`${item.dealerId}/${item.date}/${item.time}`)!==item.open)) {
          await db.query(`INSERT INTO bestbuy.test_drive_slots(dealer_id,day,slot,is_open) VALUES ($1,$2,$3,$4)
            ON CONFLICT(dealer_id,day,slot) DO UPDATE SET is_open=excluded.is_open`,[slot.dealerId,slot.date,slot.time,slot.open]);
        }
        for (const drive of data.drives.filter(item=>previous.get(item.id)!==JSON.stringify(item))) {
          await db.query(`INSERT INTO bestbuy.test_drives(id,dealer_id,customer_id,listing_id,day,slot,status,details)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE
            SET day=excluded.day,slot=excluded.slot,status=excluded.status,details=excluded.details`,
            [drive.id,drive.dealerId,drive.customerId,drive.listingId,drive.date,drive.time,drive.status,drive]);
        }
      }
      await db.query('COMMIT');
      return result;
    } catch (error) {
      await db.query('ROLLBACK').catch(()=>undefined);
      throw error;
    } finally { db.release(); }
  } };
}
