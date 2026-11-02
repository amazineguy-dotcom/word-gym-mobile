// Word Gym 單字健身房 (phone version, GitHub Pages): flashcards (English → Chinese), 熟 / 不熟,
// spaced repetition, a visible road to A2. No server: progress lives in this phone's browser,
// and Ava's voice comes from pre-recorded files (audio/w/<id>.mp3 = word, audio/e/<id>.mp3 = example).
import { VERSION } from "./version.js";
import { MIA_SVG, lobbyLine, say } from "./coach.js";
import { figure, TONE } from "./figure.js";
import { STAGE_ZH, MAX_STAGE, LEARNED, emptyProgress, upgradeProgress, todayDeck, grade, counts, regionStages,
         topicStats, milestoneState, packStatus, maybeSnapshot, packReport, forecast, today, addDays, daysBetween,
         trainingDates, PACK_DAYS, stageOf } from "./srs.js";

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const REGION_ZH = { shoulders: "肩膀", arms: "手臂", back: "背", abs: "腹肌", waist: "腰線", glutes: "臀", thighs: "大腿", calves: "小腿" };
const md = d => `${+d.slice(5, 7)}/${+d.slice(8)}`;
const ymd = d => `${d.slice(0, 4)}/${+d.slice(5, 7)}/${+d.slice(8)}`;

let data = null, progress = emptyProgress(), drill = null, flash = new Set();

// v1.1.0 removed the settings (fixed 30 words a day, normal speed); drop the old saved choice.
try { localStorage.removeItem("wordgym-settings"); } catch {}

/* ---------- progress: saved in this phone's browser ---------- */
const STORE = "wordgym-progress";
function loadProgress() {
  try { const p = JSON.parse(localStorage.getItem(STORE) || "null"); return p && p.version ? upgradeProgress(p) : emptyProgress(); }
  catch { return emptyProgress(); }
}
let saveTimer = 0;
function saveProgress(now = false) {
  clearTimeout(saveTimer);
  const go = () => {
    try { localStorage.setItem(STORE, JSON.stringify(progress)); }
    catch (e) { notice("進度存檔失敗：" + e.message); }
  };
  if (now) return go();
  saveTimer = setTimeout(go, 400);
}
// Save before the page is hidden (switching apps, locking the phone).
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveProgress(true); });
function notice(text) {
  const n = $("notice"); n.textContent = text; n.hidden = false;
  clearTimeout(notice.t); notice.t = setTimeout(() => { n.hidden = true; }, 4000);
}

/* ---------- voice: Ava, pre-recorded ---------- */
// Clips are fetched (the offline cache keeps every clip you have heard) and played from memory,
// which avoids iPhone problems with cached audio. Always normal speed.
const clipCache = new Map();
function clip(url) {
  if (!clipCache.has(url)) {
    clipCache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(b => URL.createObjectURL(b)).catch(e => { clipCache.delete(url); throw e; }));
  }
  return clipCache.get(url);
}
const wordUrl = w => `audio/w/${w.id}.mp3`, exUrl = w => `audio/e/${w.id}.mp3`;
const prefetch = url => { if (url) clip(url).catch(() => {}); };
const player = new Audio();   // one element, reused: phones only let a tapped page play sound
let speakToken = 0;
async function speak(url, fallbackText) {
  const my = ++speakToken;
  try {
    const src = await clip(url);
    if (my !== speakToken) return;
    player.pause();
    player.src = src;
    player.playbackRate = 1;
    await player.play();
  } catch {
    // Offline and never heard before: use the phone's own voice as a backup.
    if (my === speakToken && fallbackText && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(fallbackText);
      u.lang = "en-US";
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  }
}
const sayWord = w => speak(wordUrl(w), w.w);
const sayEx = w => speak(exUrl(w), w.ex);

/* ---------- lobby ---------- */
function streak() {
  const days = new Set(trainingDates(progress));
  let n = 0;
  for (let d = days.has(today()) ? today() : addDays(today(), -1); days.has(d); d = addDays(d, -1)) n++;
  return n;
}
function renderGoal() {
  const c = counts(progress, data.words), f = forecast(progress, data);
  $("gbLong").style.width = (c.longTerm / c.total * 100) + "%";
  $("gbLearned").style.width = ((c.learned - c.longTerm) / c.total * 100) + "%";
  $("gnLeft").textContent = `已記住 ${c.learned}（${Math.floor(c.learned / c.total * 100)}%）　長期記憶 ${c.longTerm}`;
  $("gnRight").textContent = `目標 ${c.total} 字`;
  const road = $("road"); road.textContent = "";
  const ms = milestoneState(progress, data);
  const nextIdx = ms.findIndex(m => !m.done);
  // The next medal sits at the top of the card; the full road is folded below.
  const nx = $("nextMs"); nx.textContent = "";
  if (nextIdx < 0) {
    nx.append(el("span", "ic", "🏆"), el("div", null, ""), el("span", "when", "全部達成！"));
    nx.children[1].append(el("b", null, "A2 單字量＋長期記憶都達成了"), el("small", null, "接下來只剩每 60 天的保養複習"));
  } else {
    const m = ms[nextIdx], date = f.milestoneDates.find(x => x.id === m.id)?.date || (m.id === "lt" ? f.finishDate : null);
    const t = el("div"); t.append(el("b", null, `下一關：${m.zh}`), el("small", null, m.note || `記住 ${m.n} 個字`));
    nx.append(el("span", "ic", m.icon), t, el("span", "when", `還差 ${m.n - m.have} 字${date ? `\n預計 ${md(date)}` : ""}`));
  }
  ms.forEach((m, i) => {
    const li = el("li", m.done ? "done" : i === nextIdx ? "next" : "");
    const ic = el("span", "ic", m.icon);
    const nm = el("span", "nm"); nm.append(el("b", null, m.zh), el("small", null, m.note || `記住 ${m.n} 個字`));
    const date = f.milestoneDates.find(x => x.id === m.id)?.date;
    const when = el("span", "when", m.done ? "達成 ✓" : i === nextIdx ? `還差 ${m.n - m.have} 字${date ? `\n預計 ${md(date)}` : ""}` : date ? `預計 ${md(date)}` : m.id === "lt" ? `預計 ${md(f.finishDate)}` : "");
    when.style.whiteSpace = "pre-line";
    li.append(ic, nm, when);
    road.append(li);
  });
}
// The figure and the 8 region bars are one view: each topic of words trains one body part.
// Tap a body part or a bar to pick it; both light up together and the line below explains it.
let picked = null;
const REGION_ORDER = Object.keys(REGION_ZH);
function renderBody() {
  const st = regionStages(progress, data);
  $("bodyFront").innerHTML = figure("front", st, REGION_ZH, flash);
  $("bodyBack").innerHTML = figure("back", st, REGION_ZH, flash);
  flash = new Set();
  const tp = $("topics"); tp.textContent = "";
  const stats = topicStats(progress, data).sort((x, y) => REGION_ORDER.indexOf(x.region) - REGION_ORDER.indexOf(y.region));
  for (const t of stats) {
    const row = el("button", "topic"); row.type = "button"; row.dataset.region = t.region;
    const name = el("span"); name.append(el("b", null, REGION_ZH[t.region]), `・${t.zh}`);
    row.append(name, el("small", null, `${t.learned}/${t.total}`));
    const bar = el("div", "bar"); const lt = el("i", "t"), ln = el("i", "l");
    lt.style.width = (t.longTerm / t.total * 100) + "%"; ln.style.width = ((t.learned - t.longTerm) / t.total * 100) + "%";
    bar.append(lt, ln); row.append(bar); tp.append(row);
  }
  const lg = $("legend"); lg.textContent = "";
  lg.append("還沒練");
  TONE.forEach((c, i) => { const x = el("i"); x.style.background = c; x.title = STAGE_ZH[i]; lg.append(x); });
  lg.append("長期記憶");
  showPick();
}
function showPick() {
  const st = regionStages(progress, data);
  for (const n of document.querySelectorAll("[data-region]")) n.classList.toggle("sel", n.dataset.region === picked);
  for (const id of ["bodyFront", "bodyBack", "topics"]) $(id).classList.toggle("picking", !!picked);
  if (picked) {
    const t = topicStats(progress, data).find(x => x.region === picked);
    const fresh = data.words.filter(w => w.topic === t.id && !progress.words[w.id]).length;
    $("bodyLine").textContent = `${REGION_ZH[picked]}＝「${t.zh}」${t.total} 字：已記住 ${t.learned}、長期記憶 ${t.longTerm}、還沒學 ${fresh}。再點一次取消。`;
    return;
  }
  const best = Object.entries(st).sort((a, b) => b[1] - a[1])[0];
  $("bodyLine").textContent = (best && best[1] > 0 ? `目前最結實的是「${REGION_ZH[best[0]]}」。` : "")
    + "每個主題的單字記得越多，那個部位線條越明顯。點身體或下面的進度條看細節。";
}
function pick(e) {
  const r = e.target.closest("[data-region]")?.dataset.region;
  if (!r) return;
  picked = picked === r ? null : r;
  showPick();
}
function renderPack() {
  const box = $("packCard"); box.textContent = "";
  const ps = packStatus(progress), f = forecast(progress, data);
  const head = el("div", "ph");
  head.append(el("b", null, ps.closedToday ? `第 ${ps.no} 包結業！🎉` : ps.doneToday ? `第 ${ps.no} 包 · 今天已簽到 ✓（${ps.inPack}/${PACK_DAYS}）` : `第 ${ps.no} 包 · 今天是第 ${ps.inPack + 1}/${PACK_DAYS} 天`),
              el("small", null, (streak() >= 2 ? `連續 ${streak()} 天 🔥・` : "") + `全部約 ${f.totalPacks} 包`));
  const stamps = el("div", "stamps");
  for (let i = 0; i < PACK_DAYS; i++) {
    const on = i < ps.inPack, isToday = !ps.doneToday && i === ps.inPack;
    stamps.append(el("i", on ? "on" : isToday ? "today" : "", on ? "♥" : isToday ? "今天" : String(i + 1)));
  }
  box.append(head, stamps);
  if (ps.missed) box.append(el("p", "late", `${ps.missed} 天沒簽到：單字還在，只是終點往後延 ${ps.missed} 天。今天練完就恢復！`));
  if (!progress.target || progress.target.key !== f.key) { progress.target = { key: f.key, date: f.finishDate }; saveProgress(); }
  const shift = daysBetween(progress.target.date, f.finishDate);
  const eta = el("p", "eta");
  eta.append(`每天約 ${f.minutes} 分鐘，預計 `, el("b", null, ymd(f.finishDate)), ` 達成 A2 單字量（還要 ${f.remaining} 天）`
    + (shift > 0 ? `，比原本延後 ${shift} 天` : shift < 0 ? `，比原本提前 ${-shift} 天` : "") + "。練完當天的卡＝簽到。");
  box.append(eta);
}
function renderToday() {
  const d = todayDeck(progress, data.words);
  $("tNew").textContent = d.fresh.length;
  $("tReview").textContent = d.review.length;
  $("tMin").textContent = d.minutes;
  const ps = packStatus(progress);
  const b = $("startBtn");
  b.disabled = !d.fresh.length && !d.review.length;
  b.textContent = b.disabled ? "今天的份量完成了，明天見 ♥" : ps.doneToday ? "繼續今天剩下的卡（今天已簽到）" : "開始今天的單字（練完自動簽到）";
  const n = todayWords().length, x = $("extraBtn");
  x.hidden = !n;
  x.textContent = `再練一次今天的 ${n} 個字（加練）`;
}
// Words answered today: the ones the extra round goes over.
const todayWords = () => data.words.filter(w => progress.words[w.id]?.last === today());
function renderAll() {
  if (!data) return;
  renderGoal(); renderBody(); renderPack(); renderToday();
}
function miaSay(text) { $("miaText").textContent = text; }
function lobbyMia() {
  const dates = trainingDates(progress), last = dates.at(-1);
  const d = todayDeck(progress, data.words);
  miaSay(lobbyLine({ sessions: dates.length, todayDone: last === today(), streak: streak(),
    gap: last && last !== today() ? Math.max(0, daysBetween(last, today()) - 1) : 0, deck: d.fresh.length + d.review.length, min: d.minutes }));
}

/* ---------- the drill ---------- */
// Queue: reviews (shuffled) with the new words spread evenly among them.
function buildQueue(deck) {
  const rev = [...deck.review].sort(() => Math.random() - .5);
  const out = [];
  const every = deck.fresh.length ? Math.max(1, Math.floor(rev.length / deck.fresh.length)) : 0;
  let f = 0;
  rev.forEach((w, i) => { out.push({ w, isNew: false }); if (every && (i + 1) % every === 0 && f < deck.fresh.length) out.push({ w: deck.fresh[f++], isNew: true }); });
  while (f < deck.fresh.length) out.push({ w: deck.fresh[f++], isNew: true });
  return out;
}
// Extra round: today's words again, as many times as she likes. Answers here never change the
// schedule (only the day's first answer counts) and do not count as a session or check-in.
function startExtra() {
  const list = todayWords().sort(() => Math.random() - .5);
  if (!list.length) return;
  $("sum").hidden = true;
  drill = { extra: true, queue: list.map(w => ({ w, isNew: false })), pos: 0, first: new Map(), again: new Map(), known: 0, unknown: 0,
            flipped: false, startedAt: Date.now(), total: list.length };
  $("drill").hidden = false;
  $("miaMini").innerHTML = MIA_SVG;
  $("miaMiniText").textContent = say("extra");
  showCard();
}
function startDrill() {
  const deck = todayDeck(progress, data.words);
  if (!deck.fresh.length && !deck.review.length) return;
  drill = { queue: buildQueue(deck), pos: 0, first: new Map(), again: new Map(), known: 0, unknown: 0, flipped: false,
            startedAt: Date.now(), firstToday: !packStatus(progress).doneToday, total: deck.fresh.length + deck.review.length,
            newCount: deck.fresh.length, newIds: new Set(deck.fresh.map(w => w.id)), before: { ...counts(progress, data.words) }, regionsBefore: regionStages(progress, data), half: false };
  $("drill").hidden = false;
  $("miaMini").innerHTML = MIA_SVG;
  $("miaMiniText").textContent = say("start");
  showCard();
}
function highlight(ex, w) {
  const stem = w.toLowerCase().split(" ")[0].replace(/(e|y)$/, "");
  const span = el("span", "ex");
  const re = new RegExp(`(\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z']*)`, "i");
  const m = ex.match(re);
  if (!m) { span.textContent = ex; return span; }
  span.append(ex.slice(0, m.index), el("mark", null, m[0]), ex.slice(m.index + m[0].length));
  return span;
}
function showCard() {
  const item = drill.queue[drill.pos];
  if (!item) return finishDrill();
  drill.flipped = false;
  const { w } = item;
  const relearn = drill.first.has(w.id);
  const f = $("flash"); f.textContent = "";
  const stage = stageOf(progress, w.id);
  f.append(el("span", "tag" + (relearn ? " again" : item.isNew ? " new" : drill.extra ? " extra" : ""),
              relearn ? "再一次" : item.isNew ? "新單字" : drill.extra ? "加練" : `複習 · ${STAGE_ZH[stage]}`),
           el("span", "lvl", `${w.level} · ${data.topics.find(t => t.id === w.topic).zh}`),
           el("span", "word", w.w), el("span", "pos", w.pos), el("span", "say", "🗣️ 跟著大聲念一次"), el("span", "think", "再想一想：它的中文意思是？"));
  const sp = el("button", "spk", "🔊 再聽一次"); sp.type = "button"; sp.onclick = e => { e.stopPropagation(); sayWord(w); }; f.append(sp);
  $("flipBtn").hidden = false; $("answer").hidden = true;
  updateTop();
  sayWord(w);
  prefetch(exUrl(w));
  const next = drill.queue[drill.pos + 1]; if (next) prefetch(wordUrl(next.w));
}
function flip() {
  if (!drill || drill.flipped) return;
  drill.flipped = true;
  const { w } = drill.queue[drill.pos];
  const f = $("flash");
  f.querySelector(".think")?.remove();
  f.querySelector(".say")?.remove();
  f.querySelector(".spk")?.remove();
  f.append(el("span", "zh", w.zh), highlight(w.ex, w.w));
  f.append(el("span", "say", "🗣️ 聽完跟著念例句"));
  const sp = el("button", "spk", "🔊 聽例句"); sp.type = "button"; sp.onclick = e => { e.stopPropagation(); sayEx(w); }; f.append(sp);
  $("flipBtn").hidden = true; $("answer").hidden = false;
}
function answer(knew) {
  if (!drill || !drill.flipped) return;
  const item = drill.queue[drill.pos];
  const { w } = item;
  if (!drill.first.has(w.id)) {
    // The first answer of the day decides the schedule; later showings are just relearning.
    drill.first.set(w.id, knew);
    knew ? drill.known++ : drill.unknown++;
    if (!drill.extra) { progress.words[w.id] = grade(progress.words[w.id], knew, item.isNew); saveProgress(); }
  }
  if (!knew) {
    const n = (drill.again.get(w.id) || 0) + 1;
    drill.again.set(w.id, n);
    if (n <= 3) drill.queue.splice(Math.min(drill.queue.length, drill.pos + 4), 0, { w, isNew: false });
    $("miaMiniText").textContent = say("forgot");
  } else $("miaMiniText").textContent = drill.again.has(w.id) ? say("relearn") : say("knew");
  drill.pos++;
  if (!drill.half && drill.first.size >= drill.total / 2) { drill.half = true; $("miaMiniText").textContent = say("halfway"); }
  showCard();
}
function updateTop() {
  const done = drill.pos, all = drill.queue.length;
  $("dBar").style.width = (done / all * 100) + "%";
  $("dCount").innerHTML = `${Math.min(done + 1, all)} / ${all}　<b class="k">熟 ${drill.known}</b>　<b class="u">不熟 ${drill.unknown}</b>`;
}
function finishDrill(quit = false) {
  const d = drill; drill = null;
  $("drill").hidden = true;
  player.pause();
  if (!d.first.size) { lobbyMia(); renderAll(); return; }
  if (d.extra) { showExtraSummary(d, quit); renderAll(); miaSay(say("extraDone")); return; }
  const minutes = Math.max(1, Math.round((Date.now() - d.startedAt) / 60000));
  progress.sessions.push({ date: today(), cards: d.first.size, known: d.known, unknown: d.unknown, newWords: [...d.first.keys()].filter(id => d.newIds.has(id)).length, minutes, quit });
  const packClosed = maybeSnapshot(progress, data);
  // Medals reached this time
  const now = milestoneState(progress, data).filter(m => m.done && !progress.medals.includes(m.id));
  progress.medals.push(...now.map(m => m.id));
  saveProgress(true);
  const after = regionStages(progress, data);
  flash = new Set(Object.keys(after).filter(r => Math.round(after[r]) > Math.round(d.regionsBefore[r] || 0) || (after[r] > 0 && !(d.regionsBefore[r] > 0))));
  showSummary(d, minutes, now, packClosed, quit);
  renderAll();
  miaSay(now.length ? say("medal", { medal: now.map(m => m.zh).join("、") }) : quit ? say("quit") : say("done"));
}

/* ---------- summary and pack report ---------- */
function showSummary(d, minutes, medals, packClosed, quit) {
  const c = counts(progress, data.words), ps = packStatus(progress);
  const sh = $("sheet"); sh.textContent = "";
  sh.append(el("h2", null, quit ? "今天先練到這裡 ♥" : "今天的單字完成了！🎉"));
  const stats = el("div", "stats");
  for (const [v, l] of [[d.first.size, "練了幾張卡"], [d.known, "第一次就熟"], [d.unknown, "還不熟（明天再見）"], [minutes, "分鐘"]]) {
    const s = el("div", "stat"); s.append(el("b", null, String(v)), el("span", null, l)); stats.append(s);
  }
  sh.append(stats);
  if (d.firstToday) {
    const ci = el("div", "checkin", `✓ 簽到成功：第 ${ps.days} 天（第 ${ps.no} 包 ${ps.inPack}/${PACK_DAYS}）`);
    ci.append(el("small", null, ps.closedToday ? `第 ${ps.no} 包完成了！結業報告在下面。` : `再 ${PACK_DAYS - ps.inPack} 天這一包就結業，明天記得回來喔！`));
    sh.append(ci);
  }
  for (const m of medals) {
    const md_ = el("div", "medal"); md_.append(el("span", "ic", m.icon));
    const t = el("div"); t.append(el("b", null, `解鎖獎章：${m.zh}`), el("div", null, m.note || `已經記住 ${m.n} 個字！`)); md_.append(t);
    sh.append(md_);
  }
  const rows = el("div", "rows");
  const r = (a, b) => { const x = el("div", "r"); x.append(el("span", null, a), el("b", null, b)); rows.append(x); };
  r("已記住的字（第 3 階以上）", `${c.learned} / ${c.total}（+${c.learned - d.before.learned}）`);
  r("長期記憶", `${c.longTerm}（+${c.longTerm - d.before.longTerm}）`);
  const tomorrow = todayDeck(progress, data.words, 1);
  r("明天的份量", `新字 ${tomorrow.fresh.length}、複習 ${tomorrow.review.length}，約 ${tomorrow.minutes} 分鐘`);
  sh.append(rows);
  if (packClosed) sh.append(packReportBlock());
  sh.append(sumButtons());
  $("sum").hidden = false;
}
function showExtraSummary(d, quit) {
  const sh = $("sheet"); sh.textContent = "";
  sh.append(el("h2", null, quit ? "加練先到這裡 ♥" : "加練完成！💪"));
  const stats = el("div", "stats");
  for (const [v, l] of [[d.first.size, "練了幾個字"], [d.known, "熟"], [d.unknown, "不熟"]]) {
    const s = el("div", "stat"); s.append(el("b", null, String(v)), el("span", null, l)); stats.append(s);
  }
  sh.append(stats, el("p", "lead", "加練只是加深印象，不會改變這些字什麼時候再出現。真正的考驗是明天和之後的複習。"));
  sh.append(sumButtons());
  $("sum").hidden = false;
}
// Bottom of a summary: practise today's words again, or go back to the lobby.
function sumButtons() {
  const box = el("div", "sumBtns");
  const again = el("button", "btn2", "再練一次今天的字"); again.type = "button"; again.onclick = startExtra;
  const ok = el("button", "btn", "回到健身房"); ok.type = "button"; ok.onclick = () => { $("sum").hidden = true; };
  box.append(again, ok);
  return box;
}
function packReportBlock() {
  const r = packReport(progress);
  const box = el("div", "rows");
  if (!r) return box;
  box.append(el("h2", null, `第 ${r.no} 包結業報告`));
  const row = (a, b) => { const x = el("div", "r"); x.append(el("span", null, a), el("b", null, b)); box.append(x); };
  row("用了幾天", `${r.calendar} 天（練了 ${r.days} 天）`);
  row("刷了幾張卡", String(r.cards));
  row("新認識的字", `+${r.newWords}`);
  row("新記住的字", `+${r.learned}（總共 ${r.totalLearned}）`);
  row("進入長期記憶", `+${r.longTerm}`);
  box.append(el("p", "lead", r.calendar > r.days ? `中間有 ${r.calendar - r.days} 天沒簽到，下一包我們準時一點！` : "7 天全勤，太厲害了！"));
  return box;
}

/* ---------- controls ---------- */
$("startBtn").onclick = startDrill;
$("extraBtn").onclick = startExtra;
for (const id of ["bodyFront", "bodyBack", "topics"]) $(id).addEventListener("click", pick);
// Folding sections (小提醒, the full medal road): folded by default; the phone remembers each one.
function foldable(toggle, body, word, key) {
  const set = open => {
    $(body).hidden = !open;
    $(toggle).setAttribute("aria-expanded", open);
    $(word).textContent = open ? "收起 ▴" : "展開 ▾";
    try { localStorage.setItem(key, open ? "1" : "0"); } catch {}
  };
  $(toggle).onclick = () => set($(body).hidden);
  let open = false;
  try { open = localStorage.getItem(key) === "1"; } catch {}
  set(open);
}
foldable("tipsToggle", "tipsBody", "tipsWord", "wordgym-tips-open");
foldable("roadToggle", "road", "roadWord", "wordgym-road-open");
$("flipBtn").onclick = flip;
$("flash").onclick = flip;            // tap the card to flip it
$("yesBtn").onclick = () => answer(true);
$("noBtn").onclick = () => answer(false);
$("quitBtn").onclick = () => { if (drill) finishDrill(true); };
$("sum").addEventListener("click", e => { if (e.target === $("sum")) $("sum").hidden = true; });
document.addEventListener("keydown", e => {
  if (!drill) { if (e.key === "Escape") $("sum").hidden = true; return; }
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!drill.flipped) flip(); }
  else if (e.key === "ArrowRight" || e.key === "1") answer(true);
  else if (e.key === "ArrowLeft" || e.key === "2") answer(false);
  else if (e.key === "r" || e.key === "R") sayWord(drill.queue[drill.pos].w);
  else if (e.key === "Escape") finishDrill(true);
});
window.wordGym = { get progress() { return progress; }, get data() { return data; }, get drill() { return drill; }, answer, flip };

/* ---------- start ---------- */
(async () => {
  $("ver").textContent = "v" + VERSION;
  $("miaFace").innerHTML = MIA_SVG;
  progress = loadProgress();
  // Ask the browser to keep this site's data (less chance it gets cleared to save space).
  try { navigator.storage?.persist?.(); } catch {}
  try { data = await fetch("words.json").then(r => r.json()); }
  catch { notice("單字載入失敗，請連上網路後重新整理。"); return; }
  renderAll();
  lobbyMia();
  installTip();
})();

/* ---------- home screen + offline ---------- */
if ("serviceWorker" in navigator) navigator.serviceWorker.register(`sw.js?v=${VERSION}`).catch(() => {});

// Update check: each time the app opens or comes back to the front, ask GitHub for the current
// version. If it is newer, reload once (never in the middle of a drill) so the phone runs it.
async function checkUpdate() {
  if (drill || !navigator.onLine) return;
  try {
    const txt = await fetch(`version.js?t=${Date.now()}`, { cache: "no-store" }).then(r => r.ok ? r.text() : "");
    const latest = (txt.match(/VERSION = "([^"]+)"/) || [])[1];
    if (!latest || latest === VERSION) return;
    // Do not loop if the reload still serves the old files (e.g. a slow CDN): one try per version.
    if (sessionStorage.getItem("wordgym-updating") === latest) return;
    sessionStorage.setItem("wordgym-updating", latest);
    saveProgress(true);
    notice(`更新到 v${latest}…`);
    // A plain reload can still use the browser's saved copies of the program files (kept up to
    // 10 minutes), so fetch each one fresh first; the reload then runs the new version.
    await Promise.all(["./", "index.html", "app.js", "srs.js", "coach.js", "figure.js", "version.js", "words.json"]
      .map(u => fetch(u, { cache: "reload" }).catch(() => {})));
    const reg = await navigator.serviceWorker?.getRegistration().catch(() => null);
    await reg?.update().catch(() => {});
    location.reload();
  } catch {}
}
addEventListener("load", () => setTimeout(checkUpdate, 1500));
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkUpdate(); });
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
let installEvent = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvent = e; if (data) installTip(); });
function installTip() {
  const box = $("installTip");
  let dismissed = false;
  try { dismissed = localStorage.getItem("wordgym-install-hide") === "1"; } catch {}
  if (standalone() || dismissed) { box.hidden = true; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  box.textContent = "";
  const t = el("div");
  t.append(el("b", null, "加到主畫面，像 App 一樣用"));
  if (installEvent) {
    t.append(el("span", null, "有自己的圖示、全螢幕，進度也比較不會被清掉。"));
    const go = el("button", "go", "加到主畫面"); go.type = "button";
    go.onclick = async () => { installEvent.prompt(); await installEvent.userChoice.catch(() => {}); installEvent = null; box.hidden = true; };
    t.append(el("br"), go);
  } else if (ios) {
    t.append(el("span", null, "用 Safari 開，點下面的「分享」按鈕 →「加入主畫面」。iPhone 一定要這樣做，進度才不會被清掉。"));
  } else {
    t.append(el("span", null, "在瀏覽器選單裡選「加到主畫面」或「安裝應用程式」。"));
  }
  const x = el("button", null, "✕"); x.type = "button"; x.title = "不再顯示";
  x.onclick = () => { box.hidden = true; try { localStorage.setItem("wordgym-install-hide", "1"); } catch {} };
  box.append(t, x);
  box.hidden = false;
}
