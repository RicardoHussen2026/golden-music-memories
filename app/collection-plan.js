export function selectCollection(candidates,{mode='varied',year='',genre='',targetSeconds},random=Math.random){
 if(!['varied','year','genre'].includes(mode))throw Error('Tema inválido.');
 if(!Number.isFinite(targetSeconds)||targetSeconds<1||targetSeconds>43200)throw Error('Escolha uma meta entre 1 segundo e 12 horas.');
 let pool=candidates.filter(c=>mode==='year'?String(c.year||'')===String(year)&&year!=='':mode==='genre'?genre!==''&&String(c.genre||'').toLocaleLowerCase()===String(genre).toLocaleLowerCase():mode==='varied');
 const songs=new Set(),hashes=new Set();pool=pool.filter(c=>{if(songs.has(c.songId)||hashes.has(c.hash))return false;songs.add(c.songId);hashes.add(c.hash);return true;});
 if(mode==='varied')for(let i=pool.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const selected=[];let total=0;for(const c of pool){if(total>=targetSeconds||selected.length===100)break;selected.push(c);total+=c.duration;}
 return {selected,total,targetSeconds,difference:total-targetSeconds,available:pool.length,insufficient:total<targetSeconds,wholeTracks:true};
}
