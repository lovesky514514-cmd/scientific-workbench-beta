import test from 'node:test';
import assert from 'node:assert/strict';
import {testerLabel,normalizeTesterNumber,suffixLetters,validateRelease,validEmail,cleanFeedback} from '../src/core.mjs';
test('labels and normalization',()=>{
 assert.equal(testerLabel(1,'SJ'),'001SJ');assert.equal(normalizeTesterNumber('001sj'),'001SJ');
 assert.equal(normalizeTesterNumber('999zz'),'999ZZ');assert.equal(normalizeTesterNumber('000SJ'),null);
 assert.throws(()=>testerLabel(1000,'AA'));assert.throws(()=>testerLabel(1,'aA'));
});
test('unbiased random suffix',()=>{assert.equal(suffixLetters(new Uint8Array([255,0,25])),'AZ');assert.throws(()=>suffixLetters(new Uint8Array([255,234])));});
test('validate release',()=>{
 const sha='f'.repeat(64);assert.equal(validateRelease({published:true,version:'RC5',url:'https://example.org/a',sha256:sha}).published,true);
 for(const x of [{published:true},{published:true,version:'RC5',url:'http://bad.com',sha256:sha},{published:true,version:'RC5',url:'https://example.org/a',sha256:'bad'}])assert.throws(()=>validateRelease(x));
});
test('email and feedback',()=>{
 assert.ok(validEmail('user@example.org'));assert.equal(validEmail('bad-email'),false);
 assert.equal(cleanFeedback({kind:'science',severity:'blocked',title:'t',details:'d'}).title,'t');
 assert.throws(()=>cleanFeedback({kind:'bad',severity:'blocked',title:'t',details:'d'}));
});
