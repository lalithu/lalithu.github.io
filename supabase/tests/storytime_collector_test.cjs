const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const {gzipSync}=require('node:zlib');const {transformSync}=require('../../_demo/storytime/node_modules/esbuild');
test('Storytime collector matches city/region/country formatting, caches lookup and preserves page isolation',async()=>{
 const inserts=[];let handler,downloads=0;
 const source=fs.readFileSync('supabase/functions/track-storytime-demo-visit/index.ts','utf8').replace(/^import \{ Reader, type CityResponse \} from "npm:mmdb-lib@3\.0\.4";\n/,'');
 const code=transformSync(source,{loader:'ts',format:'cjs',target:'es2022'}).code;
 class Reader{get(ip){if(ip==='192.0.2.1')return{city:{names:{en:'Sample City'}},subdivisions:[{names:{en:'Sample State'}}],country:{names:{en:'United States'}}};if(ip==='192.0.2.2')return{subdivisions:[{iso_code:'NC'}],country:{iso_code:'US'}};return{country:{names:{en:'United States'}}}}}
 const sandbox={require,Reader,Response,Request,AbortSignal,DecompressionStream,Uint8Array,Date,JSON,Set,console,Deno:{serve:fn=>handler=fn,env:{get:k=>({SUPABASE_URL:'https://example.test',SUPABASE_SECRET_KEYS:JSON.stringify({default:'test-only-secret'})})[k]}},fetch:async(input,init)=>{const url=String(input);if(url.startsWith('https://download.db-ip.com/free/dbip-city-lite-')){downloads++;assert.ok(!url.includes('192.0.2.'));return new Response(gzipSync(Buffer.from('test-database')))}assert.equal(url,'https://example.test/rest/v1/storytime_demo_visits');assert.equal(init.headers.Authorization,undefined);inserts.push(JSON.parse(init.body));return new Response(null,{status:201})}};
 vm.runInNewContext(code,sandbox);
 const request=(ip,origin='https://lalithu.github.io',method='POST')=>handler(new Request('https://collector.test/',{method,headers:{origin,'cf-connecting-ip':ip,'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X)'}}));
 assert.equal((await request('192.0.2.1','https://other.test')).status,403);assert.equal((await request('192.0.2.1','https://lalithu.github.io','GET')).status,405);assert.equal(inserts.length,0);
 for(const ip of ['192.0.2.1','192.0.2.2','192.0.2.3','invalid'])assert.equal((await request(ip)).status,204);
 assert.equal(inserts[0].location,'Sample City, Sample State, United States');assert.equal(inserts[1].location,'NC, US');assert.equal(inserts[2].location,'United States');assert.equal(inserts[3].location,'Unknown');assert.equal(downloads,1);assert.ok(inserts.every(r=>r.page_path==='/demo/storytime/'&&r.device==='Mac'));
});
