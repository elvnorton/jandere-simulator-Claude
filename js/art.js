'use strict';
// Вся графика игры генерируется кодом в SVG: персонажи с эмоциями и фоны.
const ART = (() => {
  let U = 0;
  const R = (x, y, w, h, f, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${ex}/>`;
  const C = (x, y, r, f, ex = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${ex}/>`;
  const El = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${ex}/>`;
  const P = (d, f, ex = '') => `<path d="${d}" fill="${f}" ${ex}/>`;
  const LG = (id, stops, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">` +
    stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('') +
    `</linearGradient>`;
  const RG = (id, stops) =>
    `<radialGradient id="${id}">` +
    stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('') +
    `</radialGradient>`;
  function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const ch = [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16));
    const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return '#' + ch.map(v => Math.max(0, Math.min(255, f(v))).toString(16).padStart(2, '0')).join('');
  }

  // ================= ПЕРСОНАЖИ =================
  const CH = {
    rei:    { name: 'Рэй',   color: '#b8243c', fem: 1, skin: '#fbe7de', hair: '#1d1624', hair2: '#40304e', hl: '#8a78a8', eye: '#5c1a2a', eye2: '#c04a62', style: 'long', uni: 'sailor', collar: '#1c2140', scarf: '#a51e36', acc: 'pin' },
    sora:   { name: 'Сора',  color: '#3f70ad', fem: 0, skin: '#f7dfcf', hair: '#4e321f', hair2: '#80583a', hl: '#c09a70', eye: '#2c4c6c', eye2: '#7cacd4', style: 'messy', uni: 'blazer', jacket: '#2b3350', tie: '#3d5a9a' },
    yukina: { name: 'Юкина', color: '#d39320', fem: 1, skin: '#fde9de', hair: '#d4952f', hair2: '#f7d784', hl: '#fff4c4', eye: '#2f7a4c', eye2: '#8ad8a6', style: 'twin', uni: 'sailor', collar: '#24305a', scarf: '#e8577c', acc: 'bows' },
    hina:   { name: 'Хина',  color: '#d95a92', fem: 1, skin: '#fde8e0', hair: '#df749c', hair2: '#fac4d6', hl: '#ffffff', eye: '#8a3a7a', eye2: '#ec9ad4', style: 'bob', uni: 'sailor', collar: '#2a2f55', scarf: '#d94888', acc: 'star', cardigan: '#f3d4de' },
    kaito:  { name: 'Кайто', color: '#4e5f88', fem: 0, skin: '#f3dccd', hair: '#1b2440', hair2: '#3a4e7a', hl: '#7088c0', eye: '#3a3e52', eye2: '#8088aa', style: 'neat', uni: 'blazer', jacket: '#222838', tie: '#7a1d2c', acc: 'glasses' },
  };

  const HEAD_F = 'M134,150 Q132,92 200,88 Q268,92 266,150 Q266,198 242,230 Q216,256 200,257 Q184,256 158,230 Q134,198 134,150Z';
  const HEAD_M = 'M131,150 Q130,90 200,86 Q270,90 269,150 Q269,204 244,234 Q218,259 200,260 Q182,259 156,234 Q131,204 131,150Z';
  const BACK = {
    long: 'M110,150 Q102,50 200,44 Q298,50 290,150 Q298,300 306,470 Q312,560 302,650 Q250,620 200,640 Q150,620 98,650 Q88,560 94,470 Q102,300 110,150Z',
    bob: 'M112,150 Q106,52 200,46 Q294,52 288,150 Q296,232 284,286 Q262,300 238,292 L162,292 Q138,300 116,286 Q104,232 112,150Z',
    twin: 'M116,150 Q110,54 200,48 Q290,54 284,150 Q288,214 266,246 L134,246 Q112,214 116,150Z',
    messy: 'M116,168 Q106,56 200,48 Q294,56 284,168 Q292,214 278,250 L262,236 L254,258 L146,258 L138,236 L122,250 Q108,214 116,168Z',
    neat: 'M120,162 Q112,60 200,52 Q288,60 280,162 Q286,208 272,236 L128,236 Q114,208 120,162Z',
  };
  const TAIL = 'M130,96 Q72,98 58,190 Q44,300 62,420 Q74,500 98,566 Q102,500 106,450 Q120,360 124,280 Q128,190 152,122Z';
  const FRONT = {
    long: 'M128,150 Q122,60 200,54 Q278,60 272,150 L262,145 L250,149 L238,144 L226,149 L214,144 L200,149 L186,144 L174,149 L162,144 L150,149 L138,144Z',
    bob: 'M126,160 Q122,60 200,54 Q278,60 274,160 L263,132 L255,157 L241,124 L227,152 L214,120 L201,150 L188,118 L174,152 L160,126 L148,157 L138,134Z',
    twin: 'M124,164 Q120,58 200,52 Q280,58 276,164 L265,136 L257,160 L245,126 L231,150 L217,112 L207,140 L200,104 L193,140 L183,112 L169,150 L155,126 L143,160 L135,136Z',
    messy: 'M120,174 Q114,56 200,48 Q286,56 280,174 L270,142 L263,180 L250,130 L240,168 L226,118 L217,162 L204,112 L192,160 L178,116 L168,166 L154,128 L146,176 L132,144Z',
    neat: 'M122,168 Q116,58 200,50 Q284,58 280,162 L270,132 Q238,112 196,134 Q168,150 148,176 L146,142 L132,172Z',
  };
  const SIDE = {
    long: ['M124,118 Q116,190 122,260 L126,345 L152,345 L150,260 Q148,190 154,128Z'],
    bob: ['M126,138 Q114,206 130,268 L148,256 Q138,206 148,150Z'],
    twin: ['M124,140 Q114,210 128,262 L144,252 Q136,206 146,152Z'],
    messy: ['M120,150 Q116,190 126,214 L138,200 Q134,180 140,156Z'],
    neat: ['M122,150 Q118,186 128,206 L138,194 Q134,176 140,156Z'],
  };
  const EXP = {
    neutral: { e: 'open', b: 'n', m: 'n' },
    smile: { e: 'open', b: 'h', m: 'smile' },
    happy: { e: 'happy', b: 'h', m: 'open' },
    blush: { e: 'open', b: 'w', m: 'small', bl: 1 },
    sad: { e: 'sad', b: 'w', m: 'sad' },
    worried: { e: 'open', b: 'w', m: 'wavy', sw: 1 },
    angry: { e: 'angry', b: 'a', m: 'angry' },
    surprised: { e: 'surp', b: 's', m: 'o' },
    blank: { e: 'blank', b: 'n', m: 'n' },
    yandere: { e: 'yan', b: 'n', m: 'yan', sh: 1 },
    cry: { e: 'sad', b: 'w', m: 'sad', tear: 1 },
    smug: { e: 'smug', b: 'n', m: 'smile' },
    closed: { e: 'closed', b: 'h', m: 'smile' },
    cold: { e: 'blank', b: 'a', m: 'n', sh: 1 },
  };
  const BROW = {
    n: 'M-18,-30 Q-2,-36 16,-31', h: 'M-18,-33 Q-2,-40 16,-34', w: 'M-18,-31 Q0,-34 16,-40',
    a: 'M-18,-39 Q0,-35 16,-27', s: 'M-18,-38 Q-2,-46 16,-39',
  };

  function eyeG(c, u, side, type) {
    const x = side ? 233 : 167, y = 172, fem = c.fem, L = '#1c1018';
    const g = inner => `<g transform="translate(${x},${y}) scale(${side ? -1 : 1},1)">${inner}</g>`;
    if (type === 'happy') return g(`<path d="M-17,4 Q0,-13 17,2" stroke="${L}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`);
    if (type === 'closed') return g(`<path d="M-17,0 Q0,9 17,0" stroke="${L}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    const sc = fem ? 'M-18,-2 Q-8,-19 10,-15 Q17,-12 18,-4 Q16,12 2,15 Q-12,14 -18,-2Z'
                   : 'M-18,0 Q-6,-14 12,-11 Q18,-8 18,-2 Q14,10 2,12 Q-12,11 -18,0Z';
    const lash = fem ? 'M-24,1 Q-14,-21 6,-20 Q17,-19 22,-7 L18,-5 Q12,-14 4,-15 Q-10,-15 -18,0Z M-18,0 L-27,-5 L-20,-7Z'
                     : 'M-21,1 Q-8,-17 13,-13 Q19,-10 21,-4 L17,-3 Q10,-11 2,-11 Q-10,-11 -18,2Z';
    const id = `${u}e${side}`;
    let rx = fem ? 11.5 : 10.5, ry = fem ? 15 : 12.5, pr = [5, 7.5], hl = true;
    let iris = `url(#${u}i)`, pupil = shade(c.eye, -.6);
    if (type === 'surp') { rx *= .72; ry *= .72; pr = [2.6, 3.4]; }
    if (type === 'yan') { iris = `url(#${u}y)`; pr = [1.6, 6]; hl = false; pupil = '#1a0006'; }
    if (type === 'blank') { iris = shade(c.eye, -.35); hl = false; pupil = shade(c.eye, -.55); }
    let s = `<clipPath id="${id}"><path d="${sc}"/></clipPath><path d="${sc}" fill="#fff"/>`;
    s += `<g clip-path="url(#${id})"><ellipse cx="0" cy="${fem ? 1 : 0}" rx="${rx}" ry="${ry}" fill="${iris}"/>`;
    s += `<ellipse cx="0" cy="${fem ? 3 : 2}" rx="${pr[0]}" ry="${pr[1]}" fill="${pupil}"/>`;
    if (type === 'yan') s += `<ellipse cx="0" cy="1" rx="${rx - 3}" ry="${ry - 3}" fill="none" stroke="#ff8090" stroke-width="1" opacity=".6"/>`;
    if (hl) s += `<circle cx="-4" cy="-5" r="${fem ? 4 : 3.2}" fill="#fff"/><circle cx="4" cy="7" r="1.8" fill="#fff" opacity=".85"/>`;
    s += `<path d="M-20,-8 Q0,-18 20,-9 L20,-2 Q0,-11 -20,0Z" fill="${shade(c.eye, -.5)}" opacity=".28"/></g>`;
    s += `<path d="${lash}" fill="${L}"/>`;
    s += `<path d="${fem ? 'M-13,13 Q-2,18 8,14' : 'M-12,11 Q-2,14 8,11'}" stroke="${L}" stroke-width="1.6" fill="none" opacity=".55"/>`;
    const cut = { sad: [-3, -14], angry: [-14, -3], blank: [-7, -7], smug: [-8, -8] }[type];
    if (cut) s += `<path d="M-28,-28 L26,-28 L26,${cut[1]} L-28,${cut[0]}Z" fill="${c.skin}"/>` +
      `<path d="M-21,${cut[0] + 1.5} L19,${cut[1] + 1.5}" stroke="${L}" stroke-width="4" stroke-linecap="round"/>`;
    return g(s);
  }

  function mouth(type, c) {
    const st = `stroke="${shade(c.skin, -.55)}" stroke-width="2.4" fill="none" stroke-linecap="round"`;
    switch (type) {
      case 'smile': return `<path d="M188,223 Q200,233 212,223" ${st}/>`;
      case 'open': return `<path d="M186,221 Q200,243 214,221 Q200,226 186,221Z" fill="#8e2c3c"/><path d="M193,234 Q200,239 207,234 Q200,231 193,234Z" fill="#e06a7a"/>`;
      case 'small': return `<path d="M195,227 Q200,230 205,227" ${st}/>`;
      case 'sad': return `<path d="M190,231 Q200,223 210,231" ${st}/>`;
      case 'wavy': return `<path d="M188,229 Q193,224 198,229 Q203,234 208,229 Q211,226 213,228" ${st}/>`;
      case 'angry': return `<path d="M190,230 Q200,224 210,230" ${st}/>`;
      case 'o': return `<ellipse cx="200" cy="229" rx="5" ry="7" fill="#7a2a35"/>`;
      case 'yan': return `<path d="M176,218 Q200,242 224,218 Q200,231 176,218Z" fill="#4a0612"/><path d="M182,221 Q200,234 218,221" stroke="#fff" stroke-width="1.6" fill="none" opacity=".75"/>`;
      default: return `<path d="M193,227 Q200,229 207,227" ${st}/>`;
    }
  }

  function bow(x, y, col) {
    const d = shade(col, -.25);
    return P(`M${x},${y} L${x - 24},${y - 15} L${x - 21},${y + 15}Z`, col) +
      P(`M${x},${y} L${x + 24},${y - 15} L${x + 21},${y + 15}Z`, col) +
      P(`M${x - 3},${y + 3} L${x - 10},${y + 30} L${x + 1},${y + 5}Z`, d) +
      P(`M${x + 3},${y + 3} L${x + 10},${y + 30} L${x - 1},${y + 5}Z`, d) + C(x, y, 6, d);
  }
  function star(cx, cy, r, f, st) {
    let pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
      pts.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return `<polygon points="${pts.join(' ')}" fill="${f}" stroke="${st}" stroke-width="2"/>`;
  }

  function body(c) {
    let s = '';
    if (c.uni === 'sailor') {
      const W = '#f6f6fb', Wd = '#d9d9e6';
      s += P('M90,700 L94,376 Q100,302 176,274 L224,274 Q300,302 306,376 L310,700Z', W);
      s += P('M94,376 Q100,302 176,274 L182,300 Q124,322 116,410 L112,700 L90,700Z', Wd);
      s += P('M306,376 Q300,302 224,274 L218,300 Q276,322 284,410 L288,700 L310,700Z', Wd, 'opacity=".6"');
      s += `<path d="M124,420 Q120,560 126,700 M276,420 Q280,560 274,700" stroke="${Wd}" stroke-width="3" fill="none"/>`;
      if (c.cardigan) {
        const cd = c.cardigan, cdd = shade(cd, -.18);
        s += P('M88,700 L92,376 Q98,300 176,272 L188,300 L178,700Z', cd) + P('M312,700 L308,376 Q302,300 224,272 L212,300 L222,700Z', cd);
        s += `<path d="M178,700 L188,300 M222,700 L212,300 M122,430 Q118,560 124,700 M278,430 Q282,560 276,700" stroke="${cdd}" stroke-width="3" fill="none"/>`;
        s += C(184, 470, 4, cdd) + C(182, 540, 4, cdd) + C(180, 610, 4, cdd);
      }
      s += P('M116,302 Q150,278 178,272 L200,352 L222,272 Q250,278 284,302 L302,354 L226,358 L200,406 L174,358 L98,354Z', c.collar);
      s += `<path d="M108,344 L170,348 L200,396 L230,348 L292,344" stroke="#fff" stroke-width="3" fill="none" opacity=".9"/>`;
      const sc = c.scarf, sd = shade(sc, -.25);
      s += P('M200,384 L160,366 L166,408Z', sc) + P('M200,384 L240,366 L234,408Z', sc);
      s += P('M195,390 L176,470 L193,460 L200,396Z', sd) + P('M205,390 L224,470 L207,460 L200,396Z', sd) + C(200, 386, 9, sd);
      s += P('M112,612 L288,612 L300,700 L100,700Z', c.collar);
      s += `<path d="M140,612 L134,700 M170,612 L168,700 M200,612 L200,700 M230,612 L232,700 M260,612 L266,700" stroke="${shade(c.collar, -.35)}" stroke-width="2"/>`;
    } else {
      const J = c.jacket, Jd = shade(J, -.25), Jl = shade(J, .1);
      s += P('M86,700 L90,370 Q96,300 174,274 L226,274 Q304,300 310,370 L314,700Z', J);
      s += P('M90,370 Q96,300 174,274 L180,300 Q120,322 114,410 L110,700 L86,700Z', Jd, 'opacity=".7"');
      s += P('M176,274 L200,376 L224,274Z', '#f4f4f8');
      s += P('M176,274 L190,304 L200,288Z', '#fff', 'stroke="#ccd"') + P('M224,274 L210,304 L200,288Z', '#fff', 'stroke="#ccd"');
      s += P('M193,288 L207,288 L212,308 L206,430 L200,442 L194,430 L188,308Z', c.tie) + P('M192,284 L208,284 L205,302 L195,302Z', shade(c.tie, -.25));
      s += `<path d="M190,330 L210,318 M189,360 L210,348 M190,390 L208,378" stroke="${shade(c.tie, .3)}" stroke-width="4"/>`;
      s += P('M174,274 L200,376 L170,430 L148,330Z', Jl) + P('M226,274 L200,376 L230,430 L252,330Z', Jl);
      s += C(200, 480, 5, '#c8b070') + C(200, 540, 5, '#c8b070');
      s += `<path d="M124,420 Q120,560 126,700 M276,420 Q280,560 274,700" stroke="${Jd}" stroke-width="3" fill="none"/>`;
      s += P('M246,410 l16,0 l0,14 q-8,9 -16,0Z', '#c8b070');
      if (c.acc === 'glasses') s += P('M92,470 L128,476 L128,514 L91,508Z', '#b02030') +
        `<text x="110" y="497" font-size="9" fill="#fff" text-anchor="middle" font-family="sans-serif" transform="rotate(8 110 497)">СОВЕТ</text>`;
    }
    return s;
  }

  function acc(c) {
    switch (c.acc) {
      case 'pin': return `<g stroke="#c4223c" stroke-width="4" stroke-linecap="round"><line x1="138" y1="104" x2="164" y2="124"/><line x1="140" y1="126" x2="162" y2="102"/></g>` + C(164, 124, 3, '#ff5a70');
      case 'bows': return bow(132, 96, c.scarf) + bow(268, 96, c.scarf);
      case 'star': return star(256, 110, 13, '#ffd84a', '#d99a18');
      case 'glasses': return `<g fill="rgba(210,225,255,.18)" stroke="#16161f" stroke-width="3"><rect x="143" y="156" width="46" height="32" rx="9"/><rect x="211" y="156" width="46" height="32" rx="9"/></g>` +
        `<path d="M189,168 Q200,162 211,168 M143,166 L132,164 M257,166 L268,164" stroke="#16161f" stroke-width="3" fill="none"/>` +
        `<path d="M150,163 L161,158 M218,163 L229,158" stroke="#fff" stroke-width="2" opacity=".7"/>`;
    }
    return '';
  }

  function char(id, ex = 'neutral', crop = false) {
    const c = CH[id]; if (!c) return '';
    let extra = '';
    if (ex && ex.includes('+')) [ex, extra] = ex.split('+');
    const e = EXP[ex] || EXP.neutral, u = 'c' + (++U);
    const head = c.fem ? HEAD_F : HEAD_M, hairDk = shade(c.hair, -.3), H = `url(#${u}h)`;
    let s = `<defs>${LG(u + 'h', [[0, c.hair2], [.45, c.hair], [1, shade(c.hair, -.25)]])}` +
      `${LG(u + 'i', [[0, shade(c.eye, -.45)], [.45, c.eye], [1, c.eye2]])}` +
      `${LG(u + 'y', [[0, '#2a0008'], [.5, '#9a0c22'], [1, '#ff4a64']])}` +
      `${LG(u + 'sh', [[0, '#14000a', .85], [.7, '#14000a', .35], [1, '#14000a', 0]])}` +
      `<clipPath id="${u}hd"><path d="${head}"/></clipPath></defs>`;
    if (c.style === 'twin') s += P(TAIL, H) + P(TAIL, H, 'transform="translate(400,0) scale(-1,1)"');
    s += P(BACK[c.style], H);
    if (c.style === 'long') s += `<path d="M140,260 Q130,420 120,600 M170,280 Q165,450 160,620 M240,280 Q236,450 242,620 M262,260 Q272,420 282,600" stroke="${hairDk}" stroke-width="3" fill="none" opacity=".5"/>`;
    s += body(c);
    s += P('M184,226 L184,284 Q200,294 216,284 L216,226Z', c.skin) + P('M184,236 Q200,266 216,236 L216,258 Q200,276 184,258Z', shade(c.skin, -.14));
    const ex1 = c.fem ? 135 : 132, ex2 = c.fem ? 265 : 268;
    s += El(ex1, 182, 9, 15, shade(c.skin, -.06)) + El(ex2, 182, 9, 15, shade(c.skin, -.06));
    s += P(head, c.skin);
    s += P('M130,140 Q200,162 270,140 L270,132 L130,132Z', shade(c.skin, -.1), `opacity=".6" clip-path="url(#${u}hd)"`);
    if (c.fem) s += El(160, 208, 14, 6, '#ff8fa0', 'opacity=".22"') + El(240, 208, 14, 6, '#ff8fa0', 'opacity=".22"');
    if (e.sh) s += R(120, 70, 160, 155, `url(#${u}sh)`, `clip-path="url(#${u}hd)"`);
    if (e.bl) s += El(160, 208, 17, 8, '#ff6a86', 'opacity=".55"') + El(240, 208, 17, 8, '#ff6a86', 'opacity=".55"') +
      `<path d="M150,208 l6,-7 M159,210 l6,-7 M168,210 l6,-7 M230,210 l6,-7 M239,210 l6,-7 M248,208 l6,-7" stroke="#e04060" stroke-width="1.6" opacity=".6"/>`;
    s += eyeG(c, u, 0, e.e) + eyeG(c, u, 1, e.e);
    s += `<path d="M201,198 L198,207 L203,207" stroke="${shade(c.skin, -.25)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    s += mouth(e.m, c);
    SIDE[c.style].forEach(d => { s += P(d, H) + P(d, H, 'transform="translate(400,0) scale(-1,1)"'); });
    s += P(FRONT[c.style], H);
    if (c.style === 'messy') s += P('M198,52 Q212,16 238,26 Q216,30 206,54Z', H);
    s += `<path d="M146,98 Q200,82 254,98" stroke="${c.hl}" stroke-width="5" fill="none" opacity=".28" stroke-dasharray="18 9" stroke-linecap="round"/>`;
    const bw = c.fem ? 3.2 : 4.6, bc = shade(c.hair, -.25);
    [0, 1].forEach(sd => {
      s += `<path d="${BROW[e.b]}" transform="translate(${sd ? 233 : 167},172) scale(${sd ? -1 : 1},1)" stroke="${bc}" stroke-width="${bw}" fill="none" stroke-linecap="round" opacity=".92"/>`;
    });
    s += acc(c);
    if (e.sh) s += `<g stroke="#1a0010" stroke-width="2" opacity=".32"><path d="M162,100 L162,146 M177,94 L177,150 M192,92 L192,152 M207,92 L207,152 M222,94 L222,150 M237,100 L237,146"/></g>`;
    if (e.tear) s += P('M156,190 Q151,216 158,244 Q163,216 161,190Z', '#9fd8ff', 'opacity=".85"') + P('M244,190 Q249,216 242,244 Q237,216 239,190Z', '#9fd8ff', 'opacity=".85"');
    if (e.sw) s += P('M264,126 Q253,146 264,153 Q275,146 264,126Z', '#c4e8ff', 'stroke="#7ab8e0" stroke-width="1.5"');
    if (extra === 'band') {
      s += `<g transform="rotate(-15 232 124)">${R(214, 117, 36, 14, '#f2d9bc', 'rx="5"')}<path d="M226,118 L226,130 M238,118 L238,130" stroke="#d8b894" stroke-width="1.5"/></g>`;
      s += `<g transform="rotate(10 242 205)">${R(229, 200, 27, 10, '#f2d9bc', 'rx="4"')}</g>`;
    }
    const vb = crop ? '100 34 200 250' : '0 0 400 700';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMax meet">${s}</svg>`;
  }

  // ================= ФОНЫ =================
  function cloud(x, y, r, op = .85) {
    return El(x, y, r, r * .36, '#fff', `opacity="${op}"`) + El(x + r * .35, y - r * .18, r * .55, r * .32, '#fff', `opacity="${op}"`) +
      El(x - r * .4, y - r * .08, r * .45, r * .26, '#fff', `opacity="${op}"`);
  }
  function tree(x, y, s, cols, rnd) {
    let o = R(x - 10 * s, y, 20 * s, 180 * s, '#5e4030');
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * 55 * s;
      o += C(x + Math.cos(a) * d, y + Math.sin(a) * d * .7 - 10 * s, (45 + rnd() * 30) * s, cols[i % cols.length]);
    }
    return o;
  }
  function stars(rnd, n, h = 600, op = 1) {
    let o = '';
    for (let i = 0; i < n; i++) o += C((rnd() * 1600).toFixed(0), (rnd() * h).toFixed(0), (rnd() * 1.8 + .4).toFixed(1), '#fff', `opacity="${(rnd() * .7 + .3) * op}"`);
    return o;
  }
  function polaroid(x, y, rot, who, rnd) {
    const hair = who === 'rei' ? '#1d1624' : '#5a3a24';
    let o = `<g transform="rotate(${rot} ${x + 35} ${y + 42})">` + R(x, y, 70, 84, '#f4efe4') + R(x + 6, y + 6, 58, 58, '#8a7a6c');
    o += C(x + 35, y + 30, 11, '#f2d6c4') + P(`M${x + 16},${y + 64} Q${x + 35},${y + 40} ${x + 54},${y + 64}Z`, '#2b3350');
    o += P(`M${x + 23},${y + 30} Q${x + 35},${y + 12} ${x + 47},${y + 30} L${x + 47},${who === 'rei' ? y + 58 : y + 26} L${x + 23},${who === 'rei' ? y + 58 : y + 26}Z`, hair);
    o += C(x + 35, y + 30, 9, '#f2d6c4');
    o += `</g>`;
    return o;
  }

  const BG = {
    black: () => R(0, 0, 1600, 900, '#000'),
    white: () => R(0, 0, 1600, 900, '#fff'),
    red: () => R(0, 0, 1600, 900, '#3a0008'),

    gate(u) {
      const rnd = rng(7);
      let s = `<defs>${LG(u + 's', [[0, '#7fb6e6'], [.7, '#cfe4f2'], [1, '#fbe3cc']])}</defs>`;
      s += R(0, 0, 1600, 900, `url(#${u}s)`);
      s += cloud(250, 130, 130) + cloud(1280, 90, 170) + cloud(820, 190, 90, .7);
      s += P('M0,560 Q300,470 600,520 Q1000,450 1600,530 L1600,620 L0,620Z', '#9fbf9a', 'opacity=".6"');
      s += R(260, 250, 1080, 360, '#efe5d8') + R(250, 232, 1100, 26, '#b6a492');
      s += R(730, 120, 140, 140, '#e8dccd') + R(720, 108, 160, 18, '#b6a492');
      s += C(800, 188, 40, '#fff', 'stroke="#8a7a6a" stroke-width="6"') + `<path d="M800,188 L800,162 M800,188 L818,196" stroke="#4a3a2a" stroke-width="4" stroke-linecap="round"/>`;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) {
        const x = 296 + c * 86, y = 278 + r * 106;
        s += R(x, y, 58, 70, '#a9cde8', 'stroke="#d4c6b6" stroke-width="4"') + `<path d="M${x + 8},${y + 60} L${x + 30},${y + 10}" stroke="#fff" stroke-width="4" opacity=".4"/>`;
      }
      s += R(0, 560, 1600, 70, '#d6ccbf') + R(0, 550, 1600, 14, '#bdb0a2');
      const autumn = ['#d9582a', '#ee9a2e', '#c23a26', '#f2b83a', '#b8442a'];
      s += tree(120, 380, 1.5, autumn, rnd) + tree(330, 430, 1.1, autumn, rnd) + tree(1300, 420, 1.2, autumn, rnd) + tree(1500, 370, 1.6, autumn, rnd);
      s += R(0, 620, 1600, 280, '#c8b796') + `<polygon points="560,620 1040,620 1500,900 100,900" fill="#ddd0b8"/>`;
      s += R(490, 390, 100, 22, '#a89a8a') + R(500, 410, 80, 320, '#bcae9e') + R(1010, 390, 100, 22, '#a89a8a') + R(1020, 410, 80, 320, '#bcae9e');
      s += R(512, 450, 56, 150, '#f4efe6', 'stroke="#8a7a6a" stroke-width="3"');
      for (let i = 0; i < 70; i++) s += El((rnd() * 1600).toFixed(0), (640 + rnd() * 260).toFixed(0), 8, 4, autumn[i % 5], 'opacity=".9"');
      return s;
    },

    classroom(u) {
      let s = `<defs>${LG(u + 'w', [[0, '#8fc3ea'], [1, '#e9f3f8']])}</defs>`;
      s += R(0, 0, 1600, 900, '#efe5d3') + R(0, 0, 1600, 60, '#e2d6c2');
      for (let i = 0; i < 4; i++) s += R(150 + i * 380, 20, 200, 16, '#fffbea', 'opacity=".9"');
      s += R(40, 110, 580, 440, '#d4c6b0');
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += R(58 + i * 280, 128 + j * 206, 264, 194, `url(#${u}w)`);
      s += C(150, 520, 90, '#e88a3a') + C(260, 540, 80, '#d8602a') + C(480, 530, 100, '#f0b040');
      s += R(40, 110, 580, 440, 'none', 'stroke="#c8b8a0" stroke-width="18"') + R(322, 110, 16, 440, '#c8b8a0') + R(40, 322, 580, 12, '#c8b8a0');
      s += P('M20,90 Q60,300 30,580 L90,580 Q70,300 100,90Z', '#f4ecd8') + P('M640,90 Q600,300 630,580 L570,580 Q590,300 560,90Z', '#f4ecd8');
      s += R(750, 140, 780, 340, '#2f4a3a', 'stroke="#7a5a3a" stroke-width="16"') + R(760, 470, 760, 12, '#8a6a4a');
      s += `<text x="820" y="250" fill="#f4f4ea" font-size="48" font-family="Neucha, 'Comic Sans MS', cursive" opacity=".88">Фестиваль Фонарей — пятница!</text>`;
      s += `<text x="830" y="320" fill="#f4f4ea" font-size="30" font-family="Neucha, 'Comic Sans MS', cursive" opacity=".6">дежурные: Танака, Ито</text>`;
      s += `<text x="1180" y="420" fill="#ffd0e0" font-size="30" font-family="Neucha, 'Comic Sans MS', cursive" opacity=".7">♡ не опаздывать ♡</text>`;
      s += R(0, 600, 1600, 300, '#b98d5e');
      for (let i = 0; i < 8; i++) s += `<path d="M0,${620 + i * 38} L1600,${620 + i * 38}" stroke="#a87e52" stroke-width="2"/>`;
      for (let r = 0; r < 3; r++) {
        const sc = .7 + r * .28, y = 560 + r * 105;
        for (let c = -3; c <= 3; c++) {
          const x = 800 + c * 250 * sc, w = 180 * sc;
          s += R(x - w / 2, y + 30 * sc, 10 * sc, 80 * sc, '#6a6a70') + R(x + w / 2 - 10 * sc, y + 30 * sc, 10 * sc, 80 * sc, '#6a6a70');
          s += R(x - w / 2, y, w, 22 * sc, '#d9b27c') + R(x - w / 2 + 6, y + 22 * sc, w - 12, 40 * sc, '#b08a5a');
        }
      }
      return s;
    },

    hallway(u) {
      let s = `<defs>${LG(u + 'w', [[0, '#93c4ea'], [1, '#eef5fa']])}${LG(u + 'f', [[0, '#d8ccb4'], [1, '#b8a88e']])}</defs>`;
      s += `<polygon points="0,0 1600,0 960,330 640,330" fill="#e6dece"/>`;
      s += `<polygon points="0,900 1600,900 960,520 640,520" fill="url(#${u}f)"/>`;
      s += `<polygon points="0,0 640,330 640,520 0,900" fill="#efe7da"/>`;
      s += `<polygon points="1600,0 960,330 960,520 1600,900" fill="#e8dfd0"/>`;
      s += `<polygon points="40,110 300,228 300,560 40,690" fill="url(#${u}w)" stroke="#cfc2ae" stroke-width="10"/>`;
      s += `<polygon points="360,255 480,292 480,522 360,562" fill="url(#${u}w)" stroke="#cfc2ae" stroke-width="7"/>`;
      s += `<polygon points="530,305 590,322 590,492 530,508" fill="url(#${u}w)" stroke="#cfc2ae" stroke-width="5"/>`;
      s += R(640, 330, 320, 190, '#ddd3c2') + R(730, 360, 140, 100, `url(#${u}w)`, 'stroke="#cfc2ae" stroke-width="5"');
      s += `<polygon points="1280,170 1520,80 1520,790 1280,700" fill="#b48a62"/><polygon points="1300,190 1500,112 1500,330 1300,380" fill="#c8e0f0" opacity=".6"/>`;
      s += `<polygon points="1060,280 1170,238 1170,610 1060,570" fill="#b48a62"/><polygon points="1072,296 1158,262 1158,370 1072,396" fill="#c8e0f0" opacity=".6"/>`;
      s += R(1120, 50, 120, 40, '#3a5a8a', 'transform="skewY(-20)"');
      s += `<polygon points="120,900 360,760 520,760 380,900" fill="#fff" opacity=".22"/><polygon points="460,720 560,640 620,640 560,720" fill="#fff" opacity=".18"/>`;
      for (let i = 0; i < 4; i++) { const t = i / 4, y = 15 + t * 280, w = 300 * (1 - t * .85); s += R(800 - w / 2, y, w, 10 * (1 - t * .7), '#fffbea', 'opacity=".85"'); }
      return s;
    },

    rooftop(u) {
      const rnd = rng(11);
      let s = `<defs>${LG(u + 's', [[0, '#5d9fe0'], [.6, '#b8d8f0'], [1, '#f8dcb4']])}<pattern id="${u}m" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0,0 L26,26 M26,0 L0,26" stroke="#5f8f70" stroke-width="2" opacity=".55"/></pattern></defs>`;
      s += R(0, 0, 1600, 900, `url(#${u}s)`) + cloud(300, 150, 180) + cloud(1200, 220, 140) + cloud(800, 90, 100, .6);
      for (let i = 0; i < 40; i++) { const w = 30 + rnd() * 60, h = 40 + rnd() * 140; s += R(i * 42 - 20, 600 - h, w, h + 50, rnd() > .5 ? '#a4b4c8' : '#94a6bc'); }
      s += R(0, 640, 1600, 260, '#b8b4ac');
      for (let i = 0; i < 10; i++) s += `<path d="M0,${660 + i * 26} L1600,${660 + i * 26}" stroke="#a8a49c" stroke-width="2"/>`;
      s += R(0, 395, 1600, 250, `url(#${u}m)`) + R(0, 385, 1600, 12, '#5a8a6a');
      for (let x = 0; x < 1600; x += 130) s += R(x, 385, 9, 260, '#4f7f60');
      s += R(1240, 300, 230, 220, '#d8d4cc') + El(1355, 300, 115, 26, '#e8e4dc') + R(1260, 520, 16, 130, '#8a8680') + R(1434, 520, 16, 130, '#8a8680');
      s += R(-10, 240, 230, 420, '#cfc8bc') + R(50, 380, 110, 270, '#8a8478') + C(140, 520, 6, '#ddd');
      s += R(300, 690, 380, 24, '#8a6a4a') + R(300, 640, 380, 18, '#9a7a5a') + R(320, 714, 14, 60, '#555') + R(646, 714, 14, 60, '#555');
      return s;
    },

    library(u) {
      const rnd = rng(23);
      const bc = ['#8a2a2a', '#2a4a6a', '#3a6a4a', '#c8a050', '#6a3a6a', '#d8d0c0', '#2a2a3a', '#a85a2a', '#4a5a8a'];
      let s = `<defs>${RG(u + 'g', [[0, '#ffd890', .5], [1, '#ffd890', 0]])}</defs>`;
      s += R(0, 0, 1600, 900, '#4e3628');
      for (let col = 0; col < 6; col++) {
        const x = 30 + col * 262;
        s += R(x - 8, 40, 246, 680, '#3a271c');
        for (let y = 60; y < 680; y += 110) {
          let bx = x;
          while (bx < x + 220) {
            const w = 12 + rnd() * 16, h = 64 + rnd() * 26;
            if (bx + w > x + 226) break;
            s += R(bx.toFixed(0), (y + 90 - h).toFixed(0), w.toFixed(0), h.toFixed(0), bc[Math.floor(rnd() * bc.length)]);
            if (rnd() > .6) s += R(bx.toFixed(0), (y + 90 - h + 10).toFixed(0), w.toFixed(0), 4, '#e8d8a0', 'opacity=".6"');
            bx += w + 1.5;
          }
          s += R(x - 8, y + 90, 246, 12, '#2a1a12');
        }
      }
      s += C(800, 300, 600, `url(#${u}g)`);
      s += R(0, 730, 1600, 170, '#3a281e') + R(160, 700, 1280, 34, '#7a5236') + R(200, 734, 20, 166, '#5a3a26') + R(1380, 734, 20, 166, '#5a3a26');
      s += R(980, 640, 14, 60, '#c8a050') + P('M940,640 Q987,590 1034,640Z', '#2a6a4a') + C(987, 650, 120, `url(#${u}g)`);
      s += R(420, 680, 160, 20, '#e8e0cc') + R(436, 672, 130, 10, '#8a2a2a');
      return s;
    },

    club(u) {
      const rnd = rng(5);
      let s = `<defs>${LG(u + 'w', [[0, '#141a44'], [.6, '#5a3a6a'], [1, '#f08a5a']])}</defs>`;
      s += R(0, 0, 1600, 900, '#2c2a44') + R(980, 90, 520, 400, `url(#${u}w)`, 'stroke="#4a4660" stroke-width="16"');
      for (let i = 0; i < 30; i++) s += C(990 + rnd() * 500, 100 + rnd() * 200, rnd() * 1.6 + .5, '#fff', `opacity="${rnd()}"`);
      s += R(110, 110, 320, 230, '#121638', 'stroke="#c8b070" stroke-width="6"');
      const cass = [[150, 200], [210, 160], [270, 220], [330, 170], [390, 230]];
      s += `<polyline points="${cass.map(p => p.join(',')).join(' ')}" stroke="#9ab8ff" stroke-width="2" fill="none" opacity=".7"/>` + cass.map(p => C(p[0], p[1], 5, '#fff')).join('');
      s += `<text x="270" y="310" fill="#c8b070" font-size="20" text-anchor="middle" font-family="Neucha, cursive">Кассиопея</text>`;
      s += R(480, 150, 230, 300, '#121638', 'stroke="#c8b070" stroke-width="6"');
      for (let i = 0; i < 4; i++) s += C(540 + (i % 2) * 110, 220 + Math.floor(i / 2) * 120, 36, '#e8e4c8') + C(552 + (i % 2) * 110 - i * 9, 220 + Math.floor(i / 2) * 120, 32, '#121638');
      s += R(760, 200, 160, 120, '#f4f0e0', 'transform="rotate(4 840 260)"') + `<text x="840" y="270" font-size="22" text-anchor="middle" fill="#3a3a5a" font-family="Neucha, cursive" transform="rotate(4 840 260)">Набор в клуб!</text>`;
      s += R(0, 700, 1600, 200, '#3a3048');
      s += `<g transform="rotate(-28 1150 560)">${R(980, 540, 320, 50, '#d8d8e2', 'rx="10"')}${R(1290, 534, 30, 62, '#9898a8', 'rx="6"')}${R(1060, 530, 40, 70, '#2a2a3a')}</g>`;
      s += `<path d="M1150,580 L1060,860 M1150,580 L1250,860 M1150,580 L1160,880" stroke="#5a5a6a" stroke-width="10"/>`;
      s += R(220, 640, 720, 26, '#6a4a3a') + R(250, 666, 18, 200, '#4a3428') + R(890, 666, 18, 200, '#4a3428');
      s += R(400, 600, 300, 44, '#1c2a5a', 'transform="rotate(-3 550 620)"');
      for (let i = 0; i < 18; i++) s += C(410 + rnd() * 280, 605 + rnd() * 34, 1.8, '#fff');
      return s;
    },

    infirmary() {
      let s = R(0, 0, 1600, 900, '#eef4f3') + R(0, 650, 1600, 250, '#cfe0dd');
      for (let x = 0; x < 1600; x += 80) s += `<path d="M${x},650 L${x - 120},900" stroke="#bfd2ce" stroke-width="2"/>`;
      s += R(560, 100, 400, 300, '#bfe0f4', 'stroke="#d8e2e0" stroke-width="14"') + R(752, 100, 14, 300, '#d8e2e0');
      s += R(0, 60, 1600, 10, '#a8b8b8');
      s += P('M1050,70 Q1080,300 1040,700 L1200,700 Q1170,400 1210,70Z', '#cde8e4') + P('M1210,70 Q1250,350 1220,700 L1380,700 Q1350,300 1390,70Z', '#c4e0dc');
      s += R(620, 560, 420, 90, '#fff', 'rx="8"') + R(610, 640, 440, 20, '#9aaab0') + El(700, 560, 70, 24, '#fff', 'stroke="#dde" stroke-width="2"');
      s += R(620, 520, 420, 50, '#dcecf0', 'rx="10"');
      s += R(140, 280, 260, 400, '#e0e8ea', 'stroke="#c4cfd2" stroke-width="4"') + R(255, 380, 40, 120, '#d03040') + R(215, 420, 120, 40, '#d03040');
      return s;
    },

    cafeteria(u) {
      let s = `<defs>${LG(u + 'w', [[0, '#9cccee'], [1, '#f2f6f8']])}</defs>`;
      s += R(0, 0, 1600, 900, '#f2e2c6');
      for (let i = 0; i < 5; i++) s += R(720 + i * 175, 80, 150, 220, `url(#${u}w)`, 'stroke="#d8c4a4" stroke-width="8"');
      s += R(90, 120, 440, 230, '#3a3a38', 'stroke="#8a6a4a" stroke-width="10"');
      const menu = ['МЕНЮ ДНЯ', 'Карри с рисом ..... 350', 'Удон ................... 300', 'Дынный хлеб ....... 120', '★ хит продаж! ★'];
      menu.forEach((t, i) => { s += `<text x="${i ? 120 : 310}" y="${175 + i * 40}" fill="${i === 3 ? '#ffe080' : '#f4f4ea'}" font-size="${i ? 26 : 32}" ${i ? '' : 'text-anchor="middle"'} font-family="Neucha, cursive">${t}</text>`; });
      s += R(0, 420, 680, 210, '#c8a882') + R(0, 410, 690, 20, '#a88862');
      for (let i = 0; i < 5; i++) s += El(80 + i * 120, 400, 40, 14, '#f0e0c0') + El(80 + i * 120, 392, 26, 10, '#d8a050');
      s += R(0, 630, 1600, 270, '#d8c8a8');
      s += R(760, 600, 760, 30, '#d8b888') + R(780, 630, 18, 120, '#8a7050') + R(1480, 630, 18, 120, '#8a7050');
      for (let i = 0; i < 6; i++) s += El(820 + i * 128, 790, 34, 12, '#c0503a') + R(814 + i * 128, 790, 12, 80, '#6a6a6a');
      s += R(640, 760, 520, 34, '#d0b080');
      return s;
    },

    lockers() {
      let s = R(0, 0, 1600, 900, '#e6dccb') + R(0, 720, 1600, 180, '#bfae94');
      for (let b = 0; b < 3; b++) {
        const x0 = 60 + b * 520;
        s += R(x0 - 10, 90, 470, 640, '#8a96a4');
        for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
          const x = x0 + c * 90, y = 100 + r * 104;
          s += R(x, y, 82, 96, '#aab6c2', 'stroke="#7a8694" stroke-width="3"') + R(x + 60, y + 40, 12, 18, '#5a6674', 'rx="3"');
          s += R(x + 10, y + 10, 40, 12, '#f4f4f0', 'opacity=".8"');
        }
      }
      s += `<polygon points="1600,0 1600,900 1480,900 1540,0" fill="#fff" opacity=".25"/>`;
      return s;
    },

    council(u) {
      let s = `<defs>${LG(u + 'w', [[0, '#3a3a6a'], [1, '#f0905a']])}</defs>`;
      s += R(0, 0, 1600, 900, '#d4ccbf') + R(500, 80, 600, 380, `url(#${u}w)`, 'stroke="#8a7a6a" stroke-width="16"') + R(792, 80, 16, 380, '#8a7a6a');
      s += R(100, 120, 300, 70, '#7a1d2c') + `<text x="250" y="168" fill="#fff" font-size="30" text-anchor="middle" font-family="Comfortaa, sans-serif">Студсовет</text>`;
      s += R(1200, 140, 300, 480, '#8a6a4a') + R(1215, 160, 270, 440, '#5a4030');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 10; j++) s += R(1225 + j * 26, 175 + i * 108, 22, 88, ['#e8e0cc', '#c8c0aa', '#a8a090'][(i + j) % 3]);
      s += R(0, 660, 1600, 240, '#8a7258') + R(180, 600, 1240, 44, '#5a3e2e') + R(220, 644, 24, 200, '#3e2a1e') + R(1356, 644, 24, 200, '#3e2a1e');
      s += R(500, 576, 160, 26, '#f4f0e6') + R(520, 566, 160, 12, '#e8e0cc') + R(880, 580, 120, 22, '#f4f0e6');
      return s;
    },

    street(u) {
      const rnd = rng(31);
      let s = `<defs>${LG(u + 's', [[0, '#2c2c5e'], [.5, '#e0806a'], [1, '#ffd2a0']])}</defs>`;
      s += R(0, 0, 1600, 900, `url(#${u}s)`) + C(1180, 560, 100, '#ffcf88', 'opacity=".9"');
      for (let i = 0; i < 9; i++) {
        const x = i * 190 - 40, h = 200 + rnd() * 160, y = 700 - h;
        s += R(x, y, 170, h, '#4a3a4e') + `<polygon points="${x - 14},${y} ${x + 85},${y - 70} ${x + 184},${y}" fill="#3a2a3e"/>`;
        for (let k = 0; k < 3; k++) if (rnd() > .35) s += R(x + 20 + k * 50, y + 40 + rnd() * 60, 30, 34, '#ffd27a', 'opacity=".85"');
      }
      s += R(0, 700, 1600, 200, '#4a3e52') + R(0, 700, 1600, 14, '#6a5a6e');
      for (let x = 0; x < 1600; x += 160) s += R(x, 790, 80, 8, '#d8c8a0', 'opacity=".6"');
      [200, 820, 1420].forEach(x => { s += R(x, 160, 14, 560, '#2a2030') + R(x - 40, 190, 94, 8, '#2a2030'); });
      s += `<path d="M0,210 Q100,250 207,195 Q510,260 827,195 Q1120,250 1427,195 Q1520,230 1600,205" stroke="#2a2030" stroke-width="2.5" fill="none"/>`;
      return s;
    },

    festival(u) {
      const rnd = rng(17);
      let s = `<defs>${LG(u + 's', [[0, '#080822'], [1, '#3a1c46']])}${RG(u + 'g', [[0, '#ffb060', .9], [.4, '#ff7030', .4], [1, '#ff5020', 0]])}</defs>`;
      s += R(0, 0, 1600, 900, `url(#${u}s)`) + stars(rnd, 120, 400);
      s += R(200, 260, 1200, 360, '#1e1630') + R(190, 244, 1220, 22, '#2a2040');
      for (let i = 0; i < 12; i++) s += R(240 + i * 96, 300, 54, 66, '#ffcf7a', 'opacity=".55"');
      const strings = [[0, 170, 800, 290, 1600, 160], [0, 330, 800, 430, 1600, 320]];
      strings.forEach(([x0, y0, cx, cy, x1, y1]) => {
        s += `<path d="M${x0},${y0} Q${cx},${cy} ${x1},${y1}" stroke="#1a1010" stroke-width="3" fill="none"/>`;
        for (let i = 1; i < 16; i++) {
          const t = i / 16, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
          s += C(x, y + 26, 46, `url(#${u}g)`) + El(x, y + 26, 16, 21, i % 3 ? '#ff6a3a' : '#ffd060') + R(x - 9, y + 3, 18, 5, '#3a1a10');
        }
      });
      for (let i = 0; i < 4; i++) {
        const x = 60 + i * 400;
        s += R(x, 560, 300, 180, '#5a2a2a') + R(x + 10, 600, 280, 90, '#ffcf88', 'opacity=".7"');
        for (let k = 0; k < 6; k++) s += `<polygon points="${x + k * 50},540 ${x + k * 50 + 50},540 ${x + k * 50 + 50},580 ${x + k * 50},580" fill="${k % 2 ? '#fff' : '#d02a3a'}"/>`;
      }
      s += R(0, 740, 1600, 160, '#1c1424');
      for (let i = 0; i < 30; i++) { const x = rnd() * 1600, sc = .7 + rnd() * .6; s += C(x, 760 - 30 * sc, 18 * sc, '#120c18') + P(`M${x - 30 * sc},900 Q${x},${740 - 10 * sc} ${x + 30 * sc},900Z`, '#120c18'); }
      return s;
    },

    hill(u) {
      const rnd = rng(3);
      let s = `<defs>${LG(u + 's', [[0, '#04061a'], [.55, '#1a1844'], [1, '#43294f']])}${RG(u + 'g', [[0, '#ffb070', .95], [.35, '#ff6a30', .45], [1, '#ff4020', 0]])}</defs>`;
      s += R(0, 0, 1600, 900, `url(#${u}s)`) + stars(rnd, 220, 650) + C(260, 150, 46, '#f6f0d6') + C(278, 140, 42, '#0b0c26', 'opacity=".85"');
      for (let i = 0; i < 160; i++) s += C(rnd() * 1600, 640 + rnd() * 70, rnd() * 1.6 + .5, rnd() > .3 ? '#ffd27a' : '#ff9a6a', `opacity="${rnd() * .8 + .2}"`);
      s += P('M0,900 L0,690 Q600,560 1100,620 Q1400,650 1600,700 L1600,900Z', '#0e0d1c');
      s += P('M1040,640 Q1030,500 1010,380 L1050,380 Q1060,500 1090,640Z', '#0a0912');
      s += `<path d="M1030,420 Q900,330 760,320 M1040,400 Q1120,300 1300,280 M1020,460 Q920,440 860,470 M1050,350 Q1080,260 1040,200" stroke="#0a0912" stroke-width="18" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 40; i++) s += C(780 + rnd() * 560, 180 + rnd() * 200, 18 + rnd() * 24, rnd() > .5 ? '#3a0c1a' : '#4e1222', 'opacity=".9"');
      s += `<path d="M900,330 L900,410" stroke="#2a1a1a" stroke-width="2"/>` + C(900, 450, 160, `url(#${u}g)`) + El(900, 452, 34, 44, '#ff7a3a') +
        R(886, 404, 28, 8, '#2a1010') + R(886, 494, 28, 8, '#2a1010') + `<path d="M868,440 Q900,446 932,440 M866,462 Q900,468 934,462" stroke="#c84020" stroke-width="2" fill="none"/>`;
      return s;
    },

    bedroom(u, o = {}) {
      const sanity = o.sanity == null ? 70 : o.sanity, rnd = rng(41);
      let s = `<defs>${LG(u + 'n', [[0, '#0b1030'], [1, '#2e2a5e']])}${RG(u + 'l', [[0, '#ffd890', .55], [1, '#ffd890', 0]])}</defs>`;
      s += R(0, 0, 1600, 900, '#2e2a42');
      s += R(110, 110, 380, 330, `url(#${u}n)`, 'stroke="#4a3e58" stroke-width="16"') + stars(rnd, 0) + C(390, 200, 40, '#f4f0d8');
      for (let i = 0; i < 25; i++) s += C(125 + rnd() * 350, 125 + rnd() * 300, rnd() * 1.6 + .4, '#fff', `opacity="${rnd()}"`);
      s += R(292, 110, 12, 330, '#4a3e58');
      s += P('M70,90 Q110,280 80,480 L150,480 Q130,280 160,90Z', '#5a3a5c') + P('M530,90 Q490,280 520,480 L450,480 Q470,280 440,90Z', '#5a3a5c');
      s += R(860, 520, 560, 24, '#5a4030') + R(880, 544, 20, 220, '#4a3428') + R(1380, 544, 20, 220, '#4a3428');
      s += C(1300, 470, 200, `url(#${u}l)`) + P('M1270,520 L1290,440 L1260,400 L1320,380', 'none', 'stroke="#2a2a2a" stroke-width="8"') + P('M1290,370 L1360,350 L1350,410Z', '#3a3a3a');
      s += R(980, 494, 150, 28, '#9e2a3c', 'rx="3"') + R(986, 498, 138, 4, '#f4efe4');
      s += R(0, 640, 1600, 260, '#3a3048') + R(0, 650, 720, 250, '#5a4a7a', 'rx="20"') + El(150, 670, 110, 36, '#e8e0f0');
      if (sanity < 55) {
        const n = Math.min(30, Math.round((60 - sanity) / 1.6)), pts = [];
        for (let i = 0; i < n; i++) {
          const x = 600 + rnd() * 820, y = 60 + rnd() * 360;
          pts.push([x + 35, y + 40]);
          s += polaroid(x, y, (rnd() * 30 - 15).toFixed(0), 'sora', rnd);
        }
        if (sanity < 32) for (let i = 1; i < pts.length; i++) s += `<path d="M${pts[i - 1][0]},${pts[i - 1][1]} L${pts[i][0]},${pts[i][1]}" stroke="#c01030" stroke-width="2.5" opacity=".85"/>`;
        if (sanity < 16) for (let i = 0; i < 9; i++) s += `<text x="${560 + rnd() * 900}" y="${80 + rnd() * 500}" fill="#b0101e" opacity=".55" font-size="${30 + rnd() * 40}" font-family="'Marck Script', cursive" transform="rotate(${rnd() * 30 - 15})">мой</text>`;
      }
      return s;
    },

    shrine(u) {
      const rnd = rng(66);
      let s = `<defs>${RG(u + 'c', [[0, '#ffb0d0', .7], [1, '#ff60a0', 0]])}</defs>`;
      s += R(0, 0, 1600, 900, '#1a0d18');
      const pts = [];
      for (let i = 0; i < 70; i++) { const x = rnd() * 1530, y = rnd() * 560; pts.push([x + 35, y + 40]); s += polaroid(x, y, (rnd() * 40 - 20).toFixed(0), 'rei', rnd); }
      for (let i = 1; i < 30; i++) s += `<path d="M${pts[i - 1][0]},${pts[i - 1][1]} L${pts[i][0]},${pts[i][1]}" stroke="#ff4a9a" stroke-width="2" opacity=".7"/>`;
      for (let i = 0; i < 10; i++) s += `<text x="${rnd() * 1500}" y="${50 + rnd() * 600}" fill="#ff6aaa" opacity=".4" font-size="${36 + rnd() * 40}" font-family="'Marck Script', cursive">Рэй ♥</text>`;
      s += R(0, 640, 1600, 260, '#120810') + R(500, 610, 600, 40, '#2a1420');
      s += `<g transform="translate(720,330)">${R(0, 0, 160, 200, '#f4efe4')}${R(12, 12, 136, 140, '#8a7a6c')}${C(80, 70, 28, '#f2d6c4')}${P('M40,152 Q80,96 120,152Z', '#1c2140')}${P('M50,70 Q80,24 110,70 L112,150 L48,150Z', '#1d1624')}${C(80, 74, 24, '#f2d6c4')}</g>`;
      s += `<path d="M800,300 C700,220 640,330 800,560 C960,330 900,220 800,300Z" fill="none" stroke="#ff4a9a" stroke-width="6" opacity=".8"/>`;
      for (let i = 0; i < 7; i++) { const x = 540 + i * 85; s += C(x, 590, 60, `url(#${u}c)`) + R(x - 8, 595, 16, 40, '#f8d8e8') + El(x, 588, 5, 10, '#ffd080'); }
      return s;
    },

    basement(u) {
      let s = `<defs>${RG(u + 'b', [[0, '#ffe8a0', .5], [1, '#ffe8a0', 0]])}</defs>`;
      s += R(0, 0, 1600, 900, '#141116');
      for (let y = 0; y < 640; y += 50) for (let x = (y / 50) % 2 ? -50 : 0; x < 1600; x += 100) s += R(x, y, 96, 46, '#1c181e', 'stroke="#0e0c10" stroke-width="3"');
      s += R(0, 640, 1600, 260, '#100e12') + `<polygon points="770,140 830,140 1100,900 500,900" fill="#ffe8a0" opacity=".08"/>`;
      s += `<path d="M800,0 L800,110" stroke="#333" stroke-width="3"/>` + C(800, 128, 300, `url(#${u}b)`) + C(800, 128, 18, '#fff4c8');
      s += R(730, 520, 140, 16, '#3a2a22') + R(740, 400, 14, 130, '#3a2a22') + R(846, 400, 14, 130, '#3a2a22') + R(740, 400, 120, 14, '#3a2a22') + R(740, 536, 14, 120, '#3a2a22') + R(846, 536, 14, 120, '#3a2a22');
      s += `<path d="M750,560 Q800,600 850,560 M760,470 Q820,520 845,450" stroke="#c01030" stroke-width="3" fill="none"/>`;
      return s;
    },
  };

  function bg(name, opts) {
    const f = BG[name] || BG.black, u = 'g' + (++U);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">${f(u, opts || {})}</svg>`;
  }

  return { CH, char, bg, shade };
})();
