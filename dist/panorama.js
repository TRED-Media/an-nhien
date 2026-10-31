import {hallStations} from './hall.js';
import {drawActivityMarker} from './activity-art.js';
import {worldArt,hallArt} from './illustration.js';
import {gardenStations,marketSpots} from './life.js';
import {stations} from './scene.js';
import {drawLife} from './life.js';
// Three connected districts share one camera while retaining local gameplay coordinates.
export function panorama(scene,onDistrict){
 const original=scene.draw.bind(scene),point=scene.point.bind(scene);let zoom=1,panX=0,panY=0,drag=null,moved=false;const cache=new Map(),offsets={garden:-900,courtyard:0,market:900};
 const resize=scene.resize;scene.resize=()=>{resize();scene.scale*=zoom;scene.ox=scene.w/2-450*scene.scale+panX;scene.oy=Math.max(145,(scene.h-1250*scene.scale)/2)+panY;};
 function district(){return offsets[scene.map]===undefined?0:offsets[scene.map];}
 scene.draw=()=>{if(scene.preview)return original();if(scene.map==='hall'){if(!hallArt.complete||!hallArt.naturalWidth)return original();const c=scene.ctx;c.setTransform(scene.dpr,0,0,scene.dpr,0,0);c.fillStyle='#b38c56';c.fillRect(0,0,scene.w,scene.h);c.save();c.translate(scene.ox,scene.oy);c.scale(scene.scale,scene.scale);c.drawImage(hallArt,20,100,860,1200);scene.character(scene.player,true);for(const p of scene.others.values())if(p.map==='hall')scene.character(p,false);for(const st of hallStations){drawActivityMarker(scene,st.id,st.x,st.y);scene.rounded(st.x-85,st.y+15,170,30,12,'#fff1d7','#bd9b5f');scene.text(st.name,st.x,st.y+30,15,'#3e6347');}c.restore();return;}const active=scene.map,ox=scene.ox,oy=scene.oy,scale=scene.scale,c=scene.ctx;
 c.setTransform(scene.dpr,0,0,scene.dpr,0,0);const sky=c.createLinearGradient(0,0,0,scene.h);sky.addColorStop(0,'#91d9da');sky.addColorStop(.5,'#c8dfa4');sky.addColorStop(1,'#8bc96a');c.fillStyle=sky;c.fillRect(0,0,scene.w,scene.h);
 if(worldArt.complete&&worldArt.naturalWidth){c.save();c.translate(ox-district()*scale,oy);c.scale(scale,scale);c.drawImage(worldArt,-1050,80,3000,1125);
 const activeStations=active==='garden'?gardenStations:active==='courtyard'?stations:[];c.save();c.translate(district(),0);for(const st of activeStations){if(active==='garden'||st.id!=='incense')drawActivityMarker(scene,st.id,st.x,st.y);scene.ellipse(st.x,st.y,10,5,'#e9c978');scene.line(st.x,st.y,st.x,st.y+20,'#b49158',2);scene.rounded(st.x-66,st.y+20,132,28,12,'#fff5dbe8','#c5a56b');scene.text(st.name,st.x,st.y+34,14,'#3d6045');}if(active==='market')for(const st of marketSpots){scene.rounded(st.x-39,st.y+25,78,25,10,'#fff4d9ed','#b7935e');scene.text('Sạp '+st.id,st.x,st.y+38,14,'#3e6248');}scene.character(scene.player,true);for(const p of scene.others.values())if((p.map||'courtyard')===active)scene.character(p,false);if(active==='courtyard')scene.monk();c.restore();c.restore();}else original();};

 scene.point=e=>{const q=point(e),global=q.x+district();const map=global<0?'garden':global>900?'market':'courtyard';if(map!==scene.map)return {...q,district:map};return q;};
 const canvas=scene.canvas;canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.38,Math.min(1.8,zoom*Math.exp(-e.deltaY*.001)));scene.resize();},{passive:false});
 const nav=document.createElement('nav');nav.className='map-zoom';nav.setAttribute('aria-label','Thu phóng bản đồ');nav.innerHTML='<button aria-label="Thu nhỏ">−</button><span>BẢN ĐỒ 2D</span><button aria-label="Phóng to">+</button><button aria-label="Về giữa bản đồ">⌂</button>';document.body.append(nav);nav.children[0].onclick=()=>{zoom=Math.max(.38,zoom/1.2);scene.resize();};nav.children[2].onclick=()=>{zoom=Math.min(1.8,zoom*1.2);scene.resize();};nav.children[3].onclick=()=>{zoom=1;panX=panY=0;scene.resize();};scene.resize();
}
