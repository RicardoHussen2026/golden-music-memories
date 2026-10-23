import {randomBytes,createHash,createCipheriv,createDecipheriv} from 'node:crypto';
import {YOUTUBE_SCOPES} from './provider-adapters.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');

// Não é endpoint OAuth de produção. Fluxo testável sem clientes cadastrados, segredos ou rede.
// O repositório injetado deve persistir estado e tokens cifrados somente no futuro servidor privado.
export class OAuthSimulation{
  constructor({store,encryptionKey,clock=()=>Date.now()}){if(!store?.get||!store?.put||encryptionKey?.length!==32)throw Error('Persistência privada e chave efêmera de teste de 32 bytes obrigatórias.');this.store=store;this.key=encryptionKey;this.clock=clock;this.chain=Promise.resolve();}
  serial(fn){const p=this.chain.then(fn);this.chain=p.catch(()=>{});return p;}
  async begin(ownerId){if(!ownerId)throw Error('Proprietário obrigatório.');const state=randomBytes(32).toString('base64url');await this.store.put('state:'+sha(state),{ownerId,expires:this.clock()+600000,used:false});return {state,mode:'simulation',authorizationUrl:null,scopes:[YOUTUBE_SCOPES.upload,YOUTUBE_SCOPES.read]};}
  callback({ownerId,state,error,code}){return this.serial(async()=>{if(typeof state!=='string'||state.length<20)throw Error('State ausente.');const key='state:'+sha(state),entry=await this.store.get(key);if(!entry||entry.ownerId!==ownerId||entry.used||entry.expires<this.clock())throw Error('State inválido, expirado ou reutilizado.');entry.used=true;await this.store.put(key,entry);if(error)return {mode:'simulation',connected:false,reason:'consent_denied'};if(!code)throw Error('Código ausente.');return {mode:'simulation',connected:false,exchangeRequired:true};});}
  seal(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.key,iv);const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return {iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')};}
  open(value){const cipher=createDecipheriv('aes-256-gcm',this.key,Buffer.from(value.iv,'base64'));cipher.setAuthTag(Buffer.from(value.tag,'base64'));return JSON.parse(Buffer.concat([cipher.update(Buffer.from(value.data,'base64')),cipher.final()]).toString());}
  async storeTestTokens(ownerId,tokens){if(tokens?.mode!=='simulation')throw Error('Tokens reais não são aceitos.');await this.store.put('tokens:'+ownerId,this.seal(tokens));return {mode:'simulation',connected:false};}
  async refresh(ownerId){const stored=await this.store.get('tokens:'+ownerId);if(!stored)throw Error('Reconexão necessária.');const tokens=this.open(stored);if(tokens.revoked||!tokens.refreshToken)throw Error('Consentimento revogado; reconexão necessária.');await this.storeTestTokens(ownerId,{...tokens,accessToken:randomBytes(24).toString('hex'),expiresAt:this.clock()+3600000});return {mode:'simulation',refreshed:true,connected:false};}
  async revoke(ownerId){await this.store.put('tokens:'+ownerId,this.seal({mode:'simulation',revoked:true}));return {mode:'simulation',connected:false,realRevocationPerformed:false};}
}
