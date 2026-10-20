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
// 未加标点的真实听写（Safari zh-CN 返回无标点文本）
const dictation = [
 ['unpunctuated question','我明天想去教会参加主日崇拜但是我不知道几点开始你知道吗','我明天想去教会参加主日崇拜，但是我不知道几点开始，你知道吗？'],
 ['bible sentence','耶苏说我就是道路真理生命若不借着我没有人能到父那里去所以我们要因信称意','耶稣说我就是道路真理生命，若不借着我没有人能到父那里去。所以我们要因信称义。'],
 ['3-point list with preface','我们这次聚会要准备三件事第一是准备诗歌第二是安排讲员第三是准备茶点','我们这次聚会要准备三件事：\n1. 准备诗歌\n2. 安排讲员\n3. 准备茶点'],
 ['unpunctuated 首先 list','首先买牛奶其次买面包最后买鸡蛋','1. 买牛奶\n2. 买面包\n3. 买鸡蛋'],
 ['然后/还有 enumeration','今天要买牛奶然后买面包还有鸡蛋','1. 今天要买牛奶\n2. 买面包\n3. 鸡蛋'],
 ['一个是/另一个是','我有两个担心一个是时间不够另一个是人手不足','我有两个担心：\n1. 时间不够\n2. 人手不足'],
 ['exclamation','感谢主今天天气太好了','感谢主！今天天气太好了！'],
 ['yes-no question word','这个方案是不是可以','这个方案是不是可以？'],
 ['unpunctuated self-correction','嗯那个我明天不对是后天上午十点开会','后天上午十点开会。'],
 ['no double punctuation when Safari already punctuates','你好吗。我很好。','你好吗？我很好。'],
 ['already punctuated stays','今天下雨了，我们改天再去吧。','今天下雨了，我们改天再去吧。'],
];
for (const [n, i, e] of dictation) test(n, () => assert.strictEqual(P.polish(i), e));
test('segments joined with boundary punctuation', () => assert.strictEqual(P.polish(P.joinSegments(['今天晚上有祷告会', '你会来吗', '我会准时到'])), '今天晚上有祷告会。你会来吗？我会准时到。'));
test('long text split into paragraphs', () => {
  const t = '这周的查经我们读罗马书第八章大家可以提前预习一下因为内容比较多所以我们会分两次来讲另外请大家记得带圣经和笔记本还有如果有问题的话可以在群里先提出来我们一起讨论你们觉得周三晚上七点可以吗我们下周还会继续读第九章同时也请大家为这次的福音聚会代祷';
  const out = P.polish(t);
  assert.ok(out.includes('\n\n'), out); assert.ok(!/[，。？！]{2}/.test(out), out); assert.ok(/[。？！]$/.test(out), out);
});
test('faith corrections also applied to AI output', () => assert.strictEqual(P.faithApply('耶苏说因信称意，马丁路德和约翰加尔文都讲启示路'), '耶稣说因信称义，马丁·路德和约翰·加尔文都讲启示录'));
