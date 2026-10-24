import {existsSync,writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
const destination=resolve('.env');
if(existsSync(destination)){console.log('Configuração existente preservada. Abra .env em editor local para ajustar o serviço.');process.exit(0);}
const password=randomBytes(24).toString('base64url'),key=randomBytes(32).toString('hex');
const example=readFileSync(new URL('../.env.example',import.meta.url),'utf8').replace('GMM_OPERATOR_PASSWORD=','GMM_OPERATOR_PASSWORD='+password).replace('GMM_ENCRYPTION_KEY=','GMM_ENCRYPTION_KEY='+key);
writeFileSync(destination,example,{mode:0o600,flag:'wx'});
console.log('Configuração privada criada em .env. Nenhuma conta, rede ou publicação foi ativada. Abra o arquivo local para obter a senha do serviço. Guarde uma cópia segura da chave de cifragem para recuperação; não a envie por chat.');
