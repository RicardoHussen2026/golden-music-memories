import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {combineReviewed} from '../scripts/rankings-chartwatch-stage.mjs';
import {createRankingPlan} from '../scripts/rankings-lib.mjs';
const base=JSON.parse(fs.readFileSync('research/rankings/staging/source-lists.json')),
 extra=JSON.parse(fs.readFileSync('research/rankings/staging/chartwatch-2000-2004.json')),
 review=fs.readFileSync('research/rankings/chartwatch-review.json');
test('combina850+150 somente em memória, conserva origem e não muda catálogo',()=>{
 const original=JSON.stringify(base),combined=combineReviewed(base,extra,review);
 assert.equal(combined.lists.reduce((n,l)=>n+l.rows.length,0),1000);assert.equal(JSON.stringify(base),original);
 const plan=createRankingPlan(JSON.parse(fs.readFileSync('data/catalog.json')),combined);
 assert.equal(plan.counts.annualPositions,900);assert.equal(plan.counts.missingAnnualPositions,600);
 assert.equal(plan.counts.allTimeGoalConfirmedPositions,0);assert.equal(plan.additions.length,0);assert.equal(plan.patches.length,0);
 assert.equal(extra.lists.every(l=>l.sourceTier==='secondary_reproduction_of_official_positions'&&l.rows.every(r=>r.releaseYear===null&&!r.recordingId)),true);
});
test('repetir combinação não duplica anos, mesmo com IDs diferentes',()=>{
 const combined=combineReviewed(base,extra,review);assert.throws(()=>combineReviewed(combined,extra,review),/já presente/);
});
test('crédito alterado após revisão falha, sem promover dados',()=>{
 const altered=structuredClone(extra);altered.lists[0].rows[0].artist='Outro artista';
 assert.throws(()=>combineReviewed(base,altered,review),/divergentes/);
});
test('quarentena e base não são substituídas por ano da introdução incorreta',()=>{
 const combined=combineReviewed(base,extra,review),list=combined.lists.find(l=>l.chartYear===2004);
 assert.equal(list.rows[0].artist,'Band Aid 20');assert.ok(list.sourceCaveats[0].includes('2003'));
 assert.equal(combined.lists.filter(l=>l.chartYear===2004).length,1);assert.deepEqual(combined.gaps,base.gaps);
});
test('suplemento sem revisão completa ou com hash de fonte divergente é recusado',()=>{
 const unreviewed=structuredClone(extra);unreviewed.validationStatus='candidate';assert.throws(()=>combineReviewed(base,unreviewed,review),/sem revisão/);
 const altered=structuredClone(extra);altered.lists[0].sourceSha256='0'.repeat(64);assert.throws(()=>combineReviewed(base,altered,review),/divergentes/);
});
