import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cleanEnvironment, localEndpoint, root } from './plan.mjs';
import { HarnessError, diagnostic } from './lifecycle.mjs';

export function transport(context,environment,{spawnImpl=spawn}={}) {
  const env=cleanEnvironment(environment),active=new Set();let endpoint,report=()=>{};
  const command=args=>{
    if(args[0]==='context')return ['--context',context,...args];
    if(!endpoint)throw new HarnessError('No validated local endpoint','dependency');
    return ['--host',endpoint,...args];
  };
  function start(args,{cleanup=false}={}) {
    const child=spawnImpl('docker',command(args),{cwd:root,env,windowsHide:true,stdio:['pipe','pipe','pipe']});
    const entry={child,cleanup};active.add(entry);
    child.once('close',()=>active.delete(entry));
    return child;
  }
  const result=(args,meta,stdout,stderr,extra={})=>{
    const value={...meta,stdout,stderr,...extra};
    if(args.includes('psql')){
      try{report({phase:'sql-output',...value});}
      catch(error){throw new HarnessError('Diagnostic journal unavailable','journal',{...value,journalError:diagnostic(error)});}
    }
    return value;
  };
  return {
    pin(value){if(!localEndpoint(value)||(endpoint&&endpoint!==value))throw new HarnessError('Invalid endpoint','dependency');endpoint=value;},
    get endpoint(){return endpoint;},
    setReporter(fn){report=fn;},
    cancelWork(){for(const entry of active)if(!entry.cleanup)entry.child.kill();},
    async call(args,input,{cleanup=false,timeout=60000,meta={}}={}) {
      const child=start(args,{cleanup});
      return new Promise((resolve,reject)=>{
        let stdout='',stderr='',cause=null,settled=false,forced;
        const finish=(code,signal)=>{
          if(settled)return;settled=true;clearTimeout(timer);clearTimeout(forced);
          let value;
          try{value=result(args,meta,stdout,stderr,{exitCode:code,signal,transportError:cause?.message??null});}
          catch(error){reject(error);return;}
          if(cause||code!==0)reject(new HarnessError(cause?.message||stderr||`Command exit ${code}`,'transport',value));
          else resolve(stdout);
        };
        const stop=error=>{cause??=error;child.kill();forced??=setTimeout(()=>finish(null,'deadline'),2000);};
        const timer=setTimeout(()=>stop(new Error('Command deadline exceeded')),timeout);
        child.stdout.setEncoding('utf8').on('data',s=>{stdout+=s;if(stdout.length>16*1024*1024)stop(new Error('Output limit; captured diagnostics retained'));});
        child.stderr.setEncoding('utf8').on('data',s=>{stderr+=s;if(stderr.length>16*1024*1024)stop(new Error('Diagnostic limit; captured output retained'));});
        child.once('error',error=>{cause=error;finish(null,null);});
        child.once('close',finish);
        child.stdin.on('error',error=>stop(error));child.stdin.end(input);
      });
    },
    async open(args,{meta={}}={}) {
      const child=start(args);let stdout='',stderr='',pending=null,ended=false;
      let closeResolve;const closed=new Promise(resolve=>{closeResolve=resolve;});
      const fail=(code,signal,cause)=>{
        ended=true;
        if(pending){const p=pending;pending=null;clearTimeout(p.timer);
          try{const value=result(args,{...meta,...p.meta},stdout.slice(p.out),stderr.slice(p.err),{exitCode:code,signal,transportError:cause?.message??null});
            p.reject(new HarnessError(cause?.message||value.stderr||`Session exit ${code}`,'transport',value));}
          catch(error){p.reject(error);}}
        closeResolve();
      };
      const completed=()=>{
        if(!pending)return;
        const out=stdout.slice(pending.out),err=stderr.slice(pending.err);
        // Barrière sur les DEUX pipes: ne pas perdre une NOTICE tardive.
        if(!out.split(/\r?\n/).includes(pending.marker)||!err.split(/\r?\n/).includes(pending.marker))return;
        const p=pending;pending=null;clearTimeout(p.timer);
        const output=out.slice(0,out.indexOf(p.marker));
        try{result(args,{...meta,...p.meta},output,err.slice(0,err.indexOf(p.marker)),{exitCode:0});p.resolve(output);}
        catch(error){p.reject(error);}
      };
      child.stdout.setEncoding('utf8').on('data',s=>{
        stdout+=s;completed();
      });
      child.stderr.setEncoding('utf8').on('data',s=>{stderr+=s;completed();});
      child.once('error',error=>fail(null,null,error));child.once('close',(code,signal)=>fail(code,signal));
      child.stdin.on('error',error=>{child.kill();fail(null,null,error);});
      return {
        send(source,{timeout=30000,meta:detail={}}={}) {
          if(ended||pending)return Promise.reject(new HarnessError('Session closed or busy','transport'));
          return new Promise((resolve,reject)=>{
            const marker='C1D_'+randomUUID().replaceAll('-','');
            const timer=setTimeout(()=>{child.kill();fail(null,'deadline',new Error('Session command deadline exceeded'));},timeout);
            pending={marker,resolve,reject,timer,out:stdout.length,err:stderr.length,meta:detail};
            child.stdin.write(`${source}\n\\echo ${marker}\n\\warn ${marker}\n`);
          });
        },
        async close(){if(!ended){child.stdin.end('\\q\n');const timer=setTimeout(()=>child.kill(),2000);await closed;clearTimeout(timer);}},
      };
    },
  };
}
