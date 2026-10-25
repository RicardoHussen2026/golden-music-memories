import {resolve} from 'node:path';
import {restoreServiceSnapshot,verifyServiceSnapshot} from '../server/runtime/storage-backup.mjs';
const [action,source,destination]=process.argv.slice(2);
if(action==='verify'&&source){const m=await verifyServiceSnapshot(resolve(source));console.log(JSON.stringify({valid:true,id:m.id,version:m.version,files:m.files.length,remoteOnly:m.remoteOnly.length}));}
else if(action==='restore'&&source&&destination){console.log(JSON.stringify(await restoreServiceSnapshot(resolve(source),resolve(destination))));}
else throw Error('Uso: node scripts/restore-service.mjs verify CAMINHO_BACKUP | restore CAMINHO_BACKUP DIRETORIO_NOVO. Nunca use a pasta operacional como destino.');
