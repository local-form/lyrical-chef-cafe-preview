/* Lyrical Chef Cafe' preview. No tracking, no storage of form data, nothing sent. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lines = [...document.querySelectorAll('#lyrics .line')];
  const soundBtn = document.getElementById('sound');
  const BEAT = 0.6; // 100 bpm
  let ctx = null, soundOn = false, timers = [];

  /* --- tiny drum machine, made in code (off by default) --- */
  function audio() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function kick(t) { const a = audio(), o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .16); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .32); o.connect(g).connect(a.destination); o.start(t); o.stop(t + .34); }
  let noiseBuf = null;
  function noise() { const a = audio(); if (noiseBuf) return noiseBuf; noiseBuf = a.createBuffer(1, a.sampleRate * .3, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return noiseBuf; }
  function snare(t, v = .5) { const a = audio(), s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = noise(); f.type = 'highpass'; f.frequency.value = 1400; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + .2); }
  function hat(t) { const a = audio(), s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = noise(); f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + .06); }
  const NOTES = [220, 261.6, 293.7, 329.6, 196];
  function stab(t, n) { const a = audio(), g = a.createGain(), f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + .35); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .42); f.connect(g).connect(a.destination); [1, 1.5, 2.005].forEach(m => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTES[n % NOTES.length] * m; o.connect(f); o.start(t); o.stop(t + .45); }); }
  function beat(bars) { const a = audio(), t0 = a.currentTime + .05; for (let b = 0; b < bars * 4; b++) { const t = t0 + b * BEAT; (b % 2 === 0 ? kick : snare)(t); hat(t); hat(t + BEAT / 2); } return t0; }

  /* --- the lyric sheet: each line lands on the beat --- */
  function hitLine(li, i, withSound) {
    li.classList.add('on'); li.classList.remove('hit'); void li.offsetWidth; li.classList.add('hit');
    if (withSound && soundOn) stab(audio().currentTime + .01, i);
  }
  function play(withSound) {
    timers.forEach(clearTimeout); timers = [];
    if (reduce) { lines.forEach(l => l.classList.add('on')); return; }
    lines.forEach(l => l.classList.remove('on', 'hit'));
    const lead = withSound ? BEAT : .3;
    if (withSound) { const t0 = beat(4); lines.forEach((l, i) => stab(t0 + (i + 1) * BEAT, i)); }
    lines.forEach((l, i) => timers.push(setTimeout(() => hitLine(l, i, false), (lead + i * BEAT) * 1000)));
  }
  lines.forEach((l, i) => l.querySelector('.line-hit').addEventListener('click', () => hitLine(l, i, true)));
  if (soundBtn) soundBtn.addEventListener('click', () => {
    soundOn = !soundOn; soundBtn.setAttribute('aria-pressed', soundOn); soundBtn.querySelector('b').textContent = soundOn ? 'on' : 'off';
    if (soundOn) play(true); else if (ctx) ctx.suspend();
  });
  if (lines.length) play(false);
})();

/* --- party planner --- */
(() => {
  const $ = id => document.getElementById(id);
  const FL = [
    { word: "Bangin'", name: 'Original', price: 6.5 },
    { word: 'BOOMIN', name: 'Biscoff', price: 8.5 },
    { word: "Bussin'", name: 'Strawberry', price: 7.5 }];
  const PAN = 12; // servings per half pan: our estimate, labelled on the page
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const nice = d => `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`;
  const tomorrow = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 1); return d; };
  const money = n => '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
  const min = iso(tomorrow());
  document.querySelectorAll('input[type=date]').forEach(i => i.min = min);

  const range = $('guests-range'), num = $('guests');
  if (!range) return;
  const st = { guests: 24, fmt: 'cups', mix: [1, 1, 0], day: null };

  // pickup chips: the next 6 open days (no Mondays)
  const days = $('days'); const d = tomorrow(); const chips = [];
  while (chips.length < 6) { if (d.getDay() !== 1) chips.push(new Date(d)); d.setDate(d.getDate() + 1); }
  chips.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.dataset.day = iso(c); b.setAttribute('aria-pressed', 'false');
    const w = document.createElement('span'); w.textContent = DOW[c.getDay()]; const s = document.createElement('small'); s.textContent = `${MON[c.getMonth()]} ${c.getDate()}`; b.append(w, s); days.append(b); });
  const pickup = $('pickup'), dayNote = $('day-note');
  function setDay(v, fromInput) {
    let note = 'Closed Mondays, so Mondays are skipped.';
    if (v) { const x = parse(v); if (x.getDay() === 1) { x.setDate(x.getDate() + 1); v = iso(x); note = 'They’re closed Mondays, so we moved it to Tuesday.'; } }
    st.day = v || null; dayNote.textContent = note;
    days.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.day === st.day)));
    if (!fromInput || pickup.value !== v) pickup.value = v || '';
    render();
  }
  days.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setDay(b.dataset.day); });
  pickup.addEventListener('change', () => setDay(pickup.value, true));

  // guests
  const clamp = v => Math.max(1, Math.min(500, Math.round(+v || 0)));
  range.addEventListener('input', () => { st.guests = +range.value; num.value = range.value; render(true); });
  num.addEventListener('input', () => { if (num.value === '') return; st.guests = clamp(num.value); range.value = Math.min(200, st.guests); render(true); });
  num.addEventListener('blur', () => { num.value = st.guests; });
  document.querySelectorAll('input[name=fmt]').forEach(r => r.addEventListener('change', () => { st.fmt = r.value; render(true); }));

  // mix
  const presets = [...document.querySelectorAll('.presets button')];
  presets.forEach(b => b.addEventListener('click', () => { st.mix = b.dataset.mix.split(',').map(Number); render(true); }));
  document.querySelectorAll('.mix-row').forEach(row => row.addEventListener('click', e => {
    const b = e.target.closest('.step'); if (!b) return; const f = +row.dataset.f;
    const next = Math.max(0, Math.min(9, st.mix[f] + +b.dataset.d));
    if (next === 0 && st.mix.filter((m, i) => i !== f).every(m => m === 0)) return; // keep at least one flavor
    st.mix[f] = next; render(true);
  }));

  function share(total, w) { // largest remainder
    const sum = w.reduce((a, b) => a + b, 0); const raw = w.map(x => total * x / sum); const out = raw.map(Math.floor);
    let left = total - out.reduce((a, b) => a + b, 0);
    raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0 && w[i] > 0) { out[i]++; left--; } });
    return out;
  }
  let plan = null; const count = $('count');
  function render(bump) {
    const cups = st.fmt === 'cups'; const total = cups ? st.guests : Math.ceil(st.guests / PAN);
    const parts = share(total, st.mix);
    document.querySelectorAll('.mix-row output').forEach((o, i) => o.textContent = st.mix[i]);
    presets.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mix === st.mix.join(','))));
    count.textContent = total; $('unit').textContent = cups ? (total === 1 ? 'cup' : 'cups') : (total === 1 ? 'half pan' : 'half pans');
    document.querySelector('.out-eyebrow').textContent = `${st.guests} guest${st.guests === 1 ? '' : 's'}, in ${cups ? 'cups' : 'half pans'}`;
    if (bump && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const bc = count.parentElement; bc.classList.remove('bump'); void bc.offsetWidth; bc.classList.add('bump'); }
    const ul = $('split'); ul.textContent = '';
    const bits = [];
    FL.forEach((f, i) => { if (!parts[i]) return; const li = document.createElement('li'); const l = document.createElement('span'); const b = document.createElement('b'); b.textContent = f.word + ' '; l.append(b, f.name);
      const r = document.createElement('span'); r.textContent = cups ? `${parts[i]} × from ${money(f.price)}` : `${parts[i]} half pan${parts[i] === 1 ? '' : 's'}`; li.append(l, r); ul.append(li);
      bits.push(`${parts[i]} ${f.word} ${f.name}`); });
    $('price').textContent = cups
      ? `At Toast single-cup prices that starts from ${money(FL.reduce((a, f, i) => a + f.price * parts[i], 0))}. Party pricing is up to the cafe.`
      : `About ${PAN} servings per half pan (our estimate, the cafe confirms). Pan prices come from the cafe.`;
    const when = st.day ? `pickup ${nice(parse(st.day))}` : 'pickup day not picked yet';
    const text = `${st.guests} guests: ${bits.join(' + ')} ${cups ? 'cups' : (total === 1 ? 'half pan' : 'half pans')}, ${when}.`;
    $('summary').textContent = text;
    const live = $('live'); if (live) { live.textContent = ''; const lb = document.createElement('b'); lb.textContent = total; live.append(lb, ` ${$('unit').textContent} · ${parts.filter(Boolean).length} flavor${parts.filter(Boolean).length === 1 ? '' : 's'}`); }
    plan = { text, cups, date: st.day };
  }
  $('to-order').addEventListener('click', () => {
    if (!plan) return;
    $('order-text').value = plan.text; $('order-guests').value = st.guests;
    $('order-type').value = plan.cups ? 'Custom pudding cups' : 'Half pans of banana pudding';
    if (plan.date) $('order-date').value = plan.date;
    setTimeout(() => document.querySelector('#order-form [name=name]').focus({ preventScroll: true }), 700);
  });
  render();
})();

/* --- request forms (preview only: nothing is sent or stored) --- */
(() => {
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  function wire(id, build) {
    const f = document.getElementById(id); if (!f) return; const out = f.querySelector('.confirm');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const name = f.elements.name, phone = f.elements.phone, date = f.elements.date; let bad = null;
      [name, phone].forEach(i => i.classList.toggle('field-error', !i.value.trim()));
      if (!name.value.trim()) bad = name; else if (!phone.value.trim()) bad = phone;
      out.textContent = ''; out.hidden = false;
      const h = document.createElement('h3'); const p = document.createElement('p'); const s = document.createElement('p'); s.className = 'small';
      if (bad) { h.textContent = 'Almost there'; p.textContent = 'Add your name and phone number so the cafe can reach you.'; out.append(h, p); bad.focus(); return; }
      if (date.value && parse(date.value).getDay() === 1) { date.classList.add('field-error'); h.textContent = 'Closed Mondays'; p.textContent = 'Pick another day: the cafe is closed on Mondays.'; out.append(h, p); date.focus(); return; }
      date.classList.remove('field-error');
      h.textContent = 'Request ready'; p.textContent = build(f.elements);
      s.textContent = "Preview only: nothing was sent. On the real site, the cafe confirms by text or call.";
      out.append(h, p, s); out.focus();
    });
  }
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const nice = v => { if (!v) return ''; const d = parse(v); return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`; };
  wire('order-form', el => {
    const what = (el.order.value.trim() || el.type.value).replace(/[.\s]+$/, '');
    const pick = el.date.value && !what.includes(nice(el.date.value)) ? `pickup ${nice(el.date.value)}` : '';
    return [what, el.occasion.value && `for a ${el.occasion.value.toLowerCase()}`, pick, `for ${el.name.value.trim()}`].filter(Boolean).join(', ') + '.';
  });
  wire('host-form', el => [el.kind.value, el.people.value && `about ${el.people.value} people`, el.date.value && nice(el.date.value), el.when.value && el.when.value.toLowerCase(), `for ${el.name.value.trim()}`].filter(Boolean).join(', ') + '.');
})();

/* --- reveals + phone bar --- */
(() => {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) els.forEach(e => e.classList.add('is-visible'));
  else {
    const n = new Map(); els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', Math.min(i, 5) * .08 + 's'); n.set(p, i + 1); });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
    setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
  }
  const bar = document.querySelector('.mobile-bar'), hero = document.getElementById('home');
  if (bar && hero && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting), { threshold: 0 }).observe(hero);
})();
