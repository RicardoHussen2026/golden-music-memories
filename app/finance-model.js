export const FINANCE_PREFIX='finance:entry:';
export const FINANCE_SCOPE='golden-music-memories';
export const CATEGORIES={income:{monetization:'Monetização das plataformas',sponsorship:'Publicidade e patrocínios',affiliate:'Afiliados de grandes marcas',sales:'Vendas próprias',membership:'Membros e assinaturas',support:'Apoio e contribuições',licensing:'Licenciamento de conteúdo próprio',other:'Outras receitas do canal'},expense:{tools:'Ferramentas digitais',campaign:'Campanhas e anúncios',hosting:'Hospedagem e domínio',api:'APIs e automações',production:'Edição e produção',licenses:'Licenças de mídia',equipment:'Equipamentos',fees:'Taxas e tarifas',other:'Outras despesas do canal'}};
export const PLATFORMS={general:'Canal / geral',youtube:'YouTube',tiktok:'TikTok',instagram:'Instagram',facebook:'Facebook',website:'Site / loja'};
export const BRANDS=['Amazon','Mercado Livre','Magalu','Shopee'];
export const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export const localDate=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function parseMoney(value){
 const raw=String(value??'').trim();
 if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(raw))throw Error('Informe o valor em reais, como 1.234,56.');
 const [whole,fraction='']=raw.replaceAll('.','').split(','), cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents<=0||cents>99999999999)throw Error('Informe um valor maior que zero e até R$ 999.999.999,99.');
 return cents;
}
export function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value||'')&&value>='2000-01-01'&&value<='2199-12-31'&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export const statusLabel=r=>r.status==='settled'?(r.kind==='income'?'Recebido':'Pago'):r.status==='cancelled'?'Cancelado':(r.kind==='income'?'A receber':'A pagar');
export const entryDate=r=>r.status==='settled'?r.settledDate:r.dueDate;
export function validateEntry(input){
 const r={...input};
 r.revision??=0;
 if(!Number.isSafeInteger(r.revision)||r.revision<0||r.revision>=Number.MAX_SAFE_INTEGER)throw Error('Revisão financeira inválida.');
 if(r.archivedAt!=null&&(typeof r.archivedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(r.archivedAt)||!Number.isFinite(Date.parse(r.archivedAt))))throw Error('Data de arquivamento financeiro inválida.');
 if(!r.id?.startsWith(FINANCE_PREFIX)||r.scope!==FINANCE_SCOPE)throw Error('Lançamento não pertence ao financeiro Golden.');
 if(!CATEGORIES[r.kind]?.[r.category])throw Error('Escolha uma categoria válida para o tipo de lançamento.');
 if(!['planned','settled','cancelled'].includes(r.status))throw Error('Situação inválida.');
 if(!Number.isSafeInteger(r.amountCents)||r.amountCents<=0||r.amountCents>99999999999||r.currency!=='BRL')throw Error('Valor financeiro inválido; use reais e centavos.');
 if(!validDate(r.dueDate))throw Error('Informe uma data prevista válida.');
 if(r.status==='settled'&&(!validDate(r.settledDate)||r.settledDate>localDate()))throw Error('A data de recebimento ou pagamento deve ser válida e não pode estar no futuro.');
 if(r.status!=='settled')r.settledDate='';
 if(!PLATFORMS[r.platform])throw Error('Selecione uma plataforma.');
 for(const [key,limit]of [['description',180],['counterparty',160],['reference',240],['notes',2000]]){r[key]=String(r[key]||'').trim();if(r[key].length>limit)throw Error('Texto muito longo em '+key+'.');}
 if(!r.description)throw Error('Informe uma descrição para identificar o lançamento.');
 if(r.kind==='income'&&r.category==='affiliate'&&!BRANDS.includes(r.counterparty))throw Error('Selecione uma das grandes marcas disponíveis para afiliados.');
 return r;
}
export function filterEntries(rows,f={}){
 const q=normal(f.query);
 return rows.filter(r=>r.scope===FINANCE_SCOPE&&r.id.startsWith(FINANCE_PREFIX)&&Boolean(r.archivedAt)===(f.archived==='yes')&&(!f.month||entryDate(r)?.startsWith(f.month))&&(!f.kind||r.kind===f.kind)&&(!f.status||r.status===f.status)&&(!f.platform||r.platform===f.platform)&&(!f.category||r.category===f.category)&&(!q||normal([r.description,r.counterparty,r.reference,r.notes,CATEGORIES[r.kind]?.[r.category]].join(' ')).includes(q)))
 .sort((a,b)=>(entryDate(b)||'').localeCompare(entryDate(a)||'')||b.id.localeCompare(a.id));
}
const sum=(a,b)=>{const n=a+b;if(!Number.isSafeInteger(n))throw Error('Total excede o limite numérico suportado.');return n;};
export function totals(rows){const out={received:0,paid:0,receivable:0,payable:0,balance:0,forecast:0};for(const r of rows){if(r.archivedAt||r.status==='cancelled')continue;const k=r.status==='settled'?(r.kind==='income'?'received':'paid'):(r.kind==='income'?'receivable':'payable');out[k]=sum(out[k],r.amountCents);}out.balance=sum(out.received,-out.paid);out.forecast=sum(sum(out.balance,out.receivable),-out.payable);return out;}
export function breakdown(rows,kind){const groups=new Map();for(const r of rows){if(r.kind!==kind||r.status!=='settled'||r.archivedAt)continue;groups.set(r.category,sum(groups.get(r.category)||0,r.amountCents));}return [...groups].sort((a,b)=>b[1]-a[1]);}
export function financeCSV(rows){const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';const header=['Projeto','Descrição','Tipo','Categoria','Plataforma','Marca / fornecedor','Situação','Data prevista','Data efetiva','Valor BRL','Centavos','Referência','Observações','Arquivado','ID'];return '\ufeff'+[header,...rows.map(r=>['Golden Music Memories',r.description,r.kind==='income'?'Receita':'Despesa',CATEGORIES[r.kind][r.category],PLATFORMS[r.platform],r.counterparty,statusLabel(r),r.dueDate,r.settledDate,(r.amountCents/100).toFixed(2).replace('.',','),r.amountCents,r.reference,r.notes,r.archivedAt?'Sim':'Não',r.id])].map(row=>row.map(cell).join(';')).join('\r\n');}
