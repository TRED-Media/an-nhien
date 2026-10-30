import test from 'node:test';
import assert from 'node:assert/strict';
import {hallStations,hallBlocked,teachings} from '../dist/hall.js';
import {SharedRoom} from '../dist/cloud.js';
test('all indoor interaction positions and exit are reachable floor tiles',()=>{for(const s of hallStations)assert.equal(hallBlocked(s.stand.x,s.stand.y),false,s.id);assert.equal(hallBlocked(450,1200),false);});
test('walls and carved columns cannot be crossed',()=>{for(const [x,y]of [[90,900],[820,900],[450,600],[150,730],[750,730],[150,1120],[750,1120]])assert.equal(hallBlocked(x,y),true);});
test('map and animation changes broadcast even if coordinates stay the same',()=>{const room=new SharedRoom({profile:{id:'guest',cloud:false,display_name:'Sen'},onPlayers:()=>{},onBow:()=>{},onStatus:()=>{}});const sent=[];room.send=()=>sent.push(room.payload());const player={x:450,y:900,action:'idle',map:'courtyard',animationStarted:0};room.move(player);room.move({...player,map:'hall'});room.move({...player,map:'hall',action:'prostrate',animationStarted:100});room.move({...player,map:'hall',action:'prostrate',animationStarted:200});assert.equal(sent.length,4);assert.equal(sent[1].map,'hall');assert.equal(sent[3].animationStarted,200);});
test('sermon contains five non-empty reading segments',()=>{assert.equal(teachings.length,5);assert.ok(teachings.every(s=>s.length>25));});
