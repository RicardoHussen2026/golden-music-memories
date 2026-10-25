import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {validateStaging,createRankingPlan} from './rankings-lib.mjs';
import {resolveIdentities} from './rankings-plan.mjs';import {hash} from './rankings-source.mjs';

export function combineReviewed(base,extra,reviewBytes){
 validateStaging(base);validateStaging(extra);
 if(extra.validationStatus!=='reviewed_source_facts_only_recordings_unverified'||extra.reviewManifestSha256!==hash(reviewBytes))throw Error('Suplemento sem revisão/hash correspondente.');
 const review=JSON.parse(reviewBytes),combined=structuredClone(base);
 for(const list of extra.lists){
  if(combined.lists.some(l=>l.id===list.id||l.kind==='annual'&&l.chartYear===list.chartYear&&l.market===list.market))throw Error('Ano/lista já presente; não duplicar suplemento.');
  const proof=review.lists.find(r=>r.chartYear===list.chartYear),credits=list.rows.map(r=>r.position+'\t'+r.title+'\t'+r.artist).join('\n')+'\n';
  if(!proof||proof.sourceSha256!==list.sourceSha256||proof.creditSha256!==hash(credits)||list.sourceReview?.status!=='all_30_positions_visually_checked')throw Error('Créditos ou origem divergentes da revisão.');
  combined.lists.push(structuredClone(list));
 }
 combined.generatedAt=extra.generatedAt;combined.supplements=['chartwatch-2000-2004'];
 return validateStaging(combined);
}

export function checkpoint(){
 const originals=['data/catalog.json','research/rankings/staging/source-lists.json','research/rankings/staging/comparison.json','research/rankings/staging/summary.json','research/rankings/staging/quarantine.json'];
 const before=Object.fromEntries(originals.map(p=>[p,hash(fs.readFileSync(p))]));
 const base=JSON.parse(fs.readFileSync(originals[1])),extra=JSON.parse(fs.readFileSync('research/rankings/staging/chartwatch-2000-2004.json')),review=fs.readFileSync('research/rankings/chartwatch-review.json');
 const combined=combineReviewed(base,extra,review),catalog=JSON.parse(fs.readFileSync(originals[0])),resolutions=JSON.parse(fs.readFileSync('research/rankings/resolutions.json')).resolutions;
 const resolved=resolveIdentities(combined,resolutions),plan=createRankingPlan(catalog,resolved,{baseSha256:before[originals[0]],aliases:JSON.parse(fs.readFileSync('research/rankings/aliases.json'))});
 const ids=new Set(extra.lists.map(l=>l.id)),entries=plan.entries.filter(e=>ids.has(e.listId)),statuses={};for(const e of entries)statuses[e.status]=(statuses[e.status]||0)+1;
 const report={generatedAt:extra.generatedAt,completed:false,scope:'900 annual GB positions +100 historical GB reference; source facts, not1000 verified recordings',counts:plan.counts,missingYears:plan.missingYears,additionalPositions:entries.length,additionalComparisonStatuses:statuses,catalogRecords:catalog.songs.length,newSongsApplied:0,newMembershipsApplied:0,operationalDatabaseTouched:false,originalFilesSha256:before,pdfSourceTier:'secondary_reproduction_of_official_CIN_OCC_positions',top100GeneralDecision:'pending',top50Coverage:'not_established'};
 fs.mkdirSync('.cache/chartwatch-reviewed',{recursive:true});
 fs.writeFileSync('.cache/chartwatch-reviewed/combined-source-lists.json',JSON.stringify(combined,null,2));fs.writeFileSync('.cache/chartwatch-reviewed/comparison.json',JSON.stringify(plan,null,2));
 fs.writeFileSync('research/rankings/staging/chartwatch-comparison.json',JSON.stringify({generatedAt:extra.generatedAt,additionalPositions:150,entries,patches:[],additions:[],notice:'No newly verified recording identities; no import plan for additional positions.'},null,2)+'\n');
 fs.writeFileSync('research/rankings/staging/chartwatch-summary.json',JSON.stringify(report,null,2)+'\n');
 for(const p of originals)if(hash(fs.readFileSync(p))!==before[p])throw Error('Original alterado: '+p);
 console.log(JSON.stringify({positions:plan.counts.filledPositions,annual:plan.counts.annualPositions,additional:entries.length,statuses,missingYears:plan.missingYears,catalogRecords:catalog.songs.length,applied:0}));return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))checkpoint();
