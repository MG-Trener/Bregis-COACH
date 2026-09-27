import test from 'node:test';import assert from 'node:assert/strict';import {scoreQuestions,levelFor} from '../server/learning.mjs';
test('multiple answers require exact set',()=>{const qs=[{type:'multiple',answer:[0,2]}];assert.equal(scoreQuestions(qs,[[2,0]]).score,100);assert.equal(scoreQuestions(qs,[[0]]).score,0);assert.equal(scoreQuestions(qs,[[0,1,2]]).score,0);});
test('order is significant',()=>{assert.equal(scoreQuestions([{type:'order',answer:[2,0,1]}],[[2,0,1]]).score,100);assert.equal(scoreQuestions([{type:'order',answer:[2,0,1]}],[[0,1,2]]).score,0);});
test('level thresholds',()=>{assert.equal(levelFor(0),1);assert.equal(levelFor(99),1);assert.equal(levelFor(100),2);assert.equal(levelFor(400),3);});
