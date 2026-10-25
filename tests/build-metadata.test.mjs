import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildMetadata} from '../scripts/build-metadata.mjs';
test('hashes da entrega são estáveis com LF/CRLF e continuam sensíveis a código e bytes de imagem',async()=>{
 const root=await mkdtemp(join(tmpdir(),'gmm-build-lines-'));
 try{for(const dir of ['app','scripts','server/runtime'])await mkdir(join(root,dir),{recursive:true});
 await writeFile(join(root,'package.json'),JSON.stringify({version:'2.9.2'}));
 const text=['painel.html','index.html','manifest.webmanifest','app/main.js','app/media-names.js','app/destinations.js','scripts/build-metadata.mjs','server/runtime/http.mjs','server/runtime/schema.sql','app/notes.md'];
 for(const name of text)await writeFile(join(root,name),'fixture\nsecond line\n');await writeFile(join(root,'app/image.png'),Buffer.from([1,2,13,10,3]));const lf=buildMetadata(root);
 for(const name of text)await writeFile(join(root,name),'fixture\r\nsecond line\r\n');assert.deepEqual(buildMetadata(root),lf);
 await writeFile(join(root,'app/image.png'),Buffer.from([1,2,10,3]));assert.notEqual(buildMetadata(root).interfaceBuild,lf.interfaceBuild);
 await writeFile(join(root,'server/runtime/http.mjs'),'changed\n');assert.notEqual(buildMetadata(root).backendBuild,lf.backendBuild);
 }finally{await rm(root,{recursive:true,force:true});}
});
