'use strict';
// Движок визуальной новеллы: сцена, диалоги, выборы, карта, мини-игра, сохранения.
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const SET = Object.assign({ speed: 28, music: .5, sfx: .6 }, (() => { try { return JSON.parse(localStorage.getItem('alaya_set') || '{}'); } catch (e) { return {}; } })());
function saveSettings() { try { localStorage.setItem('alaya_set', JSON.stringify(SET)); } catch (e) {} }

const STAT = {
  love:   { icon: '❤', name: 'Семпай', good: 1 },
  rival:  { icon: '✿', name: 'Юкина', good: -1 },
  sanity: { icon: '✦', name: 'Рассудок', good: 1 },
  sus:    { icon: '👁', name: 'Подозрение', good: -1 },
};
const DAYS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
const PHASES = ['Утро, до уроков', 'Обеденный перерыв', 'После уроков'];
let S = null;

// ---------- масштабирование ----------
function fit() {
  const k = Math.min(innerWidth / 1280, innerHeight / 720);
  $('#stage').style.transform = `translate(-50%,-50%) scale(${k})`;
}
addEventListener('resize', fit);

// ---------- фон, тонировка, спрайты ----------
let curBG = '';
function setBG(name, opts, instant) {
  const layer = $('#bg'), div = document.createElement('div');
  curBG = name;
  div.className = 'bgimg'; div.innerHTML = ART.bg(name, opts);
  if (instant) { div.style.transition = 'none'; div.style.opacity = 1; } else div.style.opacity = 0;
  layer.appendChild(div);
  if (!instant) { void div.offsetWidth; setTimeout(() => { div.style.opacity = 1; }, 20); }
  setTimeout(() => { while (layer.children.length > 1 && layer.firstChild !== div) layer.removeChild(layer.firstChild); }, instant ? 0 : 950);
}
function tint(t) { $('#tint').className = 'layer ' + (t || 'day'); }

const POS = { left: '24%', center: '50%', right: '76%', farleft: '14%', farright: '86%' };
const sprites = {};
function show(id, ex = 'neutral', pos = 'center') {
  let el = sprites[id];
  if (!el) {
    el = document.createElement('div');
    el.className = 'spr enter'; el.dataset.ex = '';
    $('#sprites').appendChild(el); sprites[id] = el;
    void el.offsetWidth; setTimeout(() => el.classList.remove('enter'), 20);
  }
  el.style.left = POS[pos] || pos;
  setExpr(id, ex);
}
function setExpr(id, ex) {
  const el = sprites[id]; if (!el || !ex || el.dataset.ex === ex) return;
  el.innerHTML = ART.char(id, ex); el.dataset.ex = ex;
}
function hide(id) {
  const el = sprites[id]; if (!el) return;
  delete sprites[id]; el.classList.add('leave');
  setTimeout(() => el.remove(), 450);
}
function hideAll() { Object.keys(sprites).forEach(hide); }

// ---------- эффекты ----------
function fx(type) {
  const sc = $('#scene');
  if (type === 'shake' || type === 'glitch') {
    sc.classList.remove(type); void sc.offsetWidth; sc.classList.add(type);
    setTimeout(() => sc.classList.remove(type), 600);
    if (type === 'glitch') AU.sfx('glitch');
  } else {
    const f = $('#flash');
    f.style.background = type === 'red' ? '#b00018' : type === 'black' ? '#000' : '#fff';
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }
}
const WHISPERS = ['он мой', 'только мой', 'убери её', 'никто не узнает', 'смотри на меня', 'она лишняя', 'ты нужна ему', 'алая нить', 'ближе', 'не отпускай'];
function whisper(text) {
  const w = document.createElement('div');
  w.className = 'whisper'; w.textContent = text || pick(WHISPERS);
  w.style.left = (80 + Math.random() * 900) + 'px'; w.style.top = (90 + Math.random() * 330) + 'px';
  w.style.transform = `rotate(${Math.random() * 16 - 8}deg)`;
  $('#whispers').appendChild(w); setTimeout(() => w.remove(), 2700);
}

// ---------- частицы ----------
const PART = { type: null, arr: [] };
function particles(t) { PART.type = t; PART.arr = []; }
(function partLoop() {
  const cv = $('#parts'), cx = cv.getContext('2d');
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last) / 16.67; last = now;
    cx.clearRect(0, 0, 1280, 720);
    const t = PART.type;
    if (t) {
      const want = { leaves: 26, rain: 160, sparks: 50, dust: 40, petals: 30 }[t] || 0;
      while (PART.arr.length < want) PART.arr.push(spawn(t, true));
      for (const p of PART.arr) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life += dt;
        if (t === 'leaves' || t === 'petals') p.vx = Math.sin(p.life * .03 + p.ph) * 1.2 - .6;
        if (p.y > 740 || p.y < -40 || p.x < -40 || p.x > 1320) Object.assign(p, spawn(t, false));
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
        if (t === 'leaves' || t === 'petals') {
          cx.fillStyle = p.c; cx.globalAlpha = .85;
          cx.beginPath(); cx.ellipse(0, 0, p.s, p.s * .5, 0, 0, Math.PI * 2); cx.fill();
        } else if (t === 'rain') {
          cx.strokeStyle = 'rgba(200,215,255,.45)'; cx.lineWidth = 1.5;
          cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-3, p.s); cx.stroke();
        } else if (t === 'sparks') {
          cx.globalAlpha = .4 + .6 * Math.abs(Math.sin(p.life * .08 + p.ph));
          cx.fillStyle = p.c; cx.shadowColor = p.c; cx.shadowBlur = 10;
          cx.beginPath(); cx.arc(0, 0, p.s, 0, Math.PI * 2); cx.fill();
        } else {
          cx.globalAlpha = .25 + .2 * Math.sin(p.life * .05 + p.ph); cx.fillStyle = '#fff8e0';
          cx.beginPath(); cx.arc(0, 0, p.s, 0, Math.PI * 2); cx.fill();
        }
        cx.restore();
      }
    }
    requestAnimationFrame(frame);
  }
  function spawn(t, init) {
    const R = Math.random;
    const p = { x: R() * 1280, y: init ? R() * 720 : -20, vx: 0, vy: 0, r: R() * 6, vr: 0, s: 4, life: 0, ph: R() * 6, c: '#fff' };
    if (t === 'leaves') Object.assign(p, { vy: 1 + R() * 1.4, vr: (R() - .5) * .08, s: 6 + R() * 6, c: pick(['#e0662e', '#f0a030', '#c43a2a', '#e8b040']) });
    if (t === 'petals') Object.assign(p, { vy: .8 + R(), vr: (R() - .5) * .06, s: 4 + R() * 4, c: pick(['#ffc0d4', '#ffd8e4', '#ff9ab8']) });
    if (t === 'rain') Object.assign(p, { vy: 16 + R() * 8, vx: -2, s: 14 + R() * 14, r: 0 });
    if (t === 'sparks') Object.assign(p, { y: init ? R() * 720 : 730, vy: -(.4 + R() * .9), vx: (R() - .5) * .4, s: 1.5 + R() * 2.5, c: pick(['#ffb060', '#ff7040', '#ffe090']) });
    if (t === 'dust') Object.assign(p, { vy: (R() - .5) * .3, vx: (R() - .3) * .3, s: 1 + R() * 2, y: R() * 720, x: init ? R() * 1280 : -10 });
    return p;
  }
  requestAnimationFrame(frame);
})();

// ---------- HUD ----------
function showHUD() { $('#hud').hidden = false; $('#toolbar').hidden = false; updateHUD(); }
function hideHUD() { $('#hud').hidden = true; }
function updateHUD() {
  if (!S) return;
  const dl = $('#daylabel');
  dl.innerHTML = S.day <= 5 ? `День ${S.day} · ${DAYS[S.day]}<small>${S.phase >= 0 ? PHASES[S.phase] : 'Утро'}</small>` : 'Фестиваль';
  for (const k in STAT) {
    const b = $(`#stats .bar.${k}`);
    b.querySelector('.fill').style.width = S[k] + '%';
    b.querySelector('.v').textContent = S[k];
  }
  const v = $('#vignette');
  v.style.opacity = clamp((45 - S.sanity) / 45, 0, 1) * .9;
  v.classList.toggle('pulse', S.sanity < 25);
  document.body.classList.toggle('insane', S.sanity < 20);
}
function toast(html, color) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = html; if (color) t.style.color = color;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2900);
}
function stat(ch) {
  for (const k in ch) {
    const v = ch[k]; if (!v || !(k in STAT)) continue;
    const before = S[k];
    S[k] = clamp(S[k] + v, 0, 100);
    const real = S[k] - before; if (!real) continue;
    const good = (real > 0 ? 1 : -1) * STAT[k].good > 0;
    toast(`${STAT[k].icon} ${STAT[k].name} ${real > 0 ? '+' : ''}${real}`, good ? '#9dffb8' : '#ff8a8a');
  }
  updateHUD();
  if (S.sanity < 25 && Math.random() < .5) setTimeout(() => whisper(), 400);
}

// ---------- диалоги ----------
let typing = false, typeDone = null, advanceRes = null, skipMode = false, ctrlSkip = false, autoMode = false;
const LOG = [];
function curSkip() { return skipMode || ctrlSkip; }

async function say(who, text, ex) {
  const box = $('#dialog'), nb = $('#namebox'), tx = $('#text'), por = $('#portrait');
  box.hidden = false;
  let name = '', color = '', cls = '';
  if (who === 'think') cls = 'thought';
  else if (!who) cls = 'narr';
  else { const c = ART.CH[who]; name = c ? c.name : who; color = c ? c.color : '#6a5a6a'; }
  if (who && sprites[who]) {
    if (ex) setExpr(who, ex);
    for (const k in sprites) sprites[k].classList.toggle('dim', k !== who);
  } else for (const k in sprites) sprites[k].classList.toggle('dim', who === 'think' || who === 'rei');
  if (who === 'rei' || who === 'think') {
    const pe = ex || (S && S.sanity < 20 ? 'blank' : 'neutral');
    if (por.dataset.ex !== pe) { por.innerHTML = ART.char('rei', pe, true); por.dataset.ex = pe; }
    por.hidden = false; box.classList.add('withpor');
  } else { por.hidden = true; box.classList.remove('withpor'); }
  nb.textContent = name; nb.style.background = color; nb.hidden = !name;
  tx.className = cls;
  LOG.push({ name, text, cls }); if (LOG.length > 300) LOG.shift();
  const pitch = { rei: 480, sora: 300, yukina: 620, hina: 680, kaito: 260 }[who] || 420;
  await typeText(tx, text, pitch);
  if (who === 'think' && S && S.sanity < 22 && Math.random() < .4) whisper();
  await waitNext(text.length);
}
function typeText(el, text, pitch) {
  return new Promise(res => {
    let i = 0, tm = null;
    typing = true; el.textContent = '';
    const finish = () => { clearTimeout(tm); el.textContent = text; typing = false; typeDone = null; res(); };
    typeDone = finish;
    if (curSkip() || SET.speed <= 1) { finish(); return; }
    const step = () => {
      if (curSkip()) { finish(); return; }
      i++; el.textContent = text.slice(0, i);
      if (i % 3 === 0) AU.sfx('blip', pitch + Math.random() * 40);
      if (i >= text.length) { typing = false; typeDone = null; res(); return; }
      const ch = text[i - 1];
      tm = setTimeout(step, SET.speed * ('.!?…'.includes(ch) ? 7 : ch === ',' || ch === '—' ? 3 : 1));
    };
    step();
  });
}
function waitNext(len) {
  $('#next').hidden = false;
  return new Promise(res => {
    let t = null;
    const go = () => { clearTimeout(t); advanceRes = null; $('#next').hidden = true; res(); };
    advanceRes = go;
    if (curSkip()) t = setTimeout(go, 45);
    else if (autoMode) t = setTimeout(go, 1300 + len * 45);
  });
}
function advance() {
  if (typing && typeDone) { typeDone(); return; }
  if (advanceRes) advanceRes();
}
function hideDialog() { $('#dialog').hidden = true; }

// ---------- выборы ----------
function choice(opts, prompt) {
  return new Promise(res => {
    const box = $('#choices'); box.innerHTML = ''; box.hidden = false;
    $('#next').hidden = true;
    if (prompt) { const p = document.createElement('div'); p.className = 'cprompt'; p.textContent = prompt; box.appendChild(p); }
    opts.forEach((o, i) => {
      if (o.hide) return;
      const b = document.createElement('button');
      b.className = 'choice' + (o.red ? ' red' : '') + (o.dis ? ' dis' : '');
      b.innerHTML = o.t + (o.hint ? `<span class="hint">${o.hint}</span>` : '');
      b.onmouseenter = () => AU.sfx('hover');
      b.onclick = e => {
        e.stopPropagation();
        if (o.dis) { AU.sfx('deny'); fx('shake'); return; }
        AU.sfx('select'); box.hidden = true; box.innerHTML = '';
        res(o.v !== undefined ? o.v : i);
      };
      box.appendChild(b);
    });
  });
}

// ---------- карточка главы ----------
function card(t1, t2, ms = 2400) {
  return new Promise(res => {
    const c = $('#card');
    c.innerHTML = `<div class="t1">${t1}</div><div class="t2">${t2 || ''}</div><div class="line"></div>`;
    c.hidden = false;
    let done = false;
    const end = () => { if (done) return; done = true; c.hidden = true; res(); };
    c.onclick = end;
    setTimeout(end, curSkip() ? 300 : ms);
  });
}

// ---------- карта локаций ----------
function mapScreen(locs) {
  return new Promise(res => {
    const m = $('#map');
    hideDialog();
    m.innerHTML = `<h2>Куда пойти?</h2><div class="sub">День ${S.day} · ${DAYS[S.day]} — ${PHASES[S.phase]}. Выбери место и действие.</div>
      <div class="mapwrap"><div class="locgrid"></div><div class="actpanel"><div class="ph">Выбери место слева</div></div></div>`;
    const grid = m.querySelector('.locgrid'), panel = m.querySelector('.actpanel');
    locs.forEach(L => {
      const b = document.createElement('button');
      const has = L.actions.length > 0, clue = L.actions.some(a => a.clue);
      b.className = 'loc' + (has ? '' : ' off');
      b.innerHTML = `<div class="ic">${L.icon}</div><div class="nm">${L.name}</div><div class="cnt">${has ? L.actions.length + ' действ.' : 'сейчас нечего делать'}</div>${clue ? '<div class="q">?</div>' : ''}`;
      if (has) {
        b.onmouseenter = () => AU.sfx('hover');
        b.onclick = e => {
          e.stopPropagation(); AU.sfx('select');
          grid.querySelectorAll('.loc').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
          panel.innerHTML = `<h3>${L.icon} ${L.name}</h3>`;
          L.actions.forEach(A => {
            const ab = document.createElement('button');
            ab.className = 'act' + (A.dark ? ' dark' : '') + (A.clue ? ' clue' : '');
            ab.innerHTML = `<b>${A.t}</b><span>${A.desc}</span>${A.tags ? `<div class="tags">${A.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}`;
            ab.onmouseenter = () => AU.sfx('hover');
            ab.onclick = ev => { ev.stopPropagation(); AU.sfx('select'); m.hidden = true; res({ loc: L, act: A }); };
            panel.appendChild(ab);
          });
        };
      }
      grid.appendChild(b);
    });
    m.hidden = false;
  });
}

// ---------- мини-игра «Наблюдение» ----------
let inMini = false;
function stealthGame(diff = 0) {
  return new Promise(res => {
    const ov = $('#minigame');
    inMini = true; hideDialog();
    ov.innerHTML = `<div class="mg-bg">${ART.bg('hallway')}</div>
      <div class="mg-target away">${ART.char('sora', 'neutral')}</div>
      <div class="mg-focus"></div>
      <div class="mg-rei">${ART.char('rei', 'neutral', true)}</div>
      <div class="mg-pillar"></div>
      <div class="mg-eye">Смотрит в окно…</div>
      <div class="mg-title">Наблюдение</div>
      <div class="mg-help">Удерживай <kbd>ПРОБЕЛ</kbd> или <b>левую кнопку мыши</b>, чтобы смотреть на него.<br>Отпускай, когда он начинает оборачиваться!</div>
      <div class="mg-bars"><div class="t">Наблюдение</div><div class="mg-bar"><div class="pf"></div></div><div class="t">Время</div><div class="mg-bar tm"><div class="tf"></div></div></div>
      <button class="btn mg-start">Начать</button>`;
    ov.hidden = false;
    const tgt = ov.querySelector('.mg-target'), eye = ov.querySelector('.mg-eye');
    const pf = ov.querySelector('.pf'), tf = ov.querySelector('.tf'), rei = ov.querySelector('.mg-rei');
    let holding = false, phase = 'calm', pt = 0, pdur = 2000, prog = 0, time = 0, running = false, last = 0, over = false;
    const LIMIT = 20000, NEED = 5200;
    const durs = {
      calm: () => 1300 + Math.random() * 1900 - diff * 150,
      warn: () => Math.max(330, 620 - diff * 70),
      look: () => 900 + Math.random() * 900,
    };
    const setPhase = p => {
      phase = p; pt = 0; pdur = durs[p]();
      eye.className = 'mg-eye' + (p === 'calm' ? '' : ' ' + p);
      eye.textContent = p === 'calm' ? pick(['Смотрит в окно…', 'Читает книгу…', 'Болтает с другом…']) : p === 'warn' ? 'Шевельнулся…' : 'ОБОРАЧИВАЕТСЯ!';
      tgt.classList.toggle('away', p !== 'look');
      if (p === 'look') tgt.innerHTML = ART.char('sora', 'neutral');
      if (p === 'warn') AU.sfx('blip', 900);
    };
    const press = v => { if (!running) return; holding = v; ov.classList.toggle('peek', v); rei.innerHTML = ART.char('rei', v ? 'blush' : 'neutral', true); };
    const kd = e => { if (e.code === 'Space') { e.preventDefault(); press(true); } };
    const ku = e => { if (e.code === 'Space') { e.preventDefault(); press(false); } };
    const md = e => { if (e.button === 0 && !e.target.closest('.mg-start')) press(true); };
    const mu = () => press(false);
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    ov.addEventListener('mousedown', md); addEventListener('mouseup', mu);
    ov.addEventListener('touchstart', e => { e.preventDefault(); press(true); }, { passive: false });
    ov.addEventListener('touchend', e => { e.preventDefault(); press(false); }, { passive: false });
    ov.querySelector('.mg-start').onclick = e => {
      e.stopPropagation(); e.target.remove(); running = true; last = performance.now(); setPhase('calm'); requestAnimationFrame(loop);
    };
    function loop(now) {
      if (over) return;
      const dt = Math.min(60, now - last); last = now;
      time += dt; pt += dt;
      if (pt >= pdur) setPhase(phase === 'calm' ? 'warn' : phase === 'warn' ? 'look' : 'calm');
      if (holding) {
        if (phase === 'look' && pt > 140) return end(false);
        if (phase !== 'look') prog += dt;
      }
      pf.style.width = Math.min(100, prog / NEED * 100) + '%';
      tf.style.width = Math.max(0, 100 - time / LIMIT * 100) + '%';
      if (prog >= NEED) return end(true);
      if (time >= LIMIT) return end(false, true);
      requestAnimationFrame(loop);
    }
    function end(win, timeout) {
      over = true; running = false;
      removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('mouseup', mu);
      if (!win && !timeout) { tgt.classList.remove('away'); tgt.innerHTML = ART.char('sora', 'surprised'); fx('shake'); }
      AU.sfx(win ? 'win' : 'fail');
      const r = document.createElement('div'); r.className = 'mg-result';
      r.innerHTML = win ? '<span style="color:#9dffb8">Ты узнала кое-что новое</span>' : timeout ? '<span style="color:#ccc">Он ушёл…</span>' : '<span style="color:#ff6a7a">Он тебя заметил!</span>';
      ov.appendChild(r);
      setTimeout(() => { ov.hidden = true; ov.innerHTML = ''; ov.classList.remove('peek'); inMini = false; res(win ? 'win' : timeout ? 'timeout' : 'caught'); }, 1700);
    }
  });
}

// ---------- сохранения ----------
function saveGame() { try { localStorage.setItem('alaya_save', JSON.stringify(S)); } catch (e) {} }
function loadGame() { try { return JSON.parse(localStorage.getItem('alaya_save')); } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem('alaya_save'); } catch (e) {} }
function getEndings() { try { return JSON.parse(localStorage.getItem('alaya_endings') || '[]'); } catch (e) { return []; } }
function unlockEnding(id) { const a = getEndings(); if (!a.includes(id)) { a.push(id); try { localStorage.setItem('alaya_endings', JSON.stringify(a)); } catch (e) {} } }

// ---------- оверлеи-панели ----------
function panel(html, onBind) {
  const m = $('#menu');
  m.innerHTML = `<div class="panel">${html}</div>`;
  m.hidden = false;
  m.onclick = e => e.stopPropagation();
  if (onBind) onBind(m);
}
function closePanel() { $('#menu').hidden = true; $('#menu').innerHTML = ''; }
function panelOpen() { return !$('#menu').hidden; }

const HELP_HTML = `<h2>Как играть</h2>
<p>Ты — <b>Аманэ Рэй</b>. До Фестиваля Фонарей пять дней. Каждый день делится на периоды: утро, обед и время после уроков. В каждый период выбери <b>одно место и одно действие</b>.</p>
<ul>
<li><b>❤ Семпай</b> — насколько Сора к тебе привязан.</li>
<li><b>✿ Юкина</b> — насколько близка к нему соперница. Каждый вечер она становится ближе.</li>
<li><b>✦ Рассудок</b> — если он упадёт до нуля, пути назад не будет.</li>
<li><b>👁 Подозрение</b> — если оно дойдёт до 100, тебя раскроют.</li>
</ul>
<p>Наблюдай за семпаем, чтобы узнать, что он любит. В разговоре знакомые темы отмечены звёздочкой <b>★</b>.</p>
<p>Иногда в школе происходит что-то <b style="color:#ff9ad6">странное (?)</b>. Не всё здесь вращается вокруг тебя.</p>
<p>Управление: <kbd>клик</kbd> / <kbd>Пробел</kbd> / <kbd>Enter</kbd> — дальше, удерживай <kbd>Ctrl</kbd> — промотка, <kbd>Esc</kbd> — меню.<br>
Игра сохраняется автоматически в начале каждого периода. Концовок — десять.</p>`;

function openHelp(back) {
  panel(HELP_HTML + `<div class="row"><button class="btn sm" id="pclose">Понятно</button></div>`, m => {
    m.querySelector('#pclose').onclick = () => { closePanel(); if (back) back(); };
  });
}
function openSettings(back) {
  panel(`<h2>Настройки</h2>
    <label>Скорость текста <input type="range" id="s-speed" min="0" max="60" step="1"></label>
    <label>Музыка <input type="range" id="s-music" min="0" max="1" step=".05"></label>
    <label>Звуки <input type="range" id="s-sfx" min="0" max="1" step=".05"></label>
    <div class="row"><button class="btn sm" id="pclose">Готово</button></div>`, m => {
    const sp = m.querySelector('#s-speed'), mu = m.querySelector('#s-music'), sf = m.querySelector('#s-sfx');
    sp.value = 60 - SET.speed; mu.value = SET.music; sf.value = SET.sfx;
    sp.oninput = () => { SET.speed = 60 - +sp.value; saveSettings(); };
    mu.oninput = () => { SET.music = +mu.value; AU.vol(); saveSettings(); };
    sf.oninput = () => { SET.sfx = +sf.value; AU.vol(); saveSettings(); AU.sfx('blip', 600); };
    m.querySelector('#pclose').onclick = () => { closePanel(); if (back) back(); };
  });
}
function openLog() {
  const lines = LOG.slice(-80).map(l => `<div class="logline">${l.name ? `<b>${l.name}</b>` : ''}${l.cls === 'thought' ? `<i>${l.text}</i>` : l.text}</div>`).join('');
  panel(`<h2>Журнал</h2>${lines || '<p>Пока пусто.</p>'}<div class="row"><button class="btn sm" id="pclose">Закрыть</button></div>`, m => {
    m.querySelector('#pclose').onclick = closePanel;
    const p = m.querySelector('.panel'); p.scrollTop = p.scrollHeight;
  });
}
function openGallery(back) {
  const got = getEndings();
  const cards = Object.entries(ENDINGS).sort((a, b) => a[1].n - b[1].n).map(([id, e]) =>
    got.includes(id) ? `<div class="gcard"><b>${e.n}. ${e.title}</b><span>${e.type}</span></div>`
                     : `<div class="gcard lock"><b>${e.n}. ? ? ?</b><span>${e.secret ? 'Секретная концовка' : 'Не открыто'}</span></div>`).join('');
  panel(`<h2>Концовки — ${got.length} / ${Object.keys(ENDINGS).length}</h2><div class="gal">${cards}</div>
    <div class="row"><button class="btn sm" id="preset">Сбросить</button><button class="btn sm" id="pclose">Назад</button></div>`, m => {
    m.querySelector('#pclose').onclick = () => { closePanel(); if (back) back(); };
    const rb = m.querySelector('#preset');
    rb.onclick = () => {
      if (rb.dataset.sure) { try { localStorage.removeItem('alaya_endings'); } catch (e) {} openGallery(back); }
      else { rb.dataset.sure = 1; rb.textContent = 'Точно сбросить?'; }
    };
  });
}
function openGameMenu() {
  panel(`<h2>Пауза</h2><div class="col">
    <button class="btn" id="m-cont">Продолжить</button>
    <button class="btn" id="m-log">Журнал</button>
    <button class="btn" id="m-help">Как играть</button>
    <button class="btn" id="m-set">Настройки</button>
    <button class="btn" id="m-title">В главное меню</button></div>
    <p style="text-align:center;opacity:.55;font-size:13px;margin-top:16px">Прогресс сохраняется автоматически в начале каждого периода.</p>`, m => {
    m.querySelector('#m-cont').onclick = closePanel;
    m.querySelector('#m-log').onclick = openLog;
    m.querySelector('#m-help').onclick = () => openHelp(openGameMenu);
    m.querySelector('#m-set').onclick = () => openSettings(openGameMenu);
    m.querySelector('#m-title').onclick = () => location.reload();
  });
}

// ---------- экран концовки ----------
function endScreen(id) {
  return new Promise(() => {
    const e = ENDINGS[id];
    unlockEnding(id); clearSave();
    hideDialog(); hideHUD(); $('#toolbar').hidden = true; skipMode = false; autoMode = false;
    AU.music(e.music || 'sad');
    const got = getEndings().length, total = Object.keys(ENDINGS).length;
    const el = $('#ending');
    el.innerHTML = `<div class="etype">${e.type}</div><div class="etitle">${e.title}</div><div class="etext">${e.text}</div>
      <div class="ecount">Открыто концовок: ${got} из ${total}</div>
      ${e.hint ? `<div class="ehint">${e.hint}</div>` : ''}
      <div style="margin-top:28px"><button class="btn sm" id="e-title">В главное меню</button></div>`;
    el.hidden = false;
    el.querySelector('#e-title').onclick = e2 => { e2.stopPropagation(); location.reload(); };
  });
}

// ---------- ввод ----------
function blockingOverlay() {
  return !$('#choices').hidden || !$('#map').hidden || !$('#minigame').hidden || panelOpen() || !$('#title').hidden || !$('#ending').hidden;
}
function setupInput() {
  $('#stage').addEventListener('click', e => {
    if (e.target.closest('button, .overlay, #toolbar')) return;
    if (blockingOverlay() || inMini) return;
    advance();
  });
  addEventListener('keydown', e => {
    if (e.key === 'Control') { ctrlSkip = true; advance(); return; }
    if (inMini) return;
    if (e.key === 'Escape') {
      if (!$('#title').hidden || !$('#ending').hidden) return;
      panelOpen() ? closePanel() : (S && openGameMenu()); return;
    }
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      if (blockingOverlay()) return;
      advance();
    }
  });
  addEventListener('keyup', e => { if (e.key === 'Control') ctrlSkip = false; });
  addEventListener('blur', () => { ctrlSkip = false; });
  $('#toolbar').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    e.stopPropagation();
    const a = b.dataset.a;
    if (a === 'log') openLog();
    if (a === 'menu') openGameMenu();
    if (a === 'auto') { autoMode = !autoMode; b.classList.toggle('on', autoMode); if (autoMode) advance(); }
    if (a === 'skip') { skipMode = !skipMode; b.classList.toggle('on', skipMode); if (skipMode) advance(); }
  });
}
