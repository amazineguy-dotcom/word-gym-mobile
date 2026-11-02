// Coach Mia: a sporty, warm big-sister coach. Encourages a lot, teases a little. Speaks to "妳".
// Her face is a generic cartoon (short dark bob, headphones around the neck, purple zip jacket),
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
  start:   ["開始囉！聽完跟著大聲念，再想意思。想不到也沒關係，翻面看答案。", "Let's go！每個字都念出聲音，耳朵和嘴巴一起練！"],
  knew:    ["Nice！", "好棒～", "完全正確！", "記得很牢喔！", "這個難不倒妳。"],
  forgot:  ["沒關係，等一下它會再出現，再看一次就好。", "記不起來很正常，這張我等等再考妳。", "錯了才記得牢，下一次就會了！"],
  relearn: ["它又回來了！這次記得嗎？", "第二次見面，打個招呼吧～"],
  halfway: ["已經一半了，加油！", "過半囉，妳很穩！"],
  done:    ["今天完成！給自己拍拍手 👏", "太棒了，今天的單字都收進腦袋了！"],
  medal:   ["哇！解鎖新獎章：{medal}！", "恭喜！{medal} 達成，我們離 A2 又近一步了！"],
  pause:   ["休息一下，喝口水～", "好，暫停。準備好再繼續。"],
  quit:    ["今天先到這裡？沒關係，明天見！", "下次記得把今天的份量刷完喔～"],
  extra:   ["加練時間！今天的字再刷一輪，越刷越順～", "再來一輪？好認真！這輪只是加深印象，放輕鬆。"],
  extraDone: ["加練完成！今天的字又更熟一點了。", "多刷一輪，記憶更穩。明天見～"],
  pack:    ["第 {no} 包結業！這 7 天妳超認真的。", "第 {no} 包完成！看看妳這包又記住了多少字。"],
};
export const lobbyLine = st => {
  const pool = !st.sessions ? LOBBY.first : st.todayDone ? LOBBY.doneToday : st.gap >= 2 ? LOBBY.missedMany
    : st.gap === 1 ? LOBBY.missed1 : st.streak >= 2 ? LOBBY.streak : LOBBY.normal;
  return fill(pick(pool), st);
};
export const say = (event, vars = {}) => fill(pick(EVENTS[event] || [""]), vars);

export const MIA_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <path d="M6 64 C7 55 15 50 24 48.5 L40 48.5 C49 50 57 55 58 64 Z" fill="#7c4dff"/>
  <path d="M26 48.6 L32 57 L38 48.6 Z" fill="#ff6fa8"/>
  <path d="M27 43 L37 43 L37.6 50 C35 52 29 52 26.4 50 Z" fill="#e3a585"/>
  <path d="M24 48.5 L27.5 47.2 L32 57 L25.5 53.5 Z M40 48.5 L36.5 47.2 L32 57 L38.5 53.5 Z" fill="#9b7bff"/>
  <path d="M32 57 L32 64" stroke="#fff" stroke-width="1.1"/>
  <path d="M14 28 C13 16 21 7 32 7 C43 7 51 16 50 28 L50.6 42 C50.6 45.2 47.2 46.2 45 44.2 L44 36 L20 36 L19 44.2 C16.8 46.2 13.4 45.2 13.4 42 Z" fill="#2b1b14"/>
  <path d="M17 27 C17 15 24 9 32 9 C40 9 47 15 47 27 L47 34 C47 43 40 49.5 32 49.5 C24 49.5 17 43 17 34 Z" fill="#f4c4a4"/>
  <path d="M16 26 C15 13 23 6.5 32 6.5 C42 6.5 50 13 48.5 26 C46 20 42 17 37 16.5 C31 18 23 20 17 25 Z" fill="#2b1b14"/>
  <path d="M37.5 9.5 C42 10.5 45.5 13.5 47 17.5" stroke="#5a3a2a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M21 26.8 C23.5 25.3 27 25.3 29 26.5 M35 26.5 C37 25.3 40.5 25.3 43 26.8" stroke="#2b1b14" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <ellipse cx="25" cy="31.2" rx="2" ry="2.5" fill="#2a1712"/><ellipse cx="39" cy="31.2" rx="2" ry="2.5" fill="#2a1712"/>
  <circle cx="25.7" cy="30.2" r=".75" fill="#fff"/><circle cx="39.7" cy="30.2" r=".75" fill="#fff"/>
  <path d="M22.6 29.6 L21.4 28.6 M41.4 29.6 L42.6 28.6" stroke="#2a1712" stroke-width="1.1" stroke-linecap="round"/>
  <circle cx="22" cy="37" r="2.6" fill="#ff8fb1" opacity=".5"/><circle cx="42" cy="37" r="2.6" fill="#ff8fb1" opacity=".5"/>
  <path d="M32 31.5 L31 36 C31.8 37.1 33 37.1 33.6 36.3" stroke="#c98a6b" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <path d="M26.5 40 C28.5 44.8 35.5 44.8 37.5 40 C35 41 29 41 26.5 40 Z" fill="#fff" stroke="#b8325a" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M19.5 50.5 C22 57.5 42 57.5 44.5 50.5" stroke="#2f2f3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <rect x="15.5" y="46.5" width="6.5" height="8.5" rx="2.6" fill="#14b8a6" stroke="#0f766e" stroke-width=".9"/>
  <rect x="42" y="46.5" width="6.5" height="8.5" rx="2.6" fill="#14b8a6" stroke="#0f766e" stroke-width=".9"/>
</svg>`;
