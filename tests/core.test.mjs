import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildIndex,search,highlight,parseQuery} from '../core.mjs';
const data=JSON.parse(await readFile(new URL('../assets/regelsamling.json',import.meta.url),'utf8'));
const index=buildIndex(data);
test('all imported records have stable unique identifiers and official sources',()=>{
 assert.equal(data.laws.length,49); assert.equal(data.records.length,1907);
 assert.equal(new Set(index.map(r=>r.id)).size,index.length);
 for(const r of index){assert.ok(r.lawInfo);assert.ok(r.paragraphs.length||r.table?.length);assert.match(r.lawInfo.source,/^https:\/\/(?:data\.riksdagen\.se|www\.riksdagen\.se|rkrattsbaser\.gov\.se|polisen\.se)\//);}
});
test('precise citations resolve to one correct provision',()=>{
 for(const [q,id] of [['PL 13','1984-387--13'],['RB 24:8','1942-740-24-8'],['BrB 24 kap. 1 §','1962-700-24-1'],['PL 28 a §','1984-387--28a']]){
 assert.deepEqual(search(index,q).records.map(r=>r.id),[id],q);
 }
});
test('chapter references and chapter filters agree',()=>{
 assert.deepEqual(search(index,'RB 24').records.map(r=>r.id),search(index,'',{law:'1942-740',chapter:'24'}).records.map(r=>r.id));
});
test('free text ignores Swedish accents and requires every term',()=>{
 const a=search(index,'husrannsakan åklagaren').records.map(r=>r.id);
 assert.ok(a.length>0);assert.deepEqual(search(index,'husrannsakan aklagaren').records.map(r=>r.id),a);
 assert.ok(search(index,'"allmänna ordningen"').records.some(r=>r.id==='1984-387--13'));
 assert.equal(search(index,'zzzzzzqwertymissing').records.length,0);
});
test('filters and bookmarks restrict results',()=>{
 const rs=search(index,'',{law:'1962-700',chapter:'24'}).records;assert.ok(rs.length>0);assert.ok(rs.every(r=>r.law==='1962-700'&&r.chapter==='24'));
 assert.deepEqual(search(index,'',{saved:new Set(['1984-387--13'])}).records.map(r=>r.id),['1984-387--13']);
});
test('highlighting is escaped and overlapping matches do not corrupt markup',()=>{
 assert.equal(highlight('<script>Åklagare</script>',['aklagare']), '&lt;script&gt;<mark>Åklagare</mark>&lt;/script&gt;');
 assert.equal(highlight('Polislagen',['polis','polislagen']),'<mark>Polislagen</mark>');
});
test('legal structure retains tables, advice, timing and transitions',()=>{
 assert.ok(index.find(r=>r.id==='2009-400-3-1').table.length>5);
 assert.ok(index.find(r=>r.id==='1962-700-2-3').table.length>5);
 assert.match(index.find(r=>r.id==='1984-387--28a').timing,/2029-04-30/);
 assert.equal(index.filter(r=>r.lawInfo.kind==='fap'&&r.type==='provision').length,60);
 assert.ok(index.some(r=>r.advice?.length));assert.ok(index.some(r=>r.type==='transition'));
});
test('offline fallback is isolated from other apps on the same origin',async()=>{
 const vm=await import('node:vm');
 const script=await readFile(new URL('../sw.js',import.meta.url),'utf8');
 const handlers={};let response;
 vm.runInNewContext(script,{
 URL,
 self:{location:{origin:'https://example.test'},addEventListener:(type,fn)=>handlers[type]=fn},
 fetch:async()=>{throw new Error('offline');},
 caches:{match:async(req,options)=>options?.cacheName?.startsWith('regelsamling-')?'correct app':'unrelated app'}
 });
 handlers.fetch({request:{method:'GET',url:'https://example.test/regelsamling-app/',mode:'navigate'},respondWith:p=>response=p});
 assert.equal(await response,'correct app');
 handlers.fetch({request:{method:'GET',url:'https://example.test/regelsamling-app/core.mjs',mode:'cors'},respondWith:p=>response=p});
 assert.equal(await response,'correct app');
});
