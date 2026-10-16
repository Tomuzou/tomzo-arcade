import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/physics.test.ts'],bundle:true,packages:'external',
  platform:'node',format:'esm',outfile:'test-results/physics.test.mjs',
  alias:{'@tomzo-arcade/core':'../../packages/core/src/index.ts'}});
const result=spawnSync(process.execPath,['--test','test-results/physics.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status ?? 1;
