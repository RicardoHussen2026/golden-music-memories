// Local presets, not a declaration of account eligibility or API integration.
export const PLATFORMS={youtube:'YouTube',tiktok:'TikTok',facebook:'Facebook',instagram:'Instagram',rumble:'Rumble',odysee:'Odysee'};
export const POST_DESTINATIONS={
 youtube:{platform:'youtube',label:'YouTube · horizontal',format:'16:9',base:'youtube',note:'1920×1080; duração e permissões dependem da conta.'},
 tiktok:{platform:'tiktok',label:'TikTok · vertical',format:'9:16',base:'tiktok',maxSeconds:3600,note:'Preset conservador até 60 min, 1080×1920; confira o limite efetivo da conta.'},
 shorts:{platform:'youtube',label:'YouTube · Shorts',format:'9:16',base:'shorts',maxSeconds:180,note:'Até 3 min, quadrado/vertical. Música com reivindicação em Shorts acima de 1 min pode bloquear o vídeo. Sem cortes automáticos.'},
 facebook:{platform:'facebook',label:'Facebook · horizontal',format:'16:9',base:'youtube',note:'Preset 1920×1080. Facebook unifica vídeos em Reels; confira audiência e fluxo da conta.'},
 facebook_reels:{platform:'facebook',label:'Facebook · vertical / Reels',format:'9:16',base:'tiktok',note:'Preset 1080×1920. Não impõe um limite universal de duração aos Reels do Facebook.'},
 instagram:{platform:'instagram',label:'Instagram · Reels',format:'9:16',base:'tiktok',maxSeconds:180,note:'Preset conservador de até 3 min, 1080×1920/30 fps; não é limite universal da plataforma. Confira a conta.'},
 rumble:{platform:'rumble',label:'Rumble · vídeo horizontal',format:'16:9',base:'youtube',note:'Preset H.264/AAC 1920×1080. Confira limites da conta e opções de licença antes do envio.'},
 odysee:{platform:'odysee',label:'Odysee · vídeo horizontal',format:'16:9',base:'youtube',note:'MP4 H.264/AAC, 1920×1080. Odysee recomenda bitrate abaixo de 8 Mbps; conferir arquivo e conta.'}
};
export const UPLOAD_PAGES={youtube:'https://www.youtube.com/upload',tiktok:'https://www.tiktok.com/tiktokstudio/upload',facebook:'https://www.facebook.com/reels/create/',instagram:'https://www.instagram.com/',rumble:'https://rumble.com/upload.php',odysee:'https://odysee.com/$/upload'};
export const destinationOf=pub=>pub.destination||({youtube:'youtube',tiktok:'tiktok',facebook:'facebook',instagram:'instagram',rumble:'rumble',odysee:'odysee'}[pub.platform]);
export function destinationIssues(id,{duration,width,height}={}){
 const d=POST_DESTINATIONS[id];if(!d)return ['Destino desconhecido.'];const issues=[];
 if(d.maxSeconds&&Number(duration)>d.maxSeconds)issues.push(`${d.label}: este preset aceita até ${d.maxSeconds} s. Escolha outro formato ou prepare uma edição própria; a faixa não será cortada.`);
 if(width&&height&&d.format==='9:16'&&width>height)issues.push(`${d.label}: o enquadramento do MP4 não corresponde ao preset. Escolha um arquivo ou formato explicitamente.`);
 return issues;
}
export function renderCompatible(asset,id){
 const d=POST_DESTINATIONS[id],base=asset.destination;
 if(!d)return false;if(!base)return true; // Browser assets require inspection in the preview.
 return (['tiktok','shorts'].includes(base)?'9:16':'16:9')===d.format;
}
export function finalRoleAllowed(role,platform){return role===platform||(!['youtube','tiktok'].includes(platform)&&Object.hasOwn(PLATFORMS,platform)&&['youtube','tiktok'].includes(role));}
