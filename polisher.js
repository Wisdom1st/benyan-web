// 本言文字整理：移植自 Shared/TextPolisher.swift 与 Shared/FaithLexicon.swift
(function (root) {
  'use strict';
  const A = (s) => Array.from(s);
  const isAsciiStr = (s) => /^[\x00-\x7f]*$/.test(s);
  const isAsciiCh = (c) => c.codePointAt(0) < 128;
  const isLetter = (c) => /\p{L}/u.test(c);
  const isWS = (c) => /\s/.test(c);
  const BREAKS = '，,。.!！？?、；;：:\n';
  const PUNCT = '，,。.!！？?、；;：:…';
  const isBreak = (c) => BREAKS.includes(c);
  const isPunct = (c) => PUNCT.includes(c);
  const isFillerBoundary = (c) => isWS(c) || isBreak(c);
  const trimEdges = (s) => s.trim();
  const trimSet = (s, set) => { const a = A(s); let i = 0, j = a.length; while (i < j && set.includes(a[i])) i++; while (j > i && set.includes(a[j - 1])) j--; return a.slice(i, j).join(''); };
  const isCJK = (c) => { const v = c.codePointAt(0); return (v >= 0x4e00 && v <= 0x9fff) || (v >= 0x3400 && v <= 0x4dbf) || (v >= 0x3000 && v <= 0x303f); };
  const replaceAll = (s, a, b) => s.split(a).join(b);
  const eqArr = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const startsWith = (arr, i, needle) => { if (i + needle.length > arr.length) return false; for (let k = 0; k < needle.length; k++) if (arr[i + k] !== needle[k]) return false; return true; };

  // ---------- Faith lexicon ----------
  const corrections = [['耶苏','耶稣'],['耶酥','耶稣'],['耶数','耶稣'],['基都','基督'],['圣伶','圣灵'],['摩希','摩西'],['以塞亚','以赛亚'],['阿伯拉罕','亚伯拉罕'],['因信称意','因信称义'],['启示路','启示录'],['以佛所','以弗所'],['腓利比','腓立比'],['帖撒罗尼加','帖撒罗尼迦'],['格林多','哥林多'],['卡拉太','加拉太'],['奥古斯汀','奥古斯丁'],['约翰加尔文','约翰·加尔文'],['马丁路德','马丁·路德'],['威斯敏斯德','威斯敏斯特']];
  const priority = ['耶稣','基督','耶稣基督','圣灵','圣父','上帝','耶和华','圣经','福音','恩典','信心','因信称义','教会','十字架','复活','祷告','保罗','摩西','大卫','约翰','彼得','马利亚','亚伯拉罕','旧约','新约','三位一体','使徒','门徒','罗马书','诗篇','创世记','启示录','登山宝训','主祷文','十诫','奥古斯丁','马丁·路德','加尔文','戴德生','宋尚节','威斯敏斯特'];
  const books = ['出埃及记','利未记','民数记','申命记','约书亚记','士师记','路得记','撒母耳记','撒母耳记上','撒母耳记下','列王纪','列王纪上','列王纪下','历代志','历代志上','历代志下','以斯拉记','尼希米记','以斯帖记','约伯记','箴言','传道书','雅歌','以赛亚书','耶利米书','耶利米哀歌','以西结书','但以理书','何西阿书','约珥书','阿摩司书','俄巴底亚书','约拿书','弥迦书','那鸿书','哈巴谷书','西番雅书','哈该书','撒迦利亚书','玛拉基书','马太福音','马可福音','路加福音','约翰福音','使徒行传','哥林多前书','哥林多后书','加拉太书','以弗所书','腓立比书','歌罗西书','帖撒罗尼迦前书','帖撒罗尼迦后书','提摩太前书','提摩太后书','提多书','腓利门书','希伯来书','雅各书','彼得前书','彼得后书','约翰一书','约翰二书','约翰三书','犹大书'];
  const people = ['亚当','夏娃','亚伯','该隐','挪亚','撒拉','以撒','利百加','雅各','以色列','约瑟','亚伦','米利暗','约书亚','迦勒','喇合','底波拉','基甸','参孙','路得','拿俄米','撒母耳','扫罗','约拿单','所罗门','以利亚','以利沙','以赛亚','耶利米','以西结','但以理','约拿','施洗约翰','安德烈','雅各布','多马','腓力','巴多罗买','马提亚','巴拿巴','提摩太','提多','路加','马可','马太','司提反','百基拉','亚居拉','吕底亚','哥尼流','尼哥底母','撒该','马大','拉撒路','抹大拉的马利亚'];
  const theology = ['救赎','悔改','洗礼','圣餐','盟约','律法','先知','国度','天国','升天','再来','末世','启示','默示','正典','释经','系统神学','圣经神学','成圣','称义','重生','拣选','预定','代赎','宝血','中保','大祭司','弥赛亚','基督论','圣灵论','教会论','末世论','道成肉身','神人二性','童贞女','八福','五旬节','大使命','宣教','门训','团契','敬拜','赞美','代祷','禁食','十一奉献','长老','执事','牧师','监督','弟兄','姊妹','圣徒','唯独圣经','唯独信心','唯独恩典','唯独基督','唯独上帝荣耀','宗教改革','归正','使徒信经','尼西亚信经','迦克墩信经','海德堡要理问答','威斯敏斯特信条','威斯敏斯特小要理问答'];
  const history = ['亚他那修','阿奎那','杰罗姆','安波罗修','屈梭多模','奥利金','特土良','爱任纽','居普良','安瑟伦','威克里夫','胡斯','茨温利','墨兰顿','诺克斯','约翰·欧文','理查德·巴克斯特','乔纳森·爱德华兹','怀特菲尔德','约翰·卫斯理','威廉·克理','慕迪','王明道','倪柝声','贾玉铭','计志文','马礼逊','钟马田','巴刻','路益师','斯托得','卡森','约翰·加尔文','提姆·凯勒','约翰·派博','葛培理','潘霍华','朋霍费尔','清教徒','福音派','大公教会'];
  const installedTerms = [...priority, ...books, ...people, ...theology, ...history];
  const uniqueTerms = [...new Set(installedTerms)];
  const recognitionHints = uniqueTerms.slice(0, 100);

  const trie = {};
  for (const [s, w] of corrections) { let n = trie; for (const c of A(s)) n = (n[c] = n[c] || {}); n.$ = w; }
  function faithApply(text) {
    const ch = A(text); let out = ''; let i = 0;
    while (i < ch.length) {
      let n = trie, cur = i, match = null;
      while (cur < ch.length && Object.prototype.hasOwnProperty.call(n, ch[cur]) && ch[cur] !== '$') { n = n[ch[cur]]; cur++; if (n.$ !== undefined) match = [cur, n.$]; }
      if (match) { out += match[1]; i = match[0]; } else { out += ch[i]; i++; }
    }
    return out;
  }

  // ---------- Dictionary & punctuation ----------
  const isAsciiWordCh = (c) => c !== undefined && isAsciiCh(c) && /[A-Za-z0-9]/.test(c);
  function replaceAsciiWord(word, written, text) {
    const ch = A(text), w = A(word.toLowerCase()); let out = ''; let i = 0;
    while (i < ch.length) {
      const end = i + w.length;
      if (end <= ch.length && !(i > 0 && isAsciiWordCh(ch[i - 1])) && ch.slice(i, end).join('').toLowerCase() === w.join('') && !isAsciiWordCh(ch[end])) { out += written; i = end; }
      else { out += ch[i]; i++; }
    }
    return out;
  }
  function applyDictionary(text, entries) {
    const usable = (entries || []).map(e => ({ spoken: (e.spoken || '').trim(), written: (e.written || '').trim() }))
      .filter(e => e.spoken && e.written).sort((a, b) => A(b.spoken).length - A(a.spoken).length);
    let r = text;
    for (const e of usable) r = isAsciiStr(e.spoken) ? replaceAsciiWord(e.spoken, e.written, r) : replaceAll(r, e.spoken, e.written);
    return r;
  }
  const punctPairs = [['省略号','……'],['感叹号','！'],['叹号','！'],['问号','？'],['句号','。'],['句点','。'],['逗号','，'],['冒号','：'],['分号','；'],['顿号','、'],['另起一行','\n'],['换行','\n'],['question mark','?'],['exclamation mark','!'],['new line','\n'],['period','.'],['comma',',']];
  function applySpokenPunctuation(text) { let r = text; for (const [s, m] of punctPairs) r = isAsciiStr(s) ? replaceAsciiWord(s, m, r) : replaceAll(r, s, m); return r; }

  // ---------- Self correction ----------
  const markers = [['说错了',1,0],['更正一下',1,0],['重说一遍',1,0],['更正',1,0],['重说',1,0],['不对',1,0],['scratch that',1,1],['no wait',1,1],['correction',1,1],['我是说',0,0],['应该是',0,0],['i mean',0,1]];
  function markerBoundaryOK(ch, s, e, latin) {
    if (latin) {
      if (s > 0 && isAsciiCh(ch[s - 1]) && isLetter(ch[s - 1])) return false;
      if (e < ch.length && isAsciiCh(ch[e]) && isLetter(ch[e])) return false;
      return true;
    }
    return s === 0 || isBreak(ch[s - 1]);
  }
  function splitLastClause(before) {
    const ch = A(trimEdges(before)); if (!ch.length) return ['', ''];
    let end = ch.length;
    if (isBreak(ch[end - 1])) { end--; while (end > 0 && isWS(ch[end - 1])) end--; }
    let split = end;
    while (split > 0) { split--; if (isBreak(ch[split])) { split++; break; } }
    return [ch.slice(0, split).join(''), trimEdges(ch.slice(split, end).join(''))];
  }
  function joinClause(leading, replacement) {
    const l = leading.trim(), r = replacement.trim();
    if (!l) return r; if (!r) return l;
    const last = A(l).pop();
    if (isBreak(last)) { if (last !== '\n' && isAsciiCh(A(r)[0])) return l + ' ' + r; return l + r; }
    if (A(l).some(isCJK) && A(r).some(isCJK)) return l + '，' + r;
    return l + ' ' + r;
  }
  function stripCorrectionPrefix(text) {
    let v = text.trim();
    for (const p of ['改成','改为','换成','改到']) if (v.startsWith(p)) { v = v.slice(p.length).replace(/^[ \t]+|[ \t]+$/g, ''); break; }
    if (v.startsWith('是') && A(v).length > 1) { const rest = v.slice(1); if (!['否','的','非','不'].some(b => rest.startsWith(b))) v = rest; }
    return v;
  }
  function replaceTail(clause, after) {
    const ca = trimEdges(after); if (!clause) return ca;
    if (clause.includes(' ') || ca.includes(' ')) {
      const words = clause.split(' ').filter(Boolean), inc = ca.split(' ').filter(Boolean);
      const n = Math.max(inc.length, 1); if (words.length <= n) return ca;
      return [...words.slice(0, words.length - n), ...inc].join(' ');
    }
    const n = Math.max(A(ca).length, 1); const c = A(clause); if (c.length <= n) return ca;
    return c.slice(0, c.length - n).join('') + ca;
  }
  function correctOnce(text) {
    const ch = A(text), lower = A(text.toLowerCase()); let best = null;
    for (const [phrase, whole, latin] of markers) {
      const needle = A(latin ? phrase.toLowerCase() : phrase); const src = latin ? lower : ch;
      for (let s = 0; s + needle.length <= ch.length; s++) {
        if (startsWith(src, s, needle) && markerBoundaryOK(ch, s, s + needle.length, latin)) { if (!best || s < best.start) best = { start: s, end: s + needle.length, whole: !!whole }; break; }
      }
    }
    if (!best) return null;
    const before = ch.slice(0, best.start).join('');
    const after = trimSet(trimEdges(ch.slice(best.end).join('')), '，,。.!！？?、；;：: ');
    const [leading, clause] = splitLastClause(before);
    const whole = best.whole || A(after).length * 2 >= Math.max(A(clause).length, 1);
    return joinClause(leading, whole ? stripCorrectionPrefix(after) : replaceTail(clause, after));
  }
  function applySelfCorrections(text) { let cur = text; for (let i = 0; i < 6; i++) { const n = correctOnce(cur); if (n === null || n === cur) break; cur = n; } return cur; }

  // ---------- Fillers & repetition ----------
  const boundedFillers = ['你知道吧','就是说','怎么说呢','怎么说','你知道','然后呢','um','uh','er','ah','hmm','you know'];
  const clauseFillers = ['那个','嗯','啊','呃','额','哦','噢','然后'];
  const byLen = (l) => [...l].sort((a, b) => A(b).length - A(a).length);
  function removeBounded(text, phrases) {
    const sorted = byLen(phrases), ch = A(text), out = []; let i = 0;
    while (i < ch.length) {
      let removed = false;
      for (const p of sorted) {
        const needle = A(p);
        const cmp = isAsciiStr(p) ? A(ch.slice(i).join('').toLowerCase()) : ch.slice(i);
        if (!startsWith(cmp, 0, needle)) continue;
        const end = i + needle.length;
        if ((i === 0 || isFillerBoundary(ch[i - 1])) && (end >= ch.length || isFillerBoundary(ch[end]))) {
          while (out.length && out[out.length - 1] === ' ') out.pop();
          if (out.length && (out[out.length - 1] === ',' || out[out.length - 1] === '，')) out.pop();
          i = end;
          while (i < ch.length && ch[i] === ' ') i++;
          if (i < ch.length && (ch[i] === ',' || ch[i] === '，')) { i++; while (i < ch.length && ch[i] === ' ') i++; }
          if (out.length && i < ch.length && !isBreak(out[out.length - 1]) && ch[i] !== ' ') out.push(' ');
          removed = true; break;
        }
      }
      if (!removed) { out.push(ch[i]); i++; }
    }
    return out.join('');
  }
  function stripClauseInitial(text, phrases) {
    const sorted = byLen(phrases).map(A); let ch = A(text), changed = true, g = 0;
    while (changed && g < 20) {
      changed = false; g++; let i = 0, out = [], atStart = true;
      while (i < ch.length) {
        if (atStart) {
          while (i < ch.length && isWS(ch[i])) { out.push(ch[i]); i++; }
          let stripped = false;
          for (const n of sorted) if (startsWith(ch, i, n)) { i += n.length; stripped = changed = true; break; }
          if (stripped) continue;
          if (i >= ch.length) break;
        }
        out.push(ch[i]); atStart = isBreak(ch[i]); i++;
      }
      ch = out;
    }
    return ch.join('');
  }
  const removeFillers = (t) => stripClauseInitial(removeBounded(t, boundedFillers), clauseFillers);
  const redup = new Set(['妈妈','爸爸','爷爷','奶奶','姥姥','姥爷','宝宝','星星','天天','谢谢','慢慢','刚刚','常常','看看','试试','聊聊','走走','坐坐']);
  function splitKeepingBreaks(text) { const p = []; let cur = ''; for (const c of A(text)) { if (isBreak(c)) { if (cur) { p.push(cur); cur = ''; } p.push(c); } else cur += c; } if (cur) p.push(cur); return p; }
  function collapseClauseDupes(text) {
    const kept = []; let prev = '';
    for (const piece of splitKeepingBreaks(text)) {
      if (A(piece).every(c => isBreak(c) || isWS(c))) { kept.push(piece); continue; }
      const cl = trimEdges(piece);
      if (prev && (cl === prev || (prev.endsWith(cl) && A(cl).length >= 2))) continue;
      kept.push(piece); prev = cl;
    }
    return kept.join('');
  }
  function collapseChunks(text) {
    const ch = A(text), out = []; let i = 0;
    while (i < ch.length) {
      let consumed = false; const longest = Math.min(8, Math.floor((ch.length - i) / 2));
      if (longest >= 1) {
        const upper = isAsciiCh(ch[i]) ? 1 : longest;
        for (let len = upper; len >= 1; len--) {
          const chunk = ch.slice(i, i + len).join(''); let reps = 1, cur = i + len;
          while (cur + len <= ch.length && ch.slice(cur, cur + len).join('') === chunk) { reps++; cur += len; }
          if (reps >= (len === 1 ? 3 : 2)) {
            if (redup.has(chunk) || (len === 1 && redup.has(chunk + chunk))) out.push(...ch.slice(i, cur)); else out.push(...A(chunk));
            i = cur; consumed = true; break;
          }
        }
      }
      if (!consumed) { out.push(ch[i]); i++; }
    }
    return out.join('');
  }
  const collapseEnglish = (t) => t.replace(/\b([A-Za-z]+)\b(?:\s+\1\b)+/gi, '$1');
  const removeRepetition = (t) => collapseEnglish(collapseChunks(collapseClauseDupes(t)));

  // ---------- Lists & tone ----------
  const trimListItem = (s) => trimSet(trimEdges(s), '，,、。.!！？?；;：: \n');
  const numbered = (items) => items.map((x, i) => `${i + 1}. ${x}`).join('\n');
  function partsByRanges(ch, ranges) {
    if (!ranges.length) return [ch.join('')];
    const items = [];
    if (ranges[0][0] > 0) { const pre = trimEdges(ch.slice(0, ranges[0][0]).join('')); if (pre) items.push(pre); }
    ranges.forEach((r, k) => { const end = k + 1 < ranges.length ? ranges[k + 1][0] : ch.length; const it = trimListItem(ch.slice(r[1], end).join('')); if (it) items.push(it); });
    return items;
  }
  function englishListMatches(ch) {
    const lower = ch.map(c => c.toLowerCase()), words = ['first','second','third','finally','next'].map(A), r = []; let s = 0;
    while (s < lower.length) {
      let hit = null;
      for (const w of words) { if (!startsWith(lower, s, w)) continue; const e = s + w.length; if ((s === 0 || !isLetter(lower[s - 1])) && (e === lower.length || !isLetter(lower[e]))) { hit = [s, e]; break; } }
      if (hit) { r.push(hit); s = hit[1]; } else s++;
    }
    return r;
  }
  function formatLists(text) {
    if (text.includes('\n1.')) return text;
    const mk = byLen(['首先','其次','接着','最后','第一','第二','第三','第四','第五','一是','二是','三是','四是','五是']).map(A);
    const ch = A(text), matches = []; let i = 0;
    while (i < ch.length) {
      let found = false;
      for (const n of mk) { if (!startsWith(ch, i, n)) continue; const nx = i + n.length; if (nx < ch.length && '名届章页'.includes(ch[nx])) continue; matches.push([i, nx]); i = nx; found = true; break; }
      if (!found) i++;
    }
    const en = englishListMatches(ch);
    if (matches.length < 2 && en.length < 2) return text;
    return numbered(partsByRanges(ch, en.length > matches.length ? en : matches));
  }
  const formalPairs = [['啥时候','什么时候'],['啥玩意儿','什么'],['啥玩意','什么'],['咱们','我们'],['咋样','怎样'],['搞定','完成'],['挺好的','很好'],['啥','什么'],['咋','怎么']];
  const concisePairs = [['就是说',''],['我觉得',''],['我想',''],['基本上',''],['差不多',''],['有一点',''],['其实',''],['可能',''],['大概',''],['稍微',''],['反正',''],['有点',''],['的话','']];
  function replacePhrases(t, pairs) { let r = t; for (const [a, b] of [...pairs].sort((x, y) => A(y[0]).length - A(x[0]).length)) r = replaceAll(r, a, b); return r; }
  function applyTone(t, tone) { return tone === 'formal' ? replacePhrases(t, formalPairs) : tone === 'concise' ? replacePhrases(t, concisePairs) : t; }

  // ---------- Tidy ----------
  function collapseSpaces(t) { let o = '', p = false; for (const c of A(t)) { if (c === ' ' || c === '\t') { if (!p) o += ' '; p = true; } else { o += c; p = false; } } return o; }
  function collapsePunctuation(t) {
    const o = [];
    for (const c of A(t)) {
      const last = o[o.length - 1];
      if (last !== undefined) {
        if (c === ' ' && '，。！？、；：…'.includes(last)) continue;
        if (isPunct(c) && last === ' ') { o.pop(); o.push(c); continue; }
        if (c === last && isPunct(c) && c !== '…') continue;
        if (c === '。' && (last === '，' || last === ',')) { o.pop(); o.push('。'); continue; }
        if (c === '，' && (last === '。' || last === '！' || last === '？')) continue;
      }
      o.push(c);
    }
    return o.join('');
  }
  function capitalize(t) { let o = '', cap = true; for (const c of A(t)) { if (cap && isLetter(c)) { o += c.toUpperCase(); cap = false; } else { o += c; if ('.!?'.includes(c)) cap = true; else if (!isWS(c)) cap = false; } } return o; }
  function isMostlyCJK(t) { const ch = A(t); const cjk = ch.filter(isCJK).length; const lat = ch.filter(c => /[A-Za-z]/.test(c)).length; return cjk >= lat && cjk > 0; }
  function tidy(text, tone) {
    let v = collapsePunctuation(collapseSpaces(text.split('\r\n').join('\n')));
    if (tone === 'concise') v = trimSet(v, '吧啊呀哦啦呢');
    v = trimEdges(v); if (!v) return '';
    if (v.includes('\n')) return v;
    const last = A(v).pop();
    if (isMostlyCJK(v)) {
      if ('。！？…?!'.includes(last)) return v;
      if (v.endsWith('吗') || v.endsWith('呢')) return v + '？';
      if (tone === 'casual' && '吧啊呀哦啦'.includes(last)) return v;
      if ('，,、；;'.includes(last)) return A(v).slice(0, -1).join('') + '。';
      return v + '。';
    }
    v = capitalize(v);
    if (isLetter(A(v).pop())) v += '.';
    return v;
  }

  const defaults = { tone: 'clear', entries: [], removeFillers: true, removeRepetition: true, applySelfCorrection: true, formatLists: true, spokenPunctuation: true };
  function polish(raw, opts) {
    const o = Object.assign({}, defaults, opts || {});
    let t = (raw || '').trim(); if (!t) return '';
    t = applyDictionary(t, o.entries);
    t = faithApply(t);
    if (o.spokenPunctuation) t = applySpokenPunctuation(t);
    if (o.applySelfCorrection) t = applySelfCorrections(t);
    if (o.removeFillers) t = removeFillers(t);
    if (o.removeRepetition) t = removeRepetition(t);
    if (o.formatLists) t = formatLists(t);
    t = applyTone(t, o.tone);
    return tidy(t, o.tone);
  }

  const api = { polish, faithApply, recognitionHints, installedCount: uniqueTerms.length, TONES: { clear: '清晰', casual: '随意', formal: '正式', concise: '简洁' } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BenyanPolisher = api;
})(typeof self !== 'undefined' ? self : this);
