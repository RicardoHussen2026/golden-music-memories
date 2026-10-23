from pathlib import Path
import urllib.request,urllib.parse,time,json,re,unicodedata
root=Path(__file__).resolve().parents[1];(root/'data').mkdir(exist_ok=True)
cache=root/'.cache/musicbrainz';cache.mkdir(exist_ok=True)
headers={'User-Agent':'GoldenMusicMemories/2.0 (catalog curation; https://github.com/RicardoHussen2026/golden-music-memories)'}
rows={}
def norm(s):return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if not unicodedata.combining(c)).strip()
def fetch(q,offset,key):
    f=cache/f'{key}-{offset}.json'
    if f.exists():return json.loads(f.read_text(encoding='utf-8'))
    url='https://musicbrainz.org/ws/2/recording/?'+urllib.parse.urlencode({'query':q,'limit':100,'offset':offset,'fmt':'json'})
    for attempt in range(3):
        time.sleep(1.2+attempt*2)
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=35) as r:d=json.load(r)
            f.write_text(json.dumps(d,ensure_ascii=False),encoding='utf-8');return d
        except Exception as e:
            if attempt==2:print('Página não importada:',key,offset,str(e),flush=True);return {}
def add(r):
    title=r.get('title','').strip();credits=r.get('artist-credit',[]);artist=''.join(c.get('name',c.get('artist',{}).get('name',''))+c.get('joinphrase','') for c in credits)
    date=r.get('first-release-date','');year=int(date[:4]) if date[:4].isdigit() else 0
    if not title or not artist or not 1970<=year<=2009:return
    if re.search(r'live|remix|karaoke|instrumental|demo|mix|remaster',title+' '+r.get('disambiguation',''),re.I):return
    tags=sorted(r.get('tags',[]),key=lambda x:x.get('count',0),reverse=True)
    item={'id':'mb-'+r['id'],'title':title,'artist':artist,'year':year,'decade':(year//10)*10,'genre':'','country':'','artistIds':[c.get('artist',{}).get('id') for c in credits], 'source':'https://musicbrainz.org/recording/'+r['id'],'sourceId':r['id'],'sourceName':'MusicBrainz','sourceCheckedAt':'2026-10-23','validation':'metadata_imported','yearMeaning':'Primeiro lançamento desta gravação informado pelo MusicBrainz; revisar versão na curadoria.','favorite':False,'rights':'pending'}
    key=norm(artist)+'|'+norm(title)
    if key not in rows or year<rows[key]['year']:rows[key]=item
for r in fetch('recording:"Take On Me" AND artist:"a-ha"',0,'takeonme').get('recordings',[]):add(r)
for decade in [1970,1980,1990,2000]:
    query=f'firstreleasedate:[{decade}-01-01 TO {decade+9}-12-31] AND (tag:pop OR tag:rock OR tag:soul OR tag:disco OR tag:dance)'
    for offset in range(0,500,100):
        if sum(x['decade']==decade for x in rows.values())>=480:break
        records=fetch(query,offset,str(decade)).get('recordings',[])
        if not records:break
        for record in records:add(record)
        print(decade,offset,'únicas:',sum(x['decade']==decade for x in rows.values()),flush=True)
    for year in range(decade,decade+10):
        if sum(x['decade']==decade for x in rows.values())>=480:break
        query=f'firstreleasedate:[{year}-01-01 TO {year}-12-31] AND (tag:pop OR tag:rock OR tag:soul OR tag:disco OR tag:dance)'
        for record in fetch(query,0,'year-'+str(year)).get('recordings',[]):add(record)
        print('Complemento',year,'únicas:',sum(x['decade']==decade for x in rows.values()),flush=True)
data=sorted(rows.values(),key=lambda r:(r['year'],norm(r['artist']),norm(r['title'])))
out={'version':1,'importedAt':'2026-10-23','source':'MusicBrainz WS/2','license':'https://musicbrainz.org/doc/About/Data_License','count':len(data),'verifiedAgainstSource':len(data),'humanCuratedCount':0,'notes':'Dados reais consultados na API. Ano é o primeiro lançamento conhecido da gravação; não equivale a validação humana da composição original. País não inferido a partir do mercado de lançamento. Direitos pendentes. Sem ranking de popularidade.','songs':data}
(root/'data/catalog.json').write_text(json.dumps(out,ensure_ascii=False),encoding='utf-8')
print('TOTAL',len(data),flush=True)
