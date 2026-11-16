import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if (Number(process.versions.node.split('.')[0])<22) { console.error('Use Node.js 22.13 or newer.'); process.exit(1); }
if (!existsSync(new URL('../node_modules/esbuild/package.json',import.meta.url))) { const r=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--no-audit','--no-fund'],{cwd:new URL('..',import.meta.url),stdio:'inherit'}); if(r.status!==0) process.exit(r.status||1); }
