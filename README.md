# Word Gym 單字健身房（手機版）

A1 → A2 單字卡：看英文 → 想中文 → 點卡片翻面 → 熟／不熟。間隔複習（休息 1、2、4、7、15、30 天），6 個不同的日子都熟才進入長期記憶。

**打開：** https://amazineguy-dotcom.github.io/word-gym-mobile/

## 第一次用
- **iPhone**：用 Safari 打開 → 下方「分享」→「加入主畫面」。一定要加，不然 Safari 一段時間沒用可能會清掉進度。
- **Android**：用 Chrome 打開，畫面上會出現「加到主畫面」按鈕（或從選單選「安裝應用程式」）。

## 要知道的
- 進度只存在這支手機的瀏覽器裡，跟電腦版分開。換手機、清除瀏覽器資料，進度會重來。
- 教練的聲音是事先錄好的 Ava（`audio/w/<id>.mp3` 單字、`audio/e/<id>.mp3` 例句）。聽過的會存在手機裡，沒網路也能播；沒聽過又沒網路時，改用手機內建的聲音。

## 檔案
- `index.html`、`app.js`：畫面與練習流程（從桌面版 `word-gym` 改成不需要伺服器）
- `srs.js`（間隔複習）、`coach.js`（Mia 教練）、`figure.js`（卡通健身女孩）：跟桌面版相同
- `words.json`：1,469 個單字
- `sw.js`、`manifest.webmanifest`、`icons/`：加到主畫面與離線使用
- `tools/make_audio.py`：重錄音檔（用桌面版的 Python：`..\word-gym\.venv\Scripts\python.exe tools\make_audio.py`，已存在的會跳過）
- `version.js`、`CHANGELOG.md`：版號與更新紀錄
