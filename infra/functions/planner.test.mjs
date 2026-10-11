import test from 'node:test';
import assert from 'node:assert/strict';
import {solveScenario,validateScenario} from './planner.mjs';

const scenario={kerfMm:3,stocks:[{id:'stock-1',width:600,height:400,thickness:18,grain:'none',defects:[{x:500,y:0,width:100,height:80}]}],parts:[{id:'part-1',label:'Base',width:300,height:180,thickness:18,grain:'none'},{id:'part-2',label:'Rail',width:300,height:80,thickness:18,grain:'none'}]};
test('computes and validates a feasible cloud layout',()=>{const result=solveScenario(scenario);assert.equal(result.validationStatus,'PASSED');assert.equal(result.placements.length,2);assert.equal(result.unplaced.length,0);assert.ok(result.utilization>0);});
test('returns honest infeasibility',()=>{const result=solveScenario({...scenario,stocks:[{...scenario.stocks[0],width:100,height:100,defects:[]}]});assert.equal(result.validationStatus,'FAILED');assert.equal(result.unplaced.length,2);});
test('rejects duplicate part ids',()=>assert.throws(()=>validateScenario({...scenario,parts:[scenario.parts[0],scenario.parts[0]]}),/unique id/));
