import {drawLife} from './life.js';
// Three connected districts share one camera while retaining local gameplay coordinates.
export function panorama(scene,onDistrict){
 const original=scene.draw.bind(scene),point=scene.point.bind(scene);let zoom=1,panX=0,panY=0,drag=null,moved=false;const cache=new Map(),offsets={garden:-900,courtyard:0,market:900};
 const resize=scene.resize;scene.resize=()=>{resize();scene.scale*=zoom;scene.ox=scene.w/2-450*scene.scale+panX;scene.oy=Math.max(145,(scene.h-1250*scene.scale)/2)+panY;};
 function district(){return offsets[scene.map]===undefined?0:offsets[scene.map];}
 scene.draw=()=>{if(scene.preview||scene.map==='hall')return original();const active=scene.map,ox=scene.ox,oy=scene.oy,scale=scene.scale,c=scene.ctx;
 c.setTransform(scene.dpr,0,0,scene.dpr,0,0);const sky=c.createLinearGradient(0,0,0,scene.h);sky.addColorStop(0,'#91d9da');sky.addColorStop(.5,'#c8dfa4');sky.addColorStop(1,'#8bc96a');c.fillStyle=sky;c.fillRect(0,0,scene.w,scene.h);
 for(const map of ['garden','courtyard','market']){let entry=cache.get(map);if(!entry){const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1400;entry={canvas,t:-1};cache.set(map,entry);}if(scene.time-entry.t>.09){const saved={ctx:scene.ctx,w:scene.w,h:scene.h,dpr:scene.dpr,scale:scene.scale,ox:scene.ox,oy:scene.oy,map:scene.map,player:scene.player};Object.assign(scene,{ctx:entry.canvas.getContext('2d'),w:1000,h:1400,dpr:1,scale:1,ox:50,oy:0,map,player:map===active?saved.player:{...saved.player,x:-9999}});if(map==='courtyard')original();else drawLife.call(scene);Object.assign(scene,saved);entry.t=scene.time;}
 c.save();c.beginPath();c.rect(ox+(offsets[map]-district()-50)*scale,oy+400*scale,1000*scale,1000*scale);c.drawImage(entry.canvas,ox+(offsets[map]-district()-50)*scale,oy,1000*scale,1400*scale);c.restore();}
 c.save();c.translate(ox,oy);c.scale(scale,scale);for(const [text,x]of [['← VƯỜN VUI',-80],['CHỢ AN NHIÊN →',980]]){scene.rounded(x-130-district(),840,260,46,15,'#fff0ca','#a88652');scene.text(text,x-district(),864,20,'#365f45');}c.restore();};
 scene.point=e=>{const q=point(e),global=q.x+district();const map=global<0?'garden':global>900?'market':'courtyard';if(map!==scene.map)return {...q,district:map};return q;};
 const canvas=scene.canvas;canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.38,Math.min(1.8,zoom*Math.exp(-e.deltaY*.001)));scene.resize();},{passive:false});
 const nav=document.createElement('nav');nav.className='map-zoom';nav.setAttribute('aria-label','Thu phóng bản đồ');nav.innerHTML='<button aria-label="Thu nhỏ">−</button><span>BẢN ĐỒ 2D</span><button aria-label="Phóng to">+</button><button aria-label="Về giữa bản đồ">⌂</button>';document.body.append(nav);nav.children[0].onclick=()=>{zoom=Math.max(.38,zoom/1.2);scene.resize();};nav.children[2].onclick=()=>{zoom=Math.min(1.8,zoom*1.2);scene.resize();};nav.children[3].onclick=()=>{zoom=1;panX=panY=0;scene.resize();};scene.resize();
}
