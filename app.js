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

  function run(record) {
    const raw = $('raw').value.trim();
    $('out').value = raw ? P.polish(raw, { tone, entries }) : '';
    if (record && raw) {
      history.unshift({ t: Date.now(), raw, out: $('out').value });
      history = history.slice(0, 200); save('benyan.history', history); renderHistory();
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
    rec.onresult = (e) => {
      let interim = ''; finalText = '';
      for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript; }
      $('raw').value = base + finalText + interim;
    };
    rec.onerror = (e) => { const m = ERR[e.error] ?? ('听写出错：' + e.error + '。可以改用键盘上的麦克风。'); if (m) status(m, true); };
    rec.onend = () => { setMic(false); if ($('raw').value.trim() !== base.trim()) { run(true); if (!$('status').classList.contains('err')) status('已整理。点“复制”即可使用。'); } };
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

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
