import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const projectRoot=resolve(fileURLToPath(new URL('../',import.meta.url)));
function files(root,folder){const dir=join(root,folder);if(!existsSync(dir))return [];return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(root,join(folder,e.name)):[join(folder,e.name)]).filter(p=>!p.endsWith('build-info.js'));}
function fingerprint(root,version,paths){const hash=createHash('sha256').update(version+'\0');for(const file of [...new Set(paths)].sort((a,b)=>a.replaceAll('\\','/')<b.replaceAll('\\','/')?-1:a.replaceAll('\\','/')>b.replaceAll('\\','/')?1:0)){hash.update(file.replaceAll('\\','/')+'\0');const bytes=readFileSync(join(root,file));hash.update(/\.(?:js|mjs|json|html|css|svg|webmanifest|md|sql|txt)$/i.test(file)?Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n')):bytes);hash.update('\0');}return hash.digest('hex').slice(0,12);}
export function buildMetadata(root=projectRoot){
 const version=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version;
 if(typeof version!=='string'||!/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version))throw Error('package.json precisa de uma versão válida.');
 const frontend=['painel.html','index.html','manifest.webmanifest',...['app','data','templates','vendor'].flatMap(folder=>files(root,folder))];
 const backend=[...files(root,'server/runtime'),...files(root,'media-branding'),...files(root,'server/media-downloader').filter(p=>!p.includes('__pycache__')&&!p.endsWith('.pyc')),'app/media-names.js','app/destinations.js','app/clip-metadata.js','app/quality.js','scripts/build-metadata.mjs'];
 return {version,interfaceBuild:fingerprint(root,version,frontend),backendBuild:fingerprint(root,version,backend)};
}
