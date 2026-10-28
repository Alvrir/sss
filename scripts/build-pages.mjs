import {spawnSync} from 'node:child_process';
const env={...process.env,EXPO_PUBLIC_BASE_URL:process.env.EXPO_PUBLIC_BASE_URL??'/sss',WEB_OUTPUT_DIR:'dist-pages'};
for(const args of [['node_modules/expo/bin/cli','export','--platform','web','--output-dir','dist-pages'],['scripts/prepare-pwa.mjs']]){
 const result=spawnSync(process.execPath,args,{env,stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);
}
