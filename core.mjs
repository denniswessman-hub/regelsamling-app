export const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildIndex(data){
 const laws=new Map(data.laws.map(l=>[l.id,l]));
 return data.records.map((r,order)=>{const l=laws.get(r.law);const text=[r.title,r.heading,r.chapterTitle,...r.paragraphs,...(r.advice||[]),...(r.table||[]).flat(),r.afterTable||''].join(' ');return {...r,order,lawInfo:l,text,haystack:fold([l.title,...l.aliases,text].join(' ')),titleIndex:fold(r.title+' '+r.heading)};});
}
export function parseQuery(q,laws){
 const raw=fold(q.trim());let ref=null;
 const candidates=laws.flatMap(l=>l.aliases.map(a=>({law:l,alias:fold(a)}))).sort((a,b)=>b.alias.length-a.alias.length);
 for(const {law,alias} of candidates){
 if(!raw.startsWith(alias))continue;
 const rest=raw.slice(alias.length).trim();if(rest&&!/^[\d\s§]/.test(rest))continue;
 if(!rest){ref={law:law.id};break;}
 const m=rest.match(/^(\d+)\s*(?:kap\.?\s*|:\s*)?(\d+\s*[a-z]?)?\s*§?$/);
 if(m){const chaptered=law.chapters.some(c=>c.id!=='overgang');ref=chaptered?{law:law.id,chapter:m[1],para:m[2]?.replace(/\s/g,'')}:{law:law.id,para:(m[1]+(m[2]||'')).replace(/\s/g,'')};break;}
 const p=rest.match(/^(\d+\s*[a-z])\s*§?$/);if(p&&!law.chapters.some(c=>c.id!=='overgang')){ref={law:law.id,para:p[1].replace(/\s/g,'')};break;}
 }
 if(!ref){const m=raw.match(/^(\d+)\s*:\s*(\d+\s*[a-z]?)\s*§?$/);if(m)ref={chapter:m[1],para:m[2].replace(/\s/g,'')};}
 const terms=ref?[]:[...raw.matchAll(/"([^"]+)"|(\S+)/g)].map(m=>(m[1]||m[2]).replace(/[.,;:!?§]+$/g,'')).filter(Boolean);
 return {raw,ref,terms};
}
export function search(index,q='',filters={}){
 const query=parseQuery(q,index.length?[...new Map(index.map(r=>[r.law,r.lawInfo])).values()]:[]);
 const rows=[];
 for(const r of index){
 if(filters.law&&r.law!==filters.law)continue;
 if(filters.chapter&&r.chapter!==filters.chapter)continue;
 if(filters.saved&&!filters.saved.has(r.id))continue;
 if(query.ref&&(query.ref.law&&r.law!==query.ref.law||query.ref.chapter&&r.chapter!==query.ref.chapter||query.ref.para&&r.para!==query.ref.para))continue;
 if(query.terms.some(t=>!r.haystack.includes(t)))continue;
 let score=0;
 for(const t of query.terms){if(r.titleIndex.includes(t))score+=12;if(fold(r.paragraphs[0]||'').includes(t))score+=4;score+=1;}
 if(r.repealed)score-=5;if(r.type==='transition')score-=4;
 rows.push({record:r,score});
 }
 if(query.raw)rows.sort((a,b)=>b.score-a.score||a.record.order-b.record.order);
 return {records:rows.map(x=>x.record),query};
}
export function snippet(r,terms=[],size=205){
 const text=r.paragraphs.join(' ');const normalized=fold(text);const positions=terms.map(t=>normalized.indexOf(t)).filter(p=>p>=0);let start=positions.length?Math.max(0,Math.min(...positions)-55):0;
 if(start>0){const space=text.indexOf(' ',start);if(space>=0&&space<start+30)start=space+1;}
 return (start?'…':'')+text.slice(start,start+size)+(start+size<text.length?'…':'');
}
export function highlight(text,terms=[]){
 if(!terms.length)return escapeHTML(text);
 const n=fold(text),ranges=[];
 for(const term of terms){if(term.length<2)continue;let i=0;while((i=n.indexOf(term,i))!==-1){ranges.push([i,i+term.length]);i+=term.length;}}
 ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
 for(const r of ranges){const last=merged.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push([...r]);}
 let out='',pos=0;for(const [a,b] of merged){out+=escapeHTML(text.slice(pos,a))+'<mark>'+escapeHTML(text.slice(a,b))+'</mark>';pos=b;}return out+escapeHTML(text.slice(pos));
}
