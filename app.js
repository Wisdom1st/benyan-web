(() => {
  const $ = (id) => document.getElementById(id);
  const P = window.BenyanPolisher;
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  let entries = load('benyan.dict', []), history = load('benyan.history', []), tone = load('benyan.tone', 'clear');

  // tabs
  document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tab,.pane').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); $(b.dataset.tab).classList.add('on');
  });

  const status = (msg, err) => { $('status').textContent = msg || ''; $('status').classList.toggle('err', !!err); };

  // tones
  for (const [k, v] of Object.entries(P.TONES)) {
    const b = document.createElement('button'); b.textContent = v; b.dataset.k = k;
    b.onclick = () => { tone = k; save('benyan.tone', k); renderTones(); run(false); };
    $('tones').appendChild(b);
  }
  const renderTones = () => document.querySelectorAll('#tones button').forEach(b => b.classList.toggle('on', b.dataset.k === tone));
  renderTones();

  // ---- AI (DeepSeek) ----
  let aiKey = localStorage.getItem('benyan.dskey') || '';
  let aiOn = load('benyan.aiOn', true);
  let aiSeq = 0;
  const mask = (k) => k ? k.slice(0, 3) + '••••••' + k.slice(-4) : '未设置';
  function renderKey() { $('keyMask').textContent = mask(aiKey); $('aiOn').checked = aiOn; }
  $('saveKey').onclick = () => { const k = $('keyInput').value.trim(); if (!k) return; aiKey = k; localStorage.setItem('benyan.dskey', k); $('keyInput').value = ''; renderKey(); status('密钥已保存在这台手机上。'); };
  $('clearKey').onclick = () => { aiKey = ''; localStorage.removeItem('benyan.dskey'); renderKey(); status('密钥已清除。'); };
  $('aiOn').onchange = () => { aiOn = $('aiOn').checked; save('benyan.aiOn', aiOn); };
  renderKey();
  const SYSTEM = `你是一位听写编辑，服务对象是一位中国改革宗基督徒艺术家和老师。你会收到他口述后语音识别得到的原文。请：
1. 结合上下文修正语音识别错误和同音错字，尤其是圣经与教会用语（如耶稣、基督、圣灵、因信称义、主日崇拜、查经、团契、和合本人名与书卷名）以及书法、绘画术语（如笔墨、宣纸、中锋、皴法、写意、工笔、篆隶楷行草）。
2. 加上恰当的中文标点，合理断句、分段。
3. 删去口头禅、重复和说错后改口的部分（只保留改口之后的意思）。
4. 保持他的原意和说话风格，不要添加原文没有的内容，不要回答或评论原文。
5. 只有当他在列举时才用编号列表。
6. 时间等写法要自然（如“3:00”按语境写成“三点”或“3点”）。
7. 语气要求：{TONE}。
8. 个人词典（左边是说法，右边必须写成的样子）：{DICT}
只输出整理后的正文，不要任何说明。`;
  const TONE_HINT = { clear: '清晰——去掉杂音，尽量保留原措辞', casual: '随意——自然口语，只把话说顺', formal: '正式——适合邮件和工作消息', concise: '简洁——去掉客套，只留要点' };
  async function aiPolish(raw) {
    const dict = entries.length ? entries.map(e => `${e.spoken} → ${e.written}`).join('；') : '无';
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiKey },
        body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, messages: [
          { role: 'system', content: SYSTEM.replace('{TONE}', TONE_HINT[tone] || TONE_HINT.clear).replace('{DICT}', dict) },
          { role: 'user', content: raw } ] })
      });
      if (!r.ok) {
        const msg = { 401: '密钥无效，请到“设置”重新粘贴。', 402: 'DeepSeek 账户余额不足。', 429: '请求太频繁，请稍后再试。' }[r.status] || ('AI 服务出错（' + r.status + '）。');
        throw new Error(msg);
      }
      const j = await r.json();
      const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim();
      if (!text) throw new Error('AI 没有返回内容。');
      return P.faithApply(text);
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('AI 超时。');
      if (e instanceof TypeError) throw new Error(navigator.onLine ? '连不上 DeepSeek。' : '现在离线。');
      throw e;
    } finally { clearTimeout(timer); }
  }

  function run(record) {
    const raw = $('raw').value.trim();
    $('out').value = raw ? P.polish(raw, { tone, entries }) : '';
    let item = null;
    if (record && raw) {
      item = { t: Date.now(), raw, out: $('out').value };
      history.unshift(item);
      history = history.slice(0, 200); save('benyan.history', history); renderHistory();
    }
    if (record && raw && aiOn && aiKey) {
      const seq = ++aiSeq; status('正在用 AI 整理…');
      aiPolish(raw).then(text => {
        if (seq !== aiSeq || $('raw').value.trim() !== raw) return;
        $('out').value = text; status('AI 已整理。点“复制”即可使用。');
        if (item) { item.out = text; item.ai = true; save('benyan.history', history); renderHistory(); }
      }).catch(e => { if (seq === aiSeq) status(e.message + '已保留本地整理结果。', true); });
    }
  }
  $('polishBtn').onclick = () => run(true);
  $('clearBtn').onclick = () => { $('raw').value = ''; $('out').value = ''; status(''); };
  $('copyBtn').onclick = async () => {
    const t = $('out').value || $('raw').value; if (!t) return status('还没有内容可以复制。');
    try { await navigator.clipboard.writeText(t); status('已复制，可以去微信或备忘录粘贴。'); }
    catch { $('out').removeAttribute('readonly'); $('out').select(); document.execCommand('copy'); $('out').setAttribute('readonly', ''); status('已复制。'); }
  };

  // speech
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, live = false, base = '', finalText = '';
  const setMic = (on) => { live = on; $('mic').classList.toggle('live', on); $('micLabel').textContent = on ? '正在听…再点一下结束' : '点一下开始说话'; };
  const ERR = {
    'not-allowed': '麦克风或语音识别没有被允许。请到 设置 > Safari > 麦克风 选“允许”，并在 设置 > 隐私与安全性 > 语音识别 里打开 Safari，然后重试。',
    'service-not-allowed': '这台 iPhone 不允许网页使用语音识别。请确认 设置 > Siri 中已打开“听写”，或改用键盘上的麦克风。',
    'no-speech': '没有听到声音，请靠近一点再说。',
    'audio-capture': '找不到麦克风，可能正被别的 App 使用。',
    'network': '语音识别需要网络。现在连不上，请检查网络，或改用键盘上的麦克风（可离线）。',
    'aborted': '',
    'language-not-supported': '这台设备不支持中文网页听写，请改用键盘上的麦克风。',
  };
  if (!SR) {
    $('mic').disabled = true; $('mic').style.opacity = .5;
    status('这个浏览器不支持网页听写。请点下面的输入框，用 iPhone 键盘右下角的麦克风说话，再点“整理”。', true);
  }
  $('mic').onclick = () => {
    if (!SR) return;
    if (live) { rec && rec.stop(); return; }
    document.querySelector('.tab[data-tab=talk]').click();
    rec = new SR(); rec.lang = 'zh-CN'; rec.continuous = true; rec.interimResults = true;
    base = $('raw').value ? $('raw').value.replace(/\s+$/, '') : ''; finalText = '';
    rec.onstart = () => { setMic(true); status('请说话……'); };
    let cuts = [], prevInterim = '', lastAt = 0, finalCount = 0;
    rec.onresult = (e) => {
      // 每个最终片段、或停顿超过 0.8 秒的位置，都当作一句话的分界
      const now = Date.now(); const finals = []; let interim = '';
      for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finals.push(r[0].transcript); else interim += r[0].transcript; }
      if (finals.length !== finalCount) { finalCount = finals.length; cuts = []; prevInterim = ''; }
      if (lastAt && now - lastAt > 800 && prevInterim && interim.startsWith(prevInterim) && interim.length > prevInterim.length) cuts.push(prevInterim.length);
      lastAt = now; prevInterim = interim;
      const segs = []; let from = 0;
      for (const c of cuts) { segs.push(interim.slice(from, c)); from = c; }
      segs.push(interim.slice(from));
      const spoken = P.joinSegments([...finals, ...segs]);
      $('raw').value = base + (base && spoken && !/[。！？，,.!?\n]$/.test(base) ? '。' : '') + spoken;
    };
    rec.onerror = (e) => { const m = ERR[e.error] ?? ('听写出错：' + e.error + '。可以改用键盘上的麦克风。'); if (m) status(m, true); };
    rec.onend = () => { setMic(false); if ($('raw').value.trim() !== base.trim()) { const err = $('status').classList.contains('err'); run(true); if (!err && !(aiOn && aiKey)) status('已整理。点“复制”即可使用。'); } };
    try { rec.start(); } catch (err) { status('无法开始听写：' + err.message, true); setMic(false); }
  };

  // dictionary
  $('faithCount').textContent = P.installedCount;
  function renderEntries() {
    $('entries').innerHTML = '';
    entries.forEach((e, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="t"></span><button class="del">删除</button>';
      li.querySelector('.t').textContent = `${e.spoken} → ${e.written}`;
      li.querySelector('button').onclick = () => { entries.splice(i, 1); save('benyan.dict', entries); renderEntries(); };
      $('entries').appendChild(li);
    });
  }
  $('addEntry').onclick = () => {
    const s = $('spoken').value.trim(), w = $('written').value.trim(); if (!s || !w) return;
    entries = entries.filter(e => e.spoken !== s); entries.push({ spoken: s, written: w });
    save('benyan.dict', entries); $('spoken').value = $('written').value = ''; renderEntries();
  };
  renderEntries();

  // history
  function renderHistory() {
    $('history').innerHTML = '';
    if (!history.length) { $('history').innerHTML = '<li>还没有记录。</li>'; return; }
    history.forEach(h => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="t"><small></small></span><button>复制</button>';
      li.querySelector('small').textContent = new Date(h.t).toLocaleString('zh-CN');
      li.querySelector('.t').appendChild(document.createTextNode(h.out));
      li.querySelector('button').onclick = async () => { try { await navigator.clipboard.writeText(h.out); li.querySelector('button').textContent = '已复制'; } catch {} };
      $('history').appendChild(li);
    });
  }
  $('clearHist').onclick = () => { if (confirm('清空全部历史？')) { history = []; save('benyan.history', history); renderHistory(); } };
  renderHistory();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded && !live) { reloaded = true; location.reload(); } });
  }
})();
