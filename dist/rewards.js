// Serialize writes; a retry keeps the same event ID so the server cannot double-credit it.
export class RewardQueue {
 constructor({award,onChange}){this.award=award;this.onChange=onChange;this.events=[];this.running=false;}
 restore(key){this.storageKey=key;try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))this.events.push(...saved.filter(e=>typeof e.id==='string'&&typeof e.activity==='string'&&typeof e.session==='string'&&['pending','failed'].includes(e.state)).map(e=>({...e,state:'pending'})));}catch{}this.onChange();void this.flush();}
 persist(){if(!this.storageKey)return;try{localStorage.setItem(this.storageKey,JSON.stringify(this.events.filter(e=>e.state!=='saved')));}catch{}}
 enqueue(activity,session){const event={id:crypto.randomUUID(),activity,session,state:'pending'};this.events.push(event);this.persist();this.onChange();void this.flush();return event;}
 summary(session){const entries=this.events.filter(e=>e.session===session);return {earned:entries.reduce((sum,e)=>sum+(e.earned||0),0),pending:entries.filter(e=>e.state==='pending').length,failed:entries.filter(e=>e.state==='failed').length,message:entries.find(e=>e.state==='failed')?.error};}
 retry(){for(const e of this.events)if(e.state==='failed')e.state='pending';this.persist();this.onChange();void this.flush();}
 async flush(){if(this.running)return;this.running=true;try{while(true){const e=this.events.find(event=>event.state==='pending');if(!e)break;try{e.earned=await this.award(e);e.state='saved';}catch(error){e.state='failed';e.error=error?.message||String(error);}this.persist();this.onChange();}}finally{this.running=false;}}
}
