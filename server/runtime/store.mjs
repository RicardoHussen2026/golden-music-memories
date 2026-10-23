import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomUUID,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';

export const sha=value=>createHash('sha256').update(value).digest('hex');
export function check(value,message,status=400){if(!value){const error=new Error(message);error.status=status;throw error;}}
export const stamp=()=>new Date().toISOString();
export class Store{
  constructor(directory,key=null){
    mkdirSync(directory,{recursive:true,mode:0o700});this.key=key;
    this.db=new DatabaseSync(join(directory,'publishing.sqlite'));
    try{chmodSync(join(directory,'publishing.sqlite'),0o600);}catch{}
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
    const version=this.db.prepare('PRAGMA user_version').get().user_version;
    check(version<=1,'Banco de publicação de versão futura; atualização necessária.');
    if(version===0)this.db.exec(readFileSync(new URL('./migrations/001-publishing.sql',import.meta.url),'utf8'));
  }
  transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(error){this.db.exec('ROLLBACK');throw error;}}
  get(kind,id){const row=this.db.prepare('SELECT data FROM objects WHERE kind=? AND id=?').get(kind,id);return row?JSON.parse(row.data):null;}
  put(kind,id,data){this.db.prepare('INSERT INTO objects VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data').run(kind,id,JSON.stringify(data));return data;}
  delete(kind,id){this.db.prepare('DELETE FROM objects WHERE kind=? AND id=?').run(kind,id);}
  list(kind){return this.db.prepare('SELECT data FROM objects WHERE kind=?').all(kind).map(r=>JSON.parse(r.data));}
  seal(value){check(this.key,'Configure a chave de cifragem antes de conectar contas.',503);const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key,iv);const bytes=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return {iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),bytes:bytes.toString('base64')};}
  open(value){check(this.key,'Chave de cifragem ausente.',503);const decipher=createDecipheriv('aes-256-gcm',this.key,Buffer.from(value.iv,'base64'));decipher.setAuthTag(Buffer.from(value.tag,'base64'));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.bytes,'base64')),decipher.final()]).toString());}
  transfer(id,owner){const t=this.db.prepare('SELECT * FROM transfers WHERE id=? AND owner=?').get(id,owner);check(t,'Transferência não encontrada.',404);return {...t,envelope:JSON.parse(t.data)};}
  range(id,start,length){const rows=this.db.prepare('SELECT offset,bytes FROM chunks WHERE transfer_id=? AND offset < ? AND offset+length(bytes)>? ORDER BY offset').all(id,start+length,start);return Buffer.concat(rows.map(r=>Buffer.from(r.bytes).subarray(Math.max(0,start-r.offset),Math.min(r.bytes.length,start+length-r.offset))));}
  hashTransfer(id){const hash=createHash('sha256');for(const r of this.db.prepare('SELECT bytes FROM chunks WHERE transfer_id=? ORDER BY offset').iterate(id))hash.update(r.bytes);return hash.digest('hex');}
  job(id,owner){const row=this.db.prepare('SELECT * FROM jobs WHERE id=? AND owner=?').get(id,owner);check(row,'Tarefa não encontrada.',404);return {...JSON.parse(row.data),id:row.id,owner:row.owner,state:row.state,due:row.due,revision:row.revision,lease:row.lease,leaseUntil:row.lease_until};}
  jobs(owner){return this.db.prepare('SELECT id FROM jobs WHERE owner=? ORDER BY rowid DESC LIMIT 200').all(owner).map(r=>this.job(r.id,owner));}
  update(job,patch,event,{leased=false}={}){
    return this.transaction(()=>{const current=this.job(job.id,job.owner);check(current.revision===job.revision&&(!leased||current.lease===job.lease),'A tarefa mudou; atualize a situação.',409);
      const next={...current,...patch,revision:current.revision+1,updatedAt:stamp()};
      this.db.prepare('UPDATE jobs SET state=?,due=?,lease=?,lease_until=?,revision=?,data=? WHERE id=?').run(next.state,next.due,next.lease||null,next.leaseUntil||0,next.revision,JSON.stringify(next),job.id);
      this.db.prepare('INSERT INTO events(job_id,at,event) VALUES(?,?,?)').run(job.id,stamp(),event);return next;});
  }
  claim(owner='operator',onlyId=null){
    return this.transaction(()=>{const row=this.db.prepare("SELECT id FROM jobs WHERE owner=? AND (? IS NULL OR id=?) AND state IN ('authorized','uploading','processing','scheduled','retry_wait','awaiting_user') AND due<=? AND lease_until<=? ORDER BY due LIMIT 1").get(owner,onlyId,onlyId,Date.now(),Date.now());if(!row)return null;
      const lease=randomUUID();this.db.prepare('UPDATE jobs SET lease=?,lease_until=? WHERE id=?').run(lease,Date.now()+120000,row.id);return this.job(row.id,owner);});
  }
  close(){this.db.close();}
}
export function publicJob(job){const {remote,lease,leaseUntil,transferId,owner,...rest}=job;return rest;}
