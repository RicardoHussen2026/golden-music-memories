import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAssemblyInputs} from '../app/assembly-workspace.js';
import {sequenceFields,editedSequence} from '../app/sequence-edit.js';

test('validação da montagem ignora ferramentas inativas e campos sem efeito, mas mostra erros ativos',()=>{
 const fields={},tested=[];const add=(id,valid=true,tool=false)=>fields[id]={value:'',willValidate:true,closest:()=>tool,reportValidity:()=>{tested.push(id);return valid;}};
 add('opening-duration',false,true);add('sampleStart',false);add('targetSeconds',false);add('cropX',false);add('trimEnd');
 const get=id=>fields[id],form={elements:Object.values(fields)};
 fields.cover={value:''};fields.durationMode={value:'whole'};fields.fit={value:'contain'};
 assert.equal(validateAssemblyInputs(form,get,''),true);assert.deepEqual(tested,['trimEnd']);
 assert.equal(validateAssemblyInputs(form,get,'sample'),false);
 fields.sampleStart.willValidate=false;fields.durationMode.value='exact';assert.equal(validateAssemblyInputs(form,get,''),false);
 fields.durationMode.value='whole';fields.fit.value='crop';assert.equal(validateAssemblyInputs(form,get,''),false);
});

test('cortes da sequência aceitam a precisão da mídia sem arredondar sua duração',()=>{
 const items=[{artist:'Teste',title:'Faixa',duration:292.548209}];
 const html=sequenceFields({items},x=>x);
 assert.match(html,/data-track-out[^>]*step="any"[^>]*value="292\.548209"/);
 assert.equal(editedSequence(items)[0].duration,292.548209);
});
