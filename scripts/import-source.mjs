import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

export function convert(prepared,report) {
const nick={'1984-387':'Polislagen','1942-740':'Rättegångsbalken','1962-700':'Brottsbalken','2009-400':'Offentlighet & sekretess','1947-948':'Förundersökningskungörelsen','1964-167':'Unga lagöverträdare','2025-400':'Socialtjänstlagen','1949-105':'Tryckfrihetsförordningen','1994-1219':'Europakonventionen'};
const alias={'1984-387':['PL','Polislagen'],'1942-740':['RB','Rättegångsbalken'],'1962-700':['BrB','Brottsbalken'],'2009-400':['OSL','Offentlighets- och sekretesslagen'],'1947-948':['FUK','Förundersökningskungörelsen'],'1964-167':['LUL'],'2025-400':['SoL'],'1949-105':['TF'],'1972-207':['SkL'],'1968-64':['NSL']};
const time=new Map(prepared.temporary.map(x=>[[x.sfs,x.chapter,x.para].join('/'),x.markers.map(t=>t.replace(/^\/|\/$/g,'')).join(' ')]));
const laws=[],records=[];
const lines=ls=>{const out=[];for(let t of ls){t=t.replace(/\s+/g,' ').trim().replace(/([a-zåäö]{3,})- (?=[a-zåäö]{2})(?!och |eller )/g,'$1');if(!t)continue;if(out.length&&(out.at(-1).endsWith('kap.')||/^[a-zåäö]/.test(t)||/^\d+\s*[a-z]? § [a-zåäö]/.test(t)))out[out.length-1]+=' '+t;else out.push(t);}return out;};
for(const law of prepared.parts){
const l={id:law.id,title:law.title,name:nick[law.id]||law.title,abbr:(alias[law.id]||[])[0]||'',aliases:alias[law.id]||[],source:law.url,version:law.metadata,chapters:[],kind:'sfs'};
laws.push(l);let chapter='',chapterTitle='',head='',article=null;
for(const b of law.blocks){
if(b.kind==='chapter'){chapter=b.chapter;chapterTitle=b.lines[0];head='';l.chapters.push({id:chapter,title:chapterTitle});article=null;if(l.id==='1994-1219'){article={id:l.id+'-'+chapter,law:l.id,chapter,title:chapterTitle,heading:'',type:'article',paragraphs:[]};records.push(article);}continue;}
if(l.id==='1994-1219'){if(article)article.paragraphs.push(...lines(b.lines));continue;}
if(b.kind==='heading'){head=b.lines.join(' ');continue;}
if(b.kind==='transition'){head='Övergångsbestämmelser';continue;}
if(!['p','transition_p'].includes(b.kind))continue;
const transition=b.kind==='transition_p';
const ref=transition?b.lines[0]:(chapter?chapter+' kap. ':'')+b.para.replace(/^(\d+)([a-z])$/,'$1 $2')+' §';
const r={id:l.id+'-'+(transition?'overgang-'+b.line:chapter+'-'+b.para),law:l.id,chapter:transition?'overgang':chapter,para:b.para||'',title:transition?'Övergång '+ref:ref,heading:head,chapterTitle:transition?'Övergångsbestämmelser':chapterTitle,type:transition?'transition':'provision',paragraphs:lines(b.lines),timing:time.get([l.id,chapter,b.para].join('/'))||time.get([l.id,chapter,'hela kapitlet'].join('/'))||''};
r.repealed=/har upphävts|ny beteckning/i.test(b.lines[0]);
const m=r.paragraphs.join(' ').match(/(?:Lag|Förordning) \((202[3-6]:\d+)\)\.?$/);r.amendment=m?m[1]:'';
if((l.id==='1962-700'&&chapter==='2'&&b.para==='3')||(l.id==='2009-400'&&chapter==='3'&&b.para==='1')){
r.paragraphs=[b.lines[0]];r.table=[];let row=null,prefix='';
const criminal=l.id==='1962-700';
for(const t of b.lines.slice(1)){
if(/^(Anknytningsfaktum|Begrepp)/.test(t)){r.table.push(criminal?['Anknytningsfaktum','Behörighetens omfattning']:['Begrepp','Betydelse']);continue;}
if(t==='Bestämmelse om överföring av'){prefix=t+' ';continue;}
const match=t.match(criminal?/^(\d+\. .+?)\s*\t+\s*(.*)/:/^(.+?)(?:\t+| {2,})(.*)/);
if(match){row=[prefix+match[1],match[2]];prefix='';r.table.push(row);}
else if(t.startsWith('Lag ('))r.afterTable=t;
else if(row)row[1]+=' '+t.trim();
}
}
records.push(r);
}
if(records.some(r=>r.law===l.id&&r.type==='transition'))l.chapters.push({id:'overgang',title:'Övergångsbestämmelser'});
}
const fapNames={'FAP102-2':['Avveckling av egendom','PMFS 2023:7 · PMFS 2024:10'],'FAP103-1':['Beslut om förverkande','PMFS 2024:11'],'FAP473-1':['Biometri och signalement','PMFS 2025:8'],'FAP261-2':['Information om delgivning','PMFS 2025:11'],'FAP261-1':['Ordningsbot','PMFS 2020:9']};
for(const [id,parts] of Object.entries(report.fap_text)){
const [name,version]=fapNames[id];
laws.push({id,name,title:id.replace('FAP','FAP ')+' – '+name,abbr:id.replace('FAP','FAP '),aliases:[id,id.replace('FAP','FAP ')],source:prepared.faps[id].url,version,chapters:[],kind:'fap'});
let current=null,head='',advice=false,extra=0;
for(const t of parts){
const m=t.match(/^(\d+)\s*§\s+[A-ZÅÄÖ]/);
if(m){current={id:id+'-'+m[1],law:id,chapter:'',para:m[1],title:m[1]+' §',heading:head,type:'provision',paragraphs:[t],advice:[]};advice=false;records.push(current);continue;}
if(/^Allmän(?:t råd|na råd)/.test(t)){advice=true;if(current)current.advice.push(t);continue;}
if(t==='Ikraftträdande och upphävande'){current={id:id+'-ikraft',law:id,chapter:'',title:t,heading:'',type:'transition',paragraphs:[]};records.push(current);advice=false;continue;}
if(!/[.§:;,]$/.test(t)&&t.length<150&&!/^(?:\d+\.|[a-z]\)|–)/.test(t)){head=t;advice=false;continue;}
if(current)(advice?current.advice:current.paragraphs).push(t);
}
}
for(const l of laws)l.count=records.filter(r=>r.law===l.id&&r.type!=='transition').length;
return {version:'2026-11-17.1',date:'2026-11-17',sourceTitle:'Regelsamling_uppdaterad_2026-11-17.pdf',pdfPages:334,laws,records};
}
