import test from 'node:test';
import assert from 'node:assert/strict';
import {careers,rankFor,ranksFor,validCharacter} from '../dist/journey.js';
test('eleven careers have distinct visual accessories',()=>{assert.equal(careers.length,11);assert.equal(new Set(careers.map(c=>c.prop)).size,11);});
for(const gender of ['male','female'])test(`${gender}: every rank starts at its merit threshold after ceremony`,()=>{const character={gender,career:'photo',awakened:true},ranks=ranksFor(gender);for(let i=0;i<ranks.length;i++){assert.equal(rankFor(character,ranks[i].min).name,ranks[i].name);if(i)assert.equal(rankFor(character,ranks[i].min-1).name,ranks[i-1].name);}assert.equal(rankFor({...character,awakened:false},99999).index,-1);assert.equal(rankFor(character,6000).name,'Pháp chủ');});
test('legacy and malformed character data require selection',()=>{for(const value of [null,{}, {gender:'male',career:'unknown'},{gender:'unknown',career:'photo'}])assert.equal(validCharacter(value),null);assert.deepEqual(validCharacter({gender:'female',career:'chef',awakened:'true'}),{gender:'female',career:'chef',awakened:false});});
