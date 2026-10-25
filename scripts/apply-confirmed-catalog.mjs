import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {mergeConfirmedRecords} from '../app/catalog-reconciliation.js';
const hash=x=>createHash('sha256').update(x).digest('hex');
export function applyConfirmedCatalogFile(catalogPath,packagePath,{backupDirectory='.cache/catalog-confirmed-backups',apply=false}={}){
 const bytes=fs.readFileSync(catalogPath),catalog=JSON.parse(bytes),pack=JSON.parse(fs.readFileSync(packagePath));
 if(!Array.isArray(catalog.songs)||!Array.isArray(pack.songs))throw Error('Catálogo/pacote inválido.');
 const {records,plan}=mergeConfirmedRecords(catalog.songs,pack.songs),report={before:catalog.songs.length,read:pack.songs.length,added:plan.counts.addable,duplicates:plan.counts.duplicates,conflicts:plan.counts.conflicts,final:records.length,changed:false,baseSha256:hash(bytes),addedIds:plan.additions.map(s=>s.id)};
 if(!apply||!plan.additions.length)return report;
 if(plan.counts.conflicts||plan.counts.needsEvidence||plan.counts.invalid||plan.counts.outOfScope)throw Error('Pacote contém pendências; prepare lote somente confirmado antes de aplicar.');
 fs.mkdirSync(backupDirectory,{recursive:true});const backup=path.join(backupDirectory,'catalog-'+hash(bytes)+'.json');
 if(fs.existsSync(backup)){if(hash(fs.readFileSync(backup))!==hash(bytes))throw Error('Backup em conflito.');}else fs.writeFileSync(backup,bytes,{flag:'wx'});
 if(hash(fs.readFileSync(backup))!==hash(bytes))throw Error('Backup não conferiu.');
 const next={...catalog,songs:records};if(Object.hasOwn(catalog,'count'))next.count=records.length;
 const temp=path.join(path.dirname(path.resolve(catalogPath)),'.catalog-confirmed-'+Date.now()+'.tmp');fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(hash(fs.readFileSync(catalogPath))!==hash(bytes))throw Error('Catálogo mudou; operação interrompida antes da substituição.');
 fs.renameSync(temp,catalogPath);return {...report,changed:true,backup,sha256:hash(fs.readFileSync(catalogPath))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(applyConfirmedCatalogFile(process.argv[2]||'data/catalog.json',process.argv[3]||'data/catalog-confirmed-update.json',{apply:process.argv.includes('--apply')})));
