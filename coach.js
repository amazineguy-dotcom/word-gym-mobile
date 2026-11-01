// Coach Mia: a sporty, warm big-sister coach. Encourages a lot, teases a little. Speaks to "妳".
// Her face is a generic cartoon (high ponytail, pink sweatband, teal tank top, whistle on the chest),
// not any real person.

const pick = a => a[Math.floor(Math.random() * a.length)];
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

const LOBBY = {
  first:     ["嗨！我是 Mia 教練。今天是第一天，我們從最簡單的開始，妳只要誠實按熟或不熟就好～",
              "歡迎來到單字健身房！一張卡一張卡刷，我會幫妳排好什麼時候複習。"],
  doneToday: ["今天的份量完成了！單字會在妳睡覺的時候長進腦袋裡，明天見～",
              "練完了就好好休息，記憶跟肌肉一樣，是休息的時候長出來的。"],
  missed1:   ["昨天沒來喔～沒關係，今天補回來，進度一點都沒掉。",
              "嘿，昨天休息了一天？OK，今天我們繼續！"],
  missedMany:["{gap} 天沒見！我好想妳…還有妳的單字也在等妳。今天先把複習做完就好。",
              "{gap} 天沒來，單字有點想念妳了。別擔心，今天回來就是最好的開始。"],
  streak:    ["連續 {streak} 天！妳的腦袋正在變成單字吸塵器。",
              "第 {streak} 天連續報到，我超驕傲的！"],
  normal:    ["今天 {deck} 張卡等著妳，大約 {min} 分鐘，一起把它刷完！",
              "準備好了嗎？看英文、想中文、翻面、按熟或不熟，就這麼簡單。"],
};
const EVENTS = {
  start:   ["開始囉！先想意思，想不到也沒關係，翻面看答案。", "Let's go！每張卡都誠實按，記憶才會準。"],
  knew:    ["Nice！", "好棒～", "完全正確！", "記得很牢喔！", "這個難不倒妳。"],
  forgot:  ["沒關係，等一下它會再出現，再看一次就好。", "記不起來很正常，這張我等等再考妳。", "錯了才記得牢，下一次就會了！"],
  relearn: ["它又回來了！這次記得嗎？", "第二次見面，打個招呼吧～"],
  halfway: ["已經一半了，加油！", "過半囉，妳很穩！"],
  done:    ["今天完成！給自己拍拍手 👏", "太棒了，今天的單字都收進腦袋了！"],
  medal:   ["哇！解鎖新獎章：{medal}！", "恭喜！{medal} 達成，我們離 A2 又近一步了！"],
  pause:   ["休息一下，喝口水～", "好，暫停。準備好再繼續。"],
  quit:    ["今天先到這裡？沒關係，明天見！", "下次記得把今天的份量刷完喔～"],
  pack:    ["第 {no} 包結業！這 7 天妳超認真的。", "第 {no} 包完成！看看妳這包又記住了多少字。"],
};
export const lobbyLine = st => {
  const pool = !st.sessions ? LOBBY.first : st.todayDone ? LOBBY.doneToday : st.gap >= 2 ? LOBBY.missedMany
    : st.gap === 1 ? LOBBY.missed1 : st.streak >= 2 ? LOBBY.streak : LOBBY.normal;
  return fill(pick(pool), st);
};
export const say = (event, vars = {}) => fill(pick(EVENTS[event] || [""]), vars);

export const MIA_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <path d="M8 64 C9 56 17 51 25 49 L39 49 C47 51 55 56 56 64 Z" fill="#e9b291"/>
  <path d="M14 64 C15 58 18 55 22 53 L25 64 Z M50 64 C49 58 46 55 42 53 L39 64 Z" fill="#14b8a6"/>
  <path d="M27 46 L37 46 L38 51 C35 52.5 29 52.5 26 51 Z" fill="#e3a585"/>
  <path d="M44 14 C58 14 62 32 56 46 C53 38 50 30 44 24 Z" fill="#3b2418"/>
  <circle cx="17" cy="32" r="3.2" fill="#eab08f"/><circle cx="47" cy="32" r="3.2" fill="#eab08f"/>
  <circle cx="17" cy="36.5" r="1.3" fill="#ffd166"/><circle cx="47" cy="36.5" r="1.3" fill="#ffd166"/>
  <path d="M17 27 C17 15 24 9 32 9 C40 9 47 15 47 27 L47 34 C47 43 40 50 32 50 C24 50 17 43 17 34 Z" fill="#f4c4a4"/>
  <path d="M16 27 C14 13 23 5 32 5 C41 5 50 12 48 27 C45 20 40 16 33 17 C26 16 20 20 16 27 Z" fill="#3b2418"/>
  <path d="M20 21 C24 15 32 14 37 17 C32 20 26 22 20 25 Z" fill="#3b2418"/>
  <path d="M15.5 21 C24 14 40 14 48.5 21 L48 24.5 C40 18 24 18 16 24.5 Z" fill="#ff6fa8"/>
  <circle cx="45" cy="15" r="3" fill="#ff6fa8"/>
  <path d="M21 27.5 C23.5 26 27 26 29 27.2 M35 27.2 C37 26 40.5 26 43 27.5" stroke="#3b2418" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M21.5 32 C23.5 29.8 27 29.8 29 32 M35 32 C37 29.8 40.5 29.8 42.5 32" stroke="#2a1712" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M21 30.6 L19.6 29.6 M43 30.6 L44.4 29.6" stroke="#2a1712" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="22" cy="37.5" r="2.6" fill="#ff8fb1" opacity=".5"/><circle cx="42" cy="37.5" r="2.6" fill="#ff8fb1" opacity=".5"/>
  <path d="M32 31 L31 36.5 C31.8 37.6 33 37.6 33.6 36.8" stroke="#c98a6b" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <path d="M25.5 40 C28 46 36 46 38.5 40 Z" fill="#fff" stroke="#b8325a" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M26 40 L38 40" stroke="#b8325a" stroke-width="1"/>
  <path d="M25.5 51 L32 59.5 L38.5 51" stroke="#ffffff" stroke-width="1.1" fill="none" stroke-linejoin="round"/>
  <path d="M29.8 59.6 C29.8 57.9 31.1 56.9 32.6 56.9 C34.3 56.9 35.5 58 35.5 59.6 C35.5 61.2 34.3 62.3 32.6 62.3 C31.1 62.3 29.8 61.2 29.8 59.6 Z M35 58.4 L38.8 58.4 L38.8 60.3 L35 60.3 Z" fill="#c9ced3" stroke="#5f666c" stroke-width=".7"/>
</svg>`;
