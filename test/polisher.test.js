const test = require('node:test'); const assert = require('node:assert');
const P = require('../polisher.js');
const cases = [
 ['self-correction','嗯那个我明天，不对，是后天上午十点，那个，开会，然后记得带文件，带文件。',{},'后天上午十点，开会，记得带文件。'],
 ['list','首先买牛奶，其次买面包，最后买鸡蛋。',{},'1. 买牛奶\n2. 买面包\n3. 买鸡蛋'],
 ['english correction','um I think we should, uh, ship it on Friday, I mean Monday.',{},'I think we should ship it on Monday.'],
 ['formal','咱们啥时候搞定',{tone:'formal'},'我们什么时候完成。'],
 ['concise','其实我觉得可能差不多就这样吧',{tone:'concise'},'就这样。'],
 ['punctuation','明天下午三点开会句号请准时问号',{},'明天下午三点开会。请准时？'],
 ['dictionary','明天去苹果开会',{entries:[{spoken:'苹果',written:'Apple'}]},'明天去Apple开会。'],
 ['reduplication','妈妈说明天可以可以',{},'妈妈说明天可以。'],
 ['stutter','我我我觉得可以',{},'我觉得可以。'],
 ['compose list','首先买牛奶，其次买面包。',{},'1. 买牛奶\n2. 买面包'],
 ['jesus','耶苏爱你',{},'耶稣爱你。'],
 ['justification','因信称意是福音的中心',{},'因信称义是福音的中心。'],
 ['luther','马丁路德讲因信称义',{},'马丁·路德讲因信称义。'],
 ['catechism stays whole','海德堡要理问答',{},'海德堡要理问答。'],
 ['dictionary before faith','耶苏爱你',{entries:[{spoken:'耶苏',written:'主耶稣'}]},'主耶稣爱你。'],
 ['brief dictate skips model','耶苏爱你',{},'耶稣爱你。'],
 ['上帝/神 untouched','上帝和神都爱世人',{},'上帝和神都爱世人。'],
 ['empty','   ',{},''],
];
for (const [n, i, o, e] of cases) test(n, () => assert.strictEqual(P.polish(i, o), e));
test('faith hints: 100 unique, has 耶稣 & 罗马书', () => { const h = P.recognitionHints; assert.strictEqual(h.length, 100); assert.strictEqual(new Set(h).size, 100); assert.ok(h.includes('耶稣') && h.includes('罗马书')); });
