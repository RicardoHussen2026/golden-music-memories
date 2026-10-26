export async function textCallArt(text){
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=180;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#103936';ctx.strokeStyle='#edc283';ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(4,4,1192,172,70);ctx.fill();ctx.stroke();
 let size=64;const label=String(text).trim().slice(0,70).toLocaleUpperCase('pt-BR');
 do{ctx.font=`700 ${size}px Arial`;if(ctx.measureText(label).width<=1090)break;size-=2;}while(size>24);
 ctx.fillStyle='#fff5df';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,600,90);
 return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
}
