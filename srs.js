// Word Gym's schedule: which cards to show today, how each answer moves a card, and the forecast.
//
// Spaced repetition (間隔複習): a word must be 熟 on 6 different days, with growing rests in between
// (1, 2, 4, 7, 15, 30 days). Stage 6 = long-term memory; it still comes back every 60 days for upkeep.
// 不熟 = the card is shown again later in the same session until you get it (relearning), and its
// stage drops one step, so it comes back tomorrow.
// A brand-new word answered 熟 at first sight is one you already knew: it jumps to stage 4
// and is checked twice more (in 7 and 15 days) before counting as long-term memory.

export const GAPS = [0, 1, 2, 4, 7, 15, 30];   // rest after reaching each stage
export const MAX_STAGE = 6;
export const KEEP_GAP = 60;                     // upkeep check for long-term words
export const LEARNED = 3;                       // stage 3+ = 記住了 (survived a 4-day rest)
export const STAGE_ZH = ["還沒學", "剛認識", "有印象", "記住了", "很熟悉", "很扎實", "長期記憶"];

// One fixed daily load (the user's choice): 20 new words a day since v1.6.0 (was 30), at most 200 reviews.
export const DAILY = { newWords: 20, reviews: 200 };
export const loadOf = () => DAILY;

// Seconds per card (estimates): a new word (see it, flip, usually 不熟 once, see it again) and a review.
const SEC = { newCard: 16, review: 6, start: 20 };

export function today(d = new Date()) {
  const z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function addDays(date, n) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return today(d);
}
export function daysBetween(a, b) {
  return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}

export function emptyProgress() {
  return { version: 1, words: {}, sessions: [], snapshots: [], medals: [] };
}
export function upgradeProgress(p) {
  return { ...emptyProgress(), ...p, words: p.words || {}, sessions: p.sessions || [],
           intensity: undefined, snapshots: p.snapshots || [], medals: p.medals || [] };
}
export const stageOf = (p, id) => p.words[id]?.box || 0;

// New words come in a fixed mixed order: all A1 first, then A2, topics shuffled together
// (similar words learned side by side get mixed up, so topics are spread out).
function mixKey(w) {
  let h = 2166136261;
  for (const ch of w) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}
let orderCache = null;
export function newOrder(words) {
  if (orderCache?.src === words) return orderCache.list;
  const list = [...words].sort((a, b) => (a.level === b.level ? mixKey(a.w) - mixKey(b.w) : a.level < b.level ? -1 : 1));
  orderCache = { src: words, list };
  return list;
}

// Today's deck: reviews that are due (oldest first, up to the cap), then new words.
export function todayDeck(p, words, daysAhead = 0) {
  const t = addDays(today(), daysAhead);
  const load = loadOf(p);
  const due = words.filter(w => p.words[w.id] && p.words[w.id].due <= t)
    .sort((a, b) => p.words[a.id].due.localeCompare(p.words[b.id].due))
    .slice(0, load.reviews);
  // New words are capped per day, so training twice in a day does not double them.
  const introduced = words.reduce((n, w) => n + (p.words[w.id]?.first === t ? 1 : 0), 0);
  const fresh = newOrder(words).filter(w => !p.words[w.id]).slice(0, Math.max(0, load.newWords - introduced));
  const minutes = Math.max(1, Math.round((fresh.length * SEC.newCard + due.length * SEC.review + SEC.start) / 60));
  return { date: t, review: due, fresh, minutes };
}

// One card's result for the day. firstTry: true = 熟 on the first showing today.
export function grade(entry, firstTry, isNew, t = today()) {
  const s = entry ? { ...entry } : { box: 0, due: t, reps: 0, lapses: 0 };
  s.reps++;
  if (isNew) {
    s.first = t;
    s.box = firstTry ? 4 : 1;
    if (firstTry) s.knewIt = true;
  } else if (firstTry) {
    s.box = Math.min(MAX_STAGE, s.box + 1);
  } else {
    s.box = Math.max(1, s.box - 1);
    s.lapses++;
  }
  const gap = s.box >= MAX_STAGE && entry?.box >= MAX_STAGE ? KEEP_GAP : GAPS[s.box];
  s.due = addDays(t, firstTry ? gap : 1);
  s.last = t;
  return s;
}

/* ---------- progress numbers ---------- */
export function counts(p, words) {
  let started = 0, learned = 0, longTerm = 0, knewIt = 0;
  for (const w of words) {
    const s = p.words[w.id];
    if (!s) continue;
    started++;
    if (s.box >= LEARNED) learned++;
    if (s.box >= MAX_STAGE) longTerm++;
    if (s.knewIt) knewIt++;
  }
  return { total: words.length, started, learned, longTerm, knewIt };
}
// Each topic trains one body region: its strength is the average stage of its words (0–6).
export function regionStages(p, data) {
  const out = {};
  for (const t of data.topics) {
    const ws = data.words.filter(w => w.topic === t.id);
    out[t.region] = ws.length ? ws.reduce((a, w) => a + Math.min(stageOf(p, w.id), MAX_STAGE), 0) / ws.length : 0;
  }
  return out;
}
export function topicStats(p, data) {
  return data.topics.map(t => {
    const ws = data.words.filter(w => w.topic === t.id);
    const learned = ws.filter(w => stageOf(p, w.id) >= LEARNED).length;
    const longTerm = ws.filter(w => stageOf(p, w.id) >= MAX_STAGE).length;
    return { ...t, total: ws.length, learned, longTerm };
  });
}

/* ---------- milestones (the road from zero to A2) ---------- */
// Counted on words 記住了 (stage 3+); the last two need long-term memory.
export function milestones(data) {
  const n = data.words.length, a1 = data.words.filter(w => w.level === "A1").length;
  return [
    { id: "m50", n: 50, zh: "暖身完成", icon: "🌱", what: "learned" },
    { id: "m150", n: 150, zh: "動起來了", icon: "👟", what: "learned" },
    { id: "m300", n: 300, zh: "日常會話入門", icon: "💬", what: "learned" },
    { id: "a1", n: a1, zh: "A1 單字量", icon: "🥉", what: "learned", note: `記住 ${a1} 字＝A1 的單字量` },
    { id: "m800", n: 800, zh: "小有肌肉", icon: "💪", what: "learned" },
    { id: "m1100", n: 1100, zh: "快到了", icon: "🔥", what: "learned" },
    { id: "a2", n, zh: "A2 單字量", icon: "🥈", what: "learned", note: `全部 ${n} 字都記住了＝A2 的單字量` },
    { id: "lt", n, zh: "A2 長期記憶", icon: "🏆", what: "longTerm", note: "全部進入長期記憶＝終點" },
  ];
}
export function milestoneState(p, data) {
  const c = counts(p, data.words);
  return milestones(data).map(m => ({ ...m, have: m.what === "longTerm" ? c.longTerm : c.learned, done: (m.what === "longTerm" ? c.longTerm : c.learned) >= m.n }));
}

/* ---------- check-in and packs ---------- */
export const PACK_DAYS = 7;
export const trainingDates = p => [...new Set(p.sessions.map(s => s.date))].sort();
export function packStatus(p) {
  const dates = trainingDates(p), n = dates.length, t = today();
  const doneToday = dates.at(-1) === t;
  const last = dates.at(-1);
  const missed = last && !doneToday ? Math.max(0, daysBetween(last, t) - 1) : 0;
  const closedToday = doneToday && n > 0 && n % PACK_DAYS === 0;
  return { days: n, no: closedToday ? n / PACK_DAYS : Math.floor(n / PACK_DAYS) + 1, inPack: closedToday ? PACK_DAYS : n % PACK_DAYS,
           doneToday, closedToday, missed };
}
// A snapshot at the start and after each finished pack, for the before/after report.
export function maybeSnapshot(p, data) {
  const snap = () => ({ date: today(), ...counts(p, data.words), regions: regionStages(p, data) });
  if (!p.snapshots.length) { p.snapshots.push({ ...snap(), date: addDays(trainingDates(p)[0] || today(), -1), started: 0, learned: 0, longTerm: 0, regions: {}, start: true }); }
  const last = p.snapshots.at(-1);
  if (trainingDates(p).filter(d => d > last.date).length >= PACK_DAYS) { p.snapshots.push(snap()); return true; }
  return false;
}
export function packReport(p) {
  const s = p.snapshots;
  if (s.length < 2) return null;
  const [a, b] = s.slice(-2);
  const sessions = p.sessions.filter(x => x.date > a.date && x.date <= b.date);
  return { no: s.length - 1, from: a.date, to: b.date, calendar: daysBetween(a.date, b.date), days: new Set(sessions.map(x => x.date)).size,
           cards: sessions.reduce((n, x) => n + (x.cards || 0), 0), newWords: b.started - a.started,
           learned: b.learned - a.learned, longTerm: b.longTerm - a.longTerm, totalLearned: b.learned };
}

/* ---------- forecast: run the schedule forward, assuming you train every day ---------- */
// New words are assumed to need one relearn (不熟 the first time); reviews are assumed 熟.
const forecastCache = new Map();
export function forecast(p, data) {
  const memo = [today(), p.sessions.length, Object.keys(p.words).length].join("|");
  if (forecastCache.has(memo)) return forecastCache.get(memo);
  const sim = structuredClone(p);
  const t0 = today();
  const start = sim.sessions.some(s => s.date === t0) ? 1 : 0;
  const words = data.words;
  const done = () => words.every(w => stageOf(sim, w.id) >= MAX_STAGE);
  const days = [];
  for (let i = start; days.length < 2000 && !done(); i++) {
    const deck = todayDeck(sim, words, i), t = addDays(t0, i);
    for (const w of deck.fresh) sim.words[w.id] = grade(null, false, true, t);
    for (const w of deck.review) sim.words[w.id] = grade(sim.words[w.id], true, false, t);
    days.push({ date: t, fresh: deck.fresh.length, minutes: deck.minutes, learned: counts(sim, words).learned });
  }
  const main = days.filter(d => d.fresh);
  const avg = list => list.length ? Math.round(list.reduce((a, d) => a + d.minutes, 0) / list.length) : 0;
  const n0 = trainingDates(p).length;
  const ms = milestones(data).filter(m => m.what === "learned").map(m => ({ ...m, date: days.find(d => d.learned >= m.n)?.date || null }));
  const out = { key: "daily20", finishDate: days.at(-1)?.date || t0, remaining: days.length, minutes: avg(main),
                tailDays: days.length - main.length, totalPacks: Math.ceil((n0 + days.length) / PACK_DAYS), milestoneDates: ms };
  if (forecastCache.size > 12) forecastCache.clear();
  forecastCache.set(memo, out);
  return out;
}
