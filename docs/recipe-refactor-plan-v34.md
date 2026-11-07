# 重構計畫：AI 娘優先 × 高自由度配方系統

> 版本：v34（2026-11-08）｜狀態：Phase A/B/C 完成並部署公網；**三視圖開關＝拼圖時拼不拼入三視圖**（characters「選中三視圖」對應 ON、卡片預覽三視圖永遠顯示、OFF 側/背灰度 ON 三張清楚）；髮型固有（发丝与呆毛）＝固有＋可選開關（同翼）已實作並修復本地「不生效」（根因＝dev 資料檔 1 小時快取）；換綁新 Cloudflare 帳戶部署新網址、README 演示地址對應倉庫用戶名；`tsc -b`/`oxlint`/`vite build` 全綠；[60] 遷移後啟動自癒（server/control bat 零絕對路徑＋自動重灌依賴）；[61] sujmao 鏡像網頁待恢復/重定向（§18）
> 範圍：`ai-chan-pose-gallery`（fork 自 `anhao/ai-pose-gallery-zh`，已部署 `ai-chan-pose-gallery.ferngherng-lab.workers.dev`）

> **路徑約定（相對路徑，遷移工作空間後仍成立）**：本計劃書**不含任何絕對路徑**，全部使用相對路徑，共兩種基準——
> - **代碼檔**（`src/`、`scripts/`、`data/`、`img/`、`docs/`、`vite.config.ts`、`README.md` 等）皆相對「**代碼倉庫根目錄**」；
> - **工作目錄檔**（憑證、`ai-chan-sheets/`、`out/aichan/`、`meta_appinn/`、`WORKSPACE.md` 等）皆相對「**工作目錄**」（本計劃書所在目錄）。
>
> 兩目錄的結構與對應關係見同目錄 `WORKSPACE.md`。遷移時只需保持兩目錄各自的**內部相對結構**不變，本計劃書所有路徑即自動成立。

---

## 0. 收斂歷程

- v1 任意 N 槽 → v2 歸併三塊 → v3 部位＋覆蓋 → v4 槽位概念 → v5 頭部上/下分類 → v6 肉體/外在 → v7 aichan 服飾>原版。
- **v8（定案）**：**停用一切槽位數量限制**（上裝可同時多件＝疊加/層次）；分類沿用「肉體/外在」；關係模型簡化為**兩種情況：疊加／部分替換**（針對服飾與形象）；**充分借鑑原版**（服飾＝參考圖＋完整提示詞，靠提示詞語義解決配飾組合）。
- **v9（定案）**：三塊內部增加**子欄位（subfield）**——形象（基礎形象/表情/髮型）、服飾（上裝/下裝/其他配飾）；各子欄位選好元素→整塊拼合為一張參考圖，使拼圖與原版參考圖同構，提示詞可借鑑原版逐件列出。
- **v10（定案）**：**退出策略**——UI 預設完全保留原版三元素邏輯，用一個開關展開子欄位；新能力為「疊加」非「替換」，開關關閉時現有功能零缺失。aichan `服装名称`＋參考圖已足以說明內容，無需補 `关键词`。
- **v11（待審批）**：**聚焦「aichan 換裝」單一核心**。新增語義軸「**固有部分**（耳/角/尾/翼等身體屬性，隨主體成套出現、不可換）vs **裝飾部分**（服飾配件，可換）」；兩種模式——**內部替換**（換其他 aichan 的裝飾，可全部/部分/留空）與**絕對替換**（清空裝飾、服從原版成套服飾）；**擱置** aichan 裝飾＋原版裝飾疊加。
- **v12（待審批，補充 v11）**：內部替換**不限單一來源 B**——主體 A 固定下可 B/C/D… 多角色裝飾**自由混搭**，可引入原版**隨機**（唯主體 A 不可隨機）；裝飾按語義類別**有序排列**（服裝優先、從上到下）；邊界案例定案——蝙蝠翼飘带＝固有、鲸鱼帽喷水与尾鳍＝裝飾（不拆）。
- **v13（待審批，補充 v12）**：裝飾槽位用「**配飾最多角色設骨架＋語義對等對齊**」建構——先取配飾最多的角色（現況 `Q版冬裝`）自上而下設槽位，其餘角色依語義把裝飾對應到槽位（可留空），處理多上裝/無下裝；完成後即進 Phase C UI 實作。
- **v14（定案）**：**翼可選不做否定強調**——UI 不勾選翼時，參考圖即無翼，提示詞**完全不提及**（不寫「不畫翅膀」）。翼為**全局單一可選固有槽**：內部替換 A→B 時若不選來源的翼，主體 A 的翼也自動不選。此後**開始實作 Phase A2 + Phase C**。
- **v15（定案）**：**簡易換裝**快捷路徑——直接選主體正面圖/三视图＋原版服飾直接替換；**固有（耳/尾/翼）渲染進形象參考圖**——耳/尾不可缺失（形象圖＋提示詞都要出現）、翼可選；此場景提示詞/UI 單獨處理，形象塊「角色本體特徵」子句強調固有。
- **v16（定案）**：米字瞳眼部细节＝固有（面部特徵）；**表情選擇器**——選定主體後可精確選表情、提示詞補充；**本地控制 bat**（`server.bat` 已有＋`control.bat` 新增）用於快速測試迭代，公網發布在後。
- **v17（定案，[16]）**：**換裝 UI 強化**——(1) 一鍵「A 主體＋B 全套裝飾」：動作列選角色 B/C/D…即套用其全套裝飾（主體固有仍為 A）；(2) 一鍵清空全部裝飾（破壞性按鈕醒目）；(3) **任何選擇都要有預覽圖**：主體卡片、三视图、固有件、表情、14 槽位裝飾、添加配飾彈窗全部顯示**縮略圖**（用 `缩略图` webp 縮小顯示，遵循原版缩略图原则——清單用缩略图、原圖留給詳情/生成）。
- **v18（定案，[17]）**：**角色頁品牌分類＋換裝頁緊湊佈局**——(1) `AI 娘角色` 頁藥丸由「三视图/表情」改為**品牌**分類（載入 `aichan-characters` 建立「角色 key→品牌」映射，藥丸＝品牌＋數量）；(2) `aichan 換裝` 編輯頁重排為**緊湊橫向、不留白**：頂部工具欄（一鍵 A＋B 全套、隨機、還原本體、一鍵清空、生成）＋「主體」橫排單塊（三视图/固有/翼/表情並排）＋「裝飾」14 槽位橫排緊湊（縮略圖＋編號＋「＋/清空」圓鈕）。
- **v19（定案，[17] 續）**：**角色頁「開始換裝」入口**——`AI 娘角色` 詳情彈窗加「以此角色開始換裝」，跳轉 `/dressup?subject=<角色key>`；`/dressup` 以 `validateSearch` 接收 `subject` 並於掛載時自動選定主體一次（`useRef` 防重複、不覆蓋已選主體）。
- **v20（定案，[18]）**：**縮圖放大＋文字放圖下＋選主體去品牌換行＋更換按鈕明顯化**——(1) 編輯頁縮略圖放大（固有/裝飾 `w-28`、三视图/表情 `w-24`），文字統一放縮圖下方；(2) 選主體畫面改為**單一連續網格**（不再按品牌分區換行，品牌以小角標留於卡片，減少留白）；(3) 「更換」改為「更換主體」outline 按鈕更明顯。
- **v21（定案，[19]）**：**表情收合＋三视图自適應尺寸**——表情區默認收合（點「表情（N）」展開/收起）；表情關閉時三视图放大到 gallery 尺寸（`w-40`），展開時縮回 `w-24`，兼顧留白與閱讀。
- **v22（定案，[20]）**：**表情收合 checkbox＋拼圖/提示詞/工程核驗**——(1) 表情收合改用視覺明顯的 `Switch` checkbox；(2) 核驗 Phase C 生成路徑：`buildDressupPrompt`（固有強調＋表情＋自上而下槽位描述）與 `resolveDressupRecipe`→`resolveDressupPortraitImage`/`resolveDressupCostumeImage`→`stitchCards` 端到端正確；**修復缺陷**：`stitchRecipeCanvas` 原僅解析 subfield、未解析 dressup，導致「已合成參考拼圖」預覽與拼圖彈窗對換裝配方失效——現依 `recipe.dressup` 分流 `resolveDressupRecipe`；(3) `tsc -b`、`oxlint`、`vite build` 全綠。
- **v23（定案，[21]）**：**底部浮動 dock 換裝化（拼圖＋提示詞＋隨機合併）**——全局 `RecipeDock` 於 `/dressup` 且有 `recipe.dressup` 時切換為換裝模式：三槽改為「主體（固有小注＋更換主體）／裝飾（已選 N 件＋前 3 件名＋一鍵清空）／姿勢（沿用原版 pose，供後續簡易換裝組合）」，操作列改為「隨機（換裝裝飾，合併自原版隨機）／拼圖（`refreshStitchPreview` 合成參考拼圖、顯示於頁面預覽區）／提示詞（Dialog 預覽換裝提示詞＋複製＋跳轉合成台）」，「合成 (N)」跳轉合成台沿用；dressup 頁預覽區改名「預覽（拼圖／生成結果）」並加關閉鈕。底部隨機不再走原版 `randomizeRecipe`。
- **v24（定案，[22]）**：**換裝 dock 與原版互斥同等優先＋拼圖改田字格＋三圖分開進合成台**——(1) `RecipeDock.isDressup` 改為 `Boolean(recipe.dressup)`（移除 `pathname.startsWith('/dressup')` 門檻），換裝與原版完全互斥、同等優先、所在頁面無關；操作列還原為與原版一致的「隨機（換裝裝飾）／複製詞／合成 (N)」三鍵，移除拼圖/提示詞按鈕與提示詞 Dialog；dressup 頁預覽區還原為「生成結果（僅 API 預覽）」並移除關閉鈕與 `setPreviewUrl`；(2) `stitchCards` 由橫排扁圖改為**田字格近正方形網格**（`cols = ceil(sqrt(n))`），保留更多單圖細節以利生圖模型下採樣；(3) **重大修正**：換裝拼圖結果不再污染「生成結果」——store 新增 `resolvedDressup`（`resolveDressupImages` 自動把換裝解析成「形象圖/服飾圖」兩張複合參考圖，`useEffect` 於 `[recipe.dressup, useSubfields]` 觸發），合成台「1. 参考图组合」在 `recipe.dressup` 存在時改顯示「形象／服飾／姿勢」三張分開的參考圖（各帶「調整」回 `/dressup` 深鏈），「生成結果」僅保留 API 生成預覽；`tsc -b`/`oxlint`/`vite build` 全綠。
- **v25（定案，[23]）**：**拼圖 cell 貼合長寬比＋標籤字級放大＋服飾縮圖修正＋下載統一命名**——(1) `stitchCards` cell 尺寸由固定 480×640 改為依「實際圖片中位長寬比」（clamp 0.6–1.4）決定共用 cell：所有元素仍**等大（uniform grid）**以利模型解析為 N 張獨立參考圖，同時貼近真實長寬比減少 letterbox 留白、**不裁切內容**（避免切掉髮尾/翼/尾）；(2) 標籤文字放大（tag 12→14px、sub 15→20px、headH 62→78），新增 `fitText` 依 `measureText` 超長「…」截斷；文字定位＝**供人校對**（圖像模型不語義讀字，語義由提示詞承載）；(3) **修 `resolveDressupCostumeImage` 缺 `缩略图: src`**：服飾縮圖從「只顯示拼圖首元素」改為完整拼圖（與形象一致）；(4) 放大預覽下載命名：`ImageViewer` 加 `downloadName`，合成台 zoom 統一走 `openZoom(url,{filename,title})`，命名 `{時間戳}_{形象/服飾/姿勢/人像/服裝}_{具體名稱}.{ext}`（形象名＝主體＋表情＋固有串接、服飾名＝各裝飾串接、姿勢名＝姿勢名·角度），生成結果/歷史亦納入 `生成結果` 命名；`tsc -b`/`oxlint`/`vite build` 全綠。
- **v27（規劃，[26] 續）**：**絕對替換／簡易換裝**細部設計——在既有 `DressupState.mode`（`'internal'|'absolute'|'simple'`）基礎上，明確三種模式的資料流、UI 切換、提示詞差異與實作順序；不改動內部替換已穩定運作的邏輯。
- **v30（定案，[50]）**：**髮型固有（发丝与呆毛）＝固有＋可選開關（同翼）**。5 件「发丝与呆毛／发丝与发型形态／背后环形编发」（slot=None、原為孤兒）依用戶判斷屬固有，比照翼設「髮」開關：`aichan-inherent.json` 五角色（02/03/10/11/16）增 `hair`；`DressupState` 增 `hair/hairOn`；`buildInitialDressup`/`subjectDecorations`/`decorationPool` 排除髮型固有；`buildDressupPrompt`/`resolveDressupPortraitImage` 的 `fixed` 併入髮型；`classifyBodyFeature` 增「发丝/呆毛/发型/编发→发型」；換裝頁固有列加「髮」Switch＋縮圖、角色網格加「髮可選」徽章；`studio.tsx` 下載名併入髮型；`studioStore` 增 `normalizeDressup`（舊配方缺 hair 補齊）。另：免責聲明移除「胖次狐」（ZipZipPipe 無中文名）；README 重寫、存疑清單置首；**部署以 `scripts/build.sh` 完整產出再 `wrangler deploy`（修正「直接報錯」根因＝`pnpm build` 清空 dist 漏掉 data/thumbs/img）**。
- **v31（定案，[51]）**：**修復髮型固有開關「本地不生效」＋換綁新帳戶部署**。(1) 根因：`vite.config.ts` 的 `localAssetsAndProxyPlugin` 對 `data/*.json` 設 `Cache-Control: max-age=3600`，且資料檔不在 Vite 模組圖內（改動不觸發 HMR），瀏覽器沿用舊 JSON 達 1 小時 → `hair` 不生效；改 `.json/.csv` 回 `no-store`（圖片保留長快取）。(2) 換綁新 Cloudflare 帳戶（憑證檔見 `WORKSPACE.md`「憑證」節）：先經 API 註冊 workers.dev 子網域 `ferngherng-lab`（＝倉庫用戶名），再 `wrangler deploy` 至 `ai-chan-pose-gallery.ferngherng-lab.workers.dev`；README 演示地址對應倉庫用戶名。
- **v32（定案，[56]）**：**三視圖/表情開關統一進「一鍵換裝」工具欄，修復「選三視圖後換裝一有改動即解除鎖定」**。`DressupState` 增 `threeViewOn`（三視圖鎖定：true＝用所選視角含側/背，false＝只用正面）與 `expressionOn`（表情開關）；`buildInitialDressup` 預設 `threeViewOn=true`/`expressionOn=true`（接受 `opts.threeViewOn` 覆寫）；`normalizeDressup` 舊配方補齊兩欄；`buildDressupPrompt`/`resolveDressupPortraitImage` 於 `expressionOn=false` 時不提/不拼表情；換裝頁把「翅膀/頭髮/三視圖/表情」四個 Switch 統一收進「一鍵換裝：A 主體 + B 全套裝飾」工具欄（原翼/髮 Switch 自固有列移除、固有列保留縮圖；三视图列與表情列分別以 `threeViewOn`/`expressionOn` 閘控），切「三視圖」關時強制回正面、切「表情」關時清空表情；`tsc -b`/`oxlint`/`vite build` 全綠、部署新網址。
- **v33（定案，[57][58]）**：**三視圖開關語義修正＝拼圖時拼不拼入三視圖（非卡片預覽開關）**。(1) `threeViewOn` 改為「拼圖時是否拼入三視圖」：ON＝`resolveDressupPortraitImage` 拼入正面/側面/背面三張（`threeViews` 依 `viewOrder` 排序、標籤「正面/側面/背面」），OFF＝只拼所選單圖（預設正面）；預設改 `false`（等同舊行為＝正面單圖）。(2) `DressupState` 增 `threeViews`（角色三視圖陣列）：`buildInitialDressup` 填入、`normalizeDressup` 舊配方補 `[]`。(3) characters 頁「選中三視圖」＝`recipe.portrait.sheet===true`；`selectSubject` 據 `recipe.portrait.角色===key && sheet` 把 `threeViewOn` 設 true（兩處共用同一內部設定）。(4) 卡片預覽三視圖**永遠顯示**（移除 `threeViewOn &&` 閘控）；OFF 時側/背灰度（`SelectThumb.dim=true`＝現況 `opacity-70`）、ON 時三張清楚（`dim=false`）。`tsc -b`/`oxlint`/`vite build` 全綠、部署新網址。
- **v34（定案，[60][61]）**：**工作空間遷移後的啟動自癒＋sujmao 鏡像網頁恢復/重定向**。(1) [60] 遷移工作空間（換磁碟、任意 Windows 環境）後 `server.bat`/`control.bat` 無法啟動——根因＝整包複製的 `node_modules` 失去 pnpm symlink（頂層套件資料夾變空、`.pnpm/` 內容完好、`vite/bin/vite.js` 缺失）；修法＝重灌依賴＋改寫兩支 bat 為**自癒、零絕對路徑**：`cd /d "%~dp0"`；偵測 node/pnpm；以 `node_modules\vite\bin\vite.js` 為哨兵，缺失即自動 `rmdir /s /q node_modules`＋`pnpm install --frozen-lockfile`（失敗降級 `pnpm install`）；`control.bat` 由 `npx` 改 `pnpm exec`；新增 `deps` 子命令。此後複製到任意 Windows 環境即可用。(2) [61] 新增待辦操作（§18）：`sujmao` 帳戶網頁原為上游 `ai-pose-gallery.anhao.app` 鏡像、被當前網站中間版本污染，需恢復或重定向。

---

## 1. 目標（抽象到邏輯層）

### 1.1 三塊規範模型（不變）

對外永遠三塊〔形象 · 服裝 · 姿勢〕，每塊 resolve 為**一張**參考圖（複合來源走拼合）。

每塊內部以**子欄位（subfield）**組織元素，各欄位選好元素後**整塊拼合為一張參考圖**：

- **形象**：基礎形象（錨點）＋表情＋髮型
- **服飾**：上裝＋下裝＋其他配飾（鞋/帽/飾品…）

拼出的參考圖與原版參考圖同構（成套集合圖），故語義清晰、提示詞可逐件列出。

### 1.2 分類原則（v6 定案，v8 沿用）

> **表情＋頭髮＝肉體 → 形象（人像塊）。其他一切外在部分（帽/耳/角/耳墜/眼罩/頭飾/髮飾/尾/翼/鞋/襪/頸飾/腕飾/手持…）→ 服飾（服裝塊）。**
> v8 起：**停用槽位數量限制**——上裝/下裝/其他皆可多選，依序排列（疊加/層次）。

### 1.2b 關係模型：兩種情況（v8 定案）

| 情況 | 語義 | 適用 |
|------|------|------|
| **疊加** | 增加新元素，不取代既有（耳墜/項鏈/手持/尾/翼/髮飾…；多件上裝＝層次） | 服飾內、形象內（頭髮本體多選） |
| **部分替換** | 以高優先級件取代錨點的對應部位 | 見下兩組 |

**部分替換分兩組：**

1. **形象＝錨點，服飾＝更高優先級**，服飾部分替換形象的元素（衣蓋身、裙蓋腿、帽蓋髮、鞋蓋足）。→ **技術聚焦，原版已做得好。**
2. **形象內部／服飾內部**的部分替換（改髮保臉、aichan 上裝換原版上裝）。→ **暫擱置，開放討論。**

### 1.3 硬需求（v8 定案）

1. 三视图默認選 1，一鍵選 3（選 3 → 拼 1 張）。
2. 拼合必要且自動，一次性提示。
3. 分類「肉體(表情+頭髮)→形象，一切外在→服飾」。
4. **停用槽位數量限制**：服飾/形象內各部位多選，有序，體現疊加層次。
5. **關係＝疊加／部分替換**；部分替換聚焦「形象錨點＋服飾高優先級」。
6. **借鑑原版**：服飾＝參考圖＋完整提示詞（`服装名称`+`标签`+`关键词`），靠提示詞語義解決配飾組合。
7. **子欄位**：形象（基礎/表情/髮型）、服飾（上裝/下裝/其他配飾），各欄位選好元素→整塊拼合為一張參考圖。

### 1.4 退出策略（v10 定案）

> **UI 預設完全保留原版三元素選擇邏輯（人像/服裝/姿勢），用一個開關展開子欄位精細化選項。技術上保證：開關關閉時現有功能零缺失。新能力一律「疊加」，永不「替換」現有路徑。永遠假定計畫未必順利。**

- 舊 `RecipeState { portrait, costume, pose }` 三槽不動；子欄位作為**可選進階層**，由 `useSubfields` 開關控制。
- 開關 OFF → 走現有收圖/提示詞/生成（行為逐字不變）。
- 開關 ON → 走子欄位拼合（形象/服飾各拼一張，姿勢單件）。

---

## 2. 現狀盤點（已核對原始碼與資料）

- `aichan-costume-zh.json` 198 件（服裝72/道具126），逐件原子化。
- **原版 `costume-zh.json` 每件＝成套**：`服装名称`＝完整逐件描述，`标签`＝部位/材質/色標籤，`关键词`＝英文關鍵詞 → 即「完整提示詞」。
- **aichan 配飾對比**：`服装名称` 已含充分描述（如「白色多层百褶长裙（像素十字纹+几何纹样）」），搭配實際上傳的參考圖，內容無歧義；`关键词` 雖空，**無需補齊**（v10 定案）。
- 頭髮本體＝`发丝与呆毛`(×3)、`发丝与发型形态`、`背后环形编发`（5 件）→ 形象。
- 表情＝`aichan-portrait-zh.json` `分区=表情`（144）→ 形象（人像塊子元素）。
- 既有「参考图拼合卡片」`stitchRecipeCanvas()`；ComfyUI 3 節點；非 ComfyUI N 圖。
- `品牌` 在 characters 檔（13 品牌）；三视图 16 角色×3 + DeepSeek Q版冬裝第二套。
- **Phase A 分類已產出**：`aichan-costume-zones.json`（198 件 region/zones）、存疑 12（連身2＋頭部動物耳角10）。

---

## 3. 資料模型設計

### 3.1 分類（資料層，Phase A 已完成）

```ts
export type AssetRegion = '形象' | '服飾'          // 肉體 / 外在
export type CostumeZone = '上裝' | '下裝' | '其他'   // 部位標籤（非互斥，v8）
export type CostumeZones = CostumeZone[]
```

- 映射檔 `data/aichan-costume-zones.json`：`{ [id]: { region, zones } }`。
- v8 語意：zones 不再表示「互斥槽位」，而是**部位標籤**（上裝/下裝/其他），供 UI 分組與提示詞「覆蓋/疊加」措辭用。**無數量限制**。

### 3.2 三塊結構（v9：子欄位＋有序清單，無互斥）

```ts
// 形象塊：基礎形象＝錨點；表情＝強調；髮型＝多選疊加
export type PortraitBlock =
  | { mode: 'legacy'; item: PortraitItem }
  | { mode: 'aichan'; item: PortraitItem; expression?: PortraitItem }
  | { mode: 'aichan-turnaround'; views: PortraitItem[]; expression?: PortraitItem }
  & { hair: CostumeItem[]; keepOwnAccessories: boolean }

export interface CostumePiece {
  item: CostumeItem
  region: AssetRegion        // 服飾（外在）
  zones: CostumeZones        // 部位標籤（上裝/下裝/其他）
}

// 服飾塊：子欄位，各欄位多選、有序（疊加/層次）
export interface CostumeBlock {
  top: CostumePiece[]        // 上裝
  bottom: CostumePiece[]     // 下裝
  extras: CostumePiece[]     // 其他配飾（鞋/帽/飾品/尾/翼/手持…）
}

export interface PoseBlock { item: PoseItem | null }

export interface RecipeState {
  portrait: PortraitBlock | null
  costume: CostumeBlock
  pose: PoseBlock
  workflowImages?: Record<string, ExtraReferenceImage>
  workflowImagesIdentity?: string
  extraImages?: ExtraReferenceImage[]
}
```

> 各子欄位選好元素後，整塊拼合為一張參考圖（形象→图1，服飾→图2），與原版成套集合圖同構。

### 3.3 關係與數量（v8）

- **無槽位互斥**：服飾塊與形象塊內各部位皆可多選，依序（疊加/層次）。
- **兩種情況**：疊加（不覆蓋，追加）／部分替換（覆蓋錨點對應部位）。
- 部分替換聚焦「形象＝錨點，服飾＝更高優先級」；形象/服飾內部部分替換暫擱置。

### 3.4 三视图群組 + 品牌 join

（`TurnaroundGroup`；品牌附欄位；藥丸＝`全部`＋13 品牌。）

---

## 4. 提示詞公式化（借鑑原版）

三塊對應 图1/图2/图3（空塊跳號）；**所有圖片引用一律數字序號**。

| 塊 | 子句（示意） |
|----|--------------|
| 形象（錨點） | 以图1中角色为原型，保持脸型/五官/发型/发色/肤色一致（角色：…；表情：…；髮型：…）。图1 只確定角色本體（肉體）。 |
| 服飾（高優先級，部分替換） | 穿上图2所示服飾，逐件列出（`服装名称`…），覆蓋對應身體部位。图2 為已拼合服飾集合。 |
| 疊加件 | 於上追加配飾（耳墜/項鏈/手持/尾/翼/髮飾…），與既有不衝突。 |
| 姿勢 | 按图3中人体模型动作与镜头角度摆姿势；图3 只是动作示意。 |

- 修復「圖一人物部分服飾缺失」：有服裝塊→服裝由图2指定；無服裝塊→「若图1中可见服装，则尽量保留」。
- 保留 SFW／白模／`isPhoto`／`faceless` 分支。
- aichan 提示詞片段：直接以 `服装名称` 為片段（名稱＋參考圖已足，無需補 `关键词`）。

---

## 5. 生成接口（維持 3 圖）

- 三塊 → 3 張參考圖；複合塊經 `stitchRecipeCanvas` 拼單張。ComfyUI 3 節點＋`stitchedNodeId`；非 ComfyUI 3 圖直傳（+`extraImages`）。

---

## 6. UI 重構（v10）

- **退出策略開關**：預設＝原版三元素選擇；一個開關展開子欄位精細化選項（開關 OFF 現有功能零缺失）。
- 側邊欄下級菜單＋頁內藥丸並用。
- characters：品牌藥丸＋三视图 1/3＋表情強調；outfits：**子欄位（上裝/下裝/其他配飾）各多選＋排序（疊加層次）**，標註「疊加件／覆蓋件」。
- studio：三塊卡（形象/服飾/姿勢）；每塊內以**子欄位**選元素（形象＝基礎/表情/髮型；服飾＝上裝/下裝/其他配飾），選完自動拼合為該塊參考圖。
- **疊加／部分替換在 UI 中體現**：覆蓋件（上裝/下裝/鞋/帽）標「覆蓋」，疊加件標「疊加」。

---

## 7. 遷移與相容（`v3 → v4`）

**退出策略**：`RECIPE_KEY` 不破壞舊三槽；舊 `RecipeState { portrait, costume, pose }` 原樣保留，子欄位作為進階層（`useSubfields` 開關）並存。開關 OFF 走舊收圖/提示詞/生成；ON 走子欄位拼合。store 對外新增 `toggleSubfields`/`setPortraitBlock`/`addCostumePiece`/`removeCostumePiece`/`reorderCostumePieces`/`setPoseBlock`/`setKeepOwnAccessories`。

---

## 8. 分階段實作

| Phase | 內容 | 風險 |
|-------|------|------|
| **A 資料與類型層** ✅ | 肉體/外在分類、品牌 join、三视图分組 helper、型別 | 低 |
| **A2 固有/裝飾再分類** ⏳ | 服飾項逐角色標「固有（耳/角/尾/翼）」vs「裝飾」，產 per-character 固有清單 | 中 |
| **B 三塊核心重構** ✅ | 保留舊三槽＋新增子欄位（`useSubfields` 開關）、store、提示詞、收圖、遷移 | 高 |
| **C 換裝 UI** ⏳ | 主體 aichan 錨點＋內部/絕對替換＋固有展示＋留空規則 | 中 |
| **D 生成增強** ⏳ | 複合塊拼合橋接、提示詞細調（固有保留強調＋疊加/覆蓋措辭） | 中 |
| **E 收尾** ⏳ | 文案、歷史/快照相容、回歸、存疑清單進 README＋網站徵求、部署 | 低 |

### 8b. Phase B 實作進度（2026-11-07）

- **B1（型別/store）✅**：`gallery.ts` 新增 `AssetRegion`/`CostumeZone`/`CostumePiece`/`CostumeBlock`/`PortraitBlock`，`RecipeState` 增加可選 `advancedPortrait?`/`advancedCostume?`；`studioStore` 增加 `SUBFIELDS_KEY`、`useSubfields` 狀態＋持久化、`toggleSubfields`、`setAdvancedPortrait`/`setAdvancedCostume`（局部合併），restore（localStorage＋IndexedDB）、`clearRecipe`、`recipeBackup` 均保留子欄位。
- **B2（解析器/提示詞/收圖）✅**（`aiGenerator.ts`）：
  - `hasAdvancedPortrait`/`hasAdvancedCostume`/`hasAdvancedBlocks` 判定子欄位有無內容。
  - `resolveSubfieldRecipe(recipe)`：把 `advancedPortrait`（基礎＋表情＋髮型）與 `advancedCostume`（上裝＋下裝＋其他）各自拼合為**一張**參考圖，回傳合成後的三槽 `RecipeState`（拼合用抽取出的 `stitchCards`/`buildRecipeCardList`）。
  - `buildRecipePrompt(recipe, stylePreset, workflowImages, useSubfields=false)`：開關 ON 且有子欄位時走 `buildSubfieldPrompt`（形象＝錨點＋逐項標「基礎/表情/髮型」；服飾＝逐件列 `服装名称`＋覆蓋部位「上裝/下裝」＋疊加配飾「其他」），否則走原 `buildLegacyPrompt`（**逐字不變**）。
  - 收圖 `startGeneration` 在開關 ON 時先 `resolveSubfieldRecipe` 得到有效配方，提示詞用原始配方、生成圖用有效配方；`stitchRecipeCanvas`/`generateCharacterImage` 額外接受 `useSubfields`，開關 OFF 全程走舊路徑（**零缺失**）。
- 驗證：`npx tsc -b`＝0、`npx oxlint src`＝0、`npm run build`＝0。

---

## 9. 風險與取捨

1. **疊加／部分替換**：疊加＝追加不衝突；部分替換＝形象錨點＋服飾高優先級（覆蓋部位）。形象/服飾**內部**部分替換（改髮保臉、aichan 上裝換原版上裝）**暫擱置**，開放討論；可建立「AI 圖片生成細節模板通用規範」。
2. 分類成本：198 件已分類；存疑 12＝連身2＋頭部動物耳角10（暫歸服飾·其他）。
3. 拼合清晰度：多件拼單圖細節下降 → UI 拼合預覽。
4. 服飾缺失根因：已修復（服裝塊接管＋可見限定）。
5. 提示詞片段：aichan `关键词` 空 → 直接以 `服装名称`＋參考圖為片段（名稱已充分說明，無歧義），不補。
6. 三视图第二套：分組含組前綴；遷移舊配方無損轉三塊。
7. 退出策略：新能力＝疊加非替換；開關 OFF 現有功能零缺失，避免計畫受阻時退不回去。
8. **換裝固有判定（v11）**：非人形耳/角/尾/翼須在提示詞強保留；不同角色固有槽位種類/數量不一（多數角色某槽位留空），需精確語義分類＋逐角色複審。

---

## 10. 已定案（無待辦）

1. 分類原則「肉體(表情+頭髮)→形象，一切外在→服飾」→ 定案。
2. 髮上飾品、尾/翼 → 服飾；僅耳/角頭部動物特徵存疑 → 定案。
3. **停用槽位數量限制**（各部位多選，疊加層次）→ 定案。
4. **關係＝疊加／部分替換**（針對服飾與形象）→ 定案。
5. **部分替換聚焦「形象錨點＋服飾高優先級」；形象/服飾內部部分替換 → 暫擱置** → 定案。
6. **借鑑原版**（服飾＝參考圖＋完整提示詞）→ 定案。
7. Phase A 分類完成；下一步：Phase B/C 核心重構＋UI 構建。
8. **aichan 配飾名稱＋參考圖已足，無需補 `关键词`** → 定案。
9. **退出策略**（開關展開子欄位，舊三元素邏輯零缺失）→ 定案。

---

## 11. 聚焦 aichan 換裝（固有/裝飾 + 內部/絕對替換）

> 本節為 **v11–v14 設計（已審批，實作中）**。核心收斂：網站功能聚焦於「**為 aichan 換裝**」這一個點。

### 11.1 固有 vs 裝飾（新增語義軸）

在既有「肉體(表情+頭髮)→形象、一切外在→服飾」之上，於**服飾（外在）**內再切一條語義軸：

- **固有部分（inherent body parts）**：角色辨識所繫的動物身體屬性——**耳 / 角 / 尾 / 翼**（狐耳、鳍耳、猫耳、兔耳、龙角、龙尾、鲸鱼尾、龙翼、蝠翼…）＋**面部特徵**（瞳色/眼部，如米字瞳）。**隨主體 aichan 成套出現，永不被換掉。**
- **裝飾部分（swappable decorations）**：其餘服飾配件——衣/裙/鞋/襪/帽/飾品/手持…。**才是可換的對象。**

**固有判定方式**：per-character 人工精選清單（每角色約 2–4 件固有），以關鍵字（耳/角/尾/翼/鳍＋狐/猫/兔/龙/蝠/鲸鱼/鳞片）初篩、人工複審。產出 `data/aichan-inherent.json`：`{ [角色名]: { parts: string[]; optional?: string[] } }`。

**翼可選**：翅膀屬固有但**可不出現**（如白龙娘＝龙角＋龙尾＋龙翼(可選)），以 `optional` 標記，預設 ON、可關閉。

初篩候選（待人工複審；Phase A 存疑 10 件頭部動物耳/角即在此列）：

| 角色 | 固有候選（耳/角/尾/翼） |
|------|------|
| 阔耳狐娘 | 狐耳、狐尾 |
| 白龙娘 | 龙角、龙翼(可選)、龙尾 |
| 鲸鱼娘（含 Q版冬裝、Claude工牌工作服） | 鲸鱼鳍耳、鲸鱼尾 |
| Gemini娘 | 猫耳、猫尾 |
| 白紫龙娘（Q版） | 紫色龙角、淡紫小蝠翼(可選)、鳞片龙尾 |
| MiMo兔娘 | 兔耳（头箍）、白色圆兔尾 |
| LongCat娘（龙猫） | 绿白猫耳、黑绿猫尾 |
| Grok娘 | 蝙蝠翼飘带（=翼，固有） |

> 其餘角色（文心一言娘、豆包Seed娘、Qwen、Kimi、MiniMax、Claude娘）**無動物固有**（人形，僅髮型屬形象），固有槽位留空——即「各角色固有可缺」。
> 關鍵字初篩會 over-match：`耳`→耳坠/耳饰、`尾`→马尾（如 MiMo 的「橙黑双马尾发带」實為髮飾）。固有判定須以**精確動物部位詞**（狐耳/鳍耳/猫耳/兔耳/龙角/龙尾/鲸鱼尾/蝠翼/鳞片龙尾…）人工複審。

### 11.2 兩種換裝模式

| 模式 | 主體固有 | 裝飾來源 | 說明 |
|------|----------|----------|------|
| **內部替換** | 服從主體 A，不變 | 任意多個 aichan（B/C/D…）的裝飾 | 自由混搭（可全部/部分/留空），可隨機 |
| **絕對替換** | 服從主體 A，不變 | 原版成套服飾 | A 的裝飾**全部清空**，換上原版服裝 |

**內部替換的自由度（僅針對裝飾部分）**：
- **多來源混搭**：不限單一來源 B——可從多個 aichan（B、C、D…）各自挑裝飾，自由組合到主體 A 上（UI 要讓「A 換 B」成為最簡單的一步，但不設來源上限）。
- **全部/部分/留空**：可套用某角色全部裝飾、或逐件勾選；未指定部位保留 A 原裝飾；可刪除部分裝飾使某些**裝飾槽位留空**（僅限裝飾；固有槽位永不空，除可選翼）。
- **隨機**：可引入原版隨機功能（裝飾隨機）；**唯主體 A 不可隨機**。

**擱置（v11 不做）**：aichan 裝飾＋原版裝飾「**疊加**」——介面與邏輯複雜，暫緩。

### 11.3 UI 流程（主體 = 錨點）

1. **選主體 aichan**（形象錨點）：品牌藥丸 → 角色 → 三视图 1/3；帶出該角色**固有部分**（耳/角/尾/翼/面部特徵），標「隨主體固定、不可換」；可**精確選表情**（該角色的表情子集，進入形象塊 `expression`，提示詞補「表情：X」）。
2. **選換裝模式**：內部替換 / 絕對替換。
3. **內部替換**：裝飾來源**多選、可混搭**——可選任一 aichan（B/C/D…）逐件挑其裝飾（各來源固有不列入），全部套用 / 部分勾選 / 留空；提供「隨機」按鈕（僅隨機裝飾，主體 A 除外）。
4. **絕對替換**：選原版成套服飾 → 主體固有不變、裝飾全部服從該套。
5. 拼合預覽 + 生成。

### 11.4 提示詞調整

- **固有強調**：非人形耳/角/尾/翼**必須保留並強調**，如「保留[主體]的狐耳與狐尾，不得省略或人形化」。
- **翼可選（不做否定強調）**：UI 不勾選翼 → 參考圖即無翼 → 提示詞**完全不提及**；勾選翼才在固有子句提及「保留翅膀」。不寫「不畫翅膀」等否定句。
- 固有件抽離「覆蓋/疊加」措辭，改為「角色本體特徵」子句；僅裝飾件走既有覆蓋/疊加措辭。

### 11.5 資料工作（Phase A2，已完成）

1. ✅ 逐角色複審服飾項，標「固有」vs「裝飾」，產 `aichan-inherent.json`（17 角色、23 固有件；翼 `optional`）。
2. ✅ 固有＝耳/角/尾/翼＋**面部特徵（瞳/眼，如米字瞳）**；各角色固有可缺。
3. ✅ 邊界案例定案：蝙蝠翼飘带＝固有（翼）、鲸鱼帽喷水与尾鳍＝裝飾（整件不拆）、头箍耳＝固有、米字瞳眼部细节＝固有。
4. ✅ 裝飾槽位＝§11.7 方法，產 `aichan-slot-taxonomy.json`（14 槽位、170 件裝飾）。

### 11.6 與既有模型的關係（增量，非替換）

- 既有 `useSubfields` 三塊子欄位模型保留；v11 新增「固有/裝飾」標記（`CostumePiece` 增 `kind: '固有'|'裝飾'`）與「換裝」互動，不改舊三槽。
- 語義上「主體」＝形象（基礎＋表情＋髮型）＋固有件（耳/角/尾/翼）；「可換層」＝裝飾件。
- 退出策略不變：`useSubfields=false` 舊路徑逐字不變；換裝為開關 ON 後的新增能力。

### 11.7 槽位建構方法（v13：裝飾槽位與上下順序）

> 目標：把各角色種類/數量不一的裝飾，對齊到**一套統一、有序、可留空的槽位**，讓使用者直觀替換。

1. **槽位骨架**：取**裝飾件數最多的角色**，將其裝飾清單自上而下排列，作為初始槽位骨架；所有 aichan 預設都擁有這些槽位，未對應到的槽位**留空**。
   - 資料現況：`12_DeepSeek娘_Q版冬裝` 最多（22 件，因 Q版兩套服裝併於同一 `角色`；去重後約 15 種裝飾類型）；其餘角色多為 10–11 件。
2. **語義對等對齊**：綜合每個 aichan 的裝飾，依語義判斷每件的**上下位置**與**功能對等/相似關係**（如 A「上裝」↔ B「馬甲/外披/露脐上衣」；A「短靴」↔ B「高跟鞋/厚底鞋/玛丽珍鞋」）。原則：**同槽位＝功能對等，可直接互換**，讓使用者一看就懂「什麼可換什麼」。
3. **上/下裝不規則**：部分角色**多件上裝**（同一槽位多件、有序＝疊加層次）；部分角色**無下裝**（該槽位留空）。
4. **產出**：`data/aichan-slot-taxonomy.json`＝有序槽位清單（`slot: { id, label, order, 對等說明 }`）＋每角色裝飾→槽位映射（可空）。固有件（耳/角/尾/翼）**不參與槽位**，隨主體固定。
5. **完成後**：進入 **Phase C 換裝 UI** 實作。

### 11.8 簡易換裝 + 固有渲染進形象圖（v15）+ 表情選擇（v16）

- **簡易換裝（快捷路徑）**：直接選主體 aichan 的**正面圖/三视图**（形象）→ 選一件**原版服飾** → 直接替換（＝絕對替換最簡形式）。
- **固有渲染進形象圖**：主體固有（耳/尾/翼/面部特徵）須**單獨強調並出現在形象參考圖**（固有件拼入形象參考圖，或形象塊提示詞逐項列出），避免換上原版服飾後丟失動物/面部特徵。
  - **耳/尾/面部特徵**：**不可缺失**——形象參考圖與提示詞都要出現、強調。
  - **翼**：**可選**——不勾選即不出現、提示詞不提（v14 不做否定強調）。
- **表情選擇（v16）**：選定主體 aichan 後，可**精確選表情**（該角色的表情子集，來自 `aichan-portrait-zh.json` `分区=表情`）。表情進入形象塊 `expression`，提示詞形象子句補「表情：X」（既有 `buildSubfieldPrompt` 已接線，Phase C 只需補 UI）。
- **此場景提示詞/UI 單獨處理**：形象塊「角色本體特徵」子句強調「保留[主體]的[耳/尾]，不得省略」＋表情；翼只在勾選時提及。

## 12. Phase C 換裝 UI 實作計畫（2026-11-07）

> 資料已就緒（§11.5/§11.7），提示詞子欄位模型與表情接線已存在（Phase B）。以下為實作拆解，供審批後動工。

### 12.1 資料接線（`src/api/gallery.ts`）

- 新增 `aichanInherentQuery`（`/data/aichan-inherent.json`）→ `Record<角色key, { parts: string[]; optional: string[] }>`。
- 新增 `aichanSlotTaxonomyQuery`（`/data/aichan-slot-taxonomy.json`）→ `{ slots: {id,label,order}[]; mapping: Record<itemId, slotId> }`。
- 既有 `aichanCharactersQuery / aichanPortraitsQuery / aichanCostumesQuery` 已就緒；`PortraitItem.角色`、`CostumeItem.角色` 與 characters `key` 對齊（已核對）。
- 資料現況：17 角色；23 固有件（翼 `optional`）；14 槽位 × 169 裝飾；`aichan-costume-zones.json` 提供 `region(形象/服飾)`。

### 12.2 資料模型（`src/types/gallery.ts`）

- 沿用 §11.6：`CostumePiece` 增 `kind: '固有' | '裝飾'`。
- 新增換裝層，**編譯到既有 3 圖模型**（不新增生成路徑，退出策略不受影響）：

```ts
export type DressupMode = 'internal' | 'absolute' | 'simple'
export interface DressupState {
  subject: string                       // 主體角色 key（形象錨點）
  subjectViewId: string | null          // 主體三视图（正面/侧面/背面）
  expressionId: string | null           // 表情（該角色 分区=表情 子集）
  wingsOn: boolean                      // 翼可選（有翼角色預設 true；無翼角色不顯示）
  mode: DressupMode
  decorations: Record<string, string[]> // slotId → 裝飾 itemId[]（可空 / 可混搭多來源）
}
```

- `RecipeState` 增 `dressup?: DressupState | null`；`useSubfields=false` 舊路徑逐字不變。

### 12.3 換裝核心（新 `src/lib/dressup.ts`，純函數，可單元自測）

- `subjectInherent(key)` → 固有/可選件（inherent + costume 道具件）。
- `subjectDecorations(key)` → 該角色自身 14 槽位裝飾（slotId → item[]）。
- `decorationPool()` → 全角色裝飾按槽位歸併（slotId → {item, 來源角色}[]），供混搭/隨機。
- `subjectExpressions(key)` → 該角色 `分区=表情` 子集。
- `resolveDressupRecipe(dressup)` → 產出 `{ advancedPortrait, advancedCostume }`：
  - 形象塊：`base=主體三视图`、`expression=表情`；固有件（耳/尾/翼/面部特徵）**拼入 base 參考圖**（stich，見 §11.8）。
  - 服飾塊：選中裝飾按槽位自上而下 stich 成一套（複用 `resolveCostumeImage` 思路）。
- `buildDressupPrompt(dressup)`：
  - 固有強調：`保留[主體]的[耳/尾]，不得省略`（面部特徵如米字瞳同列）。
  - 翼：`wingsOn` 才提及；off 完全不提（v14 不做否定強調）。
  - 裝飾：`穿上圖N中已拼合為一套的服飾（自上而下：頭飾→髮飾→…）`。
  - 表情：`表情：X`（既有 `buildSubfieldPrompt` 已接線，直接填入 `expression`）。

### 12.4 UI 組件

- `routes/characters.tsx` 改造：品牌藥丸（`品牌`）→ 角色卡（標「固有」）→「開始換裝」設 `subject` 並進入換裝面板。
- 新 `components/dressup/DressupPanel.tsx`（暫掛 `/studio` 或獨立 route）：
  - 左：主體形象 + 固有清單（耳/尾/翼固定，翼有開關）+ 表情選擇器（該角色表情子集）。
  - 中：14 槽位自上而下（`order`）裝飾選擇器，每槽 0..n 件、可清空、可混搭（標來源角色）。
  - 右：模式切換（內部替換＝任意混搭／絕對替換＝清空裝飾＋原版服飾／簡易換裝＝選一件原版服飾直接替換）＋隨機（主體不可隨機，僅裝飾可）＋生成按鈕。
- 接線：`DressupState` 變更 → `setDressup()`（store 新增）→ 生成時 `resolveDressupRecipe` 編譯為既有模型。

### 12.5 推出順序（增量，每步 `control.bat check/lint/build` 通過）

1. 資料接線 + `dressup.ts` 純函數（槽位歸併、固有判定、留空/混搭可自測）。
2. `DressupState` 入 store + 換裝面板骨架（先內部替換）。
3. 提示詞整合 + 生成驗證（本地 ComfyUI 或任一 provider）。
4. 絕對替換 + 簡易換裝 + 隨機。
5. 本地 `control.bat build` 通過 → 部署公網（Cloudflare）。

---

## 13. Phase C 續：絕對替換／簡易換裝（v27 細部規劃，待審批）

> 既有 `DressupState.mode` 已預留 `'internal' | 'absolute' | 'simple'`；`internal` 已實作並強化（§12、v24–v26）。本節釐清剩餘兩種模式的資料流、UI 切換、提示詞差異與實作順序，供審批後動工。

### 13.1 三種模式語義對照

| 模式 | 形象（圖1） | 服飾（圖2） | 使用場景 |
|------|------------|------------|----------|
| **internal（內部替換）** | 主體三视图＋固有＋表情 | 14 槽位 aichan 裝飾自由混搭 | A 換 B/C/D 的裝飾 |
| **absolute（絕對替換）** | 主體三视图＋固有＋表情 | **清空** aichan 裝飾，換上**原版成套服飾** | A 直接穿原版衣服 |
| **simple（簡易換裝）** | 主體三视图＋固有＋表情 | 選一件原版成套服飾 | absolute 的快捷入口：只選形象＋衣服 |

**核心不變**：主體 aichan 的**固有部分**（耳/角/尾/翼/面部特徵）在三種模式下都**隨主體固定、不可換**；只有「服飾」來源不同。

### 13.2 資料模型調整

`DressupState` 已支援 `mode`，但 `absolute/simple` 需要額外記錄「選中的原版服飾」。為避免跨模式資料互相覆蓋，採用**各模式獨立快照**設計：

```ts
export interface DressupState {
  subject: string
  subjectView: PortraitItem | null
  expression: PortraitItem | null
  inherent: CostumeItem[]
  wings: CostumeItem[]
  wingsOn: boolean
  mode: DressupMode
  // internal 專用
  slots: DressupSlotSelection[]
  // absolute / simple 專用
  absoluteCostume: CostumeItem | null
}
```

- 切換模式時，**保留** `subject/subjectView/expression/inherent/wings/wingsOn`，僅切換服飾來源（`slots` ↔ `absoluteCostume`）。
- `mode='simple'` 與 `mode='absolute'` 可共用 `absoluteCostume`；差異在 UI 入口與操作步驟：
  - `simple`：在角色頁或換裝頁提供「簡易換裝」入口，一步選主體＋一步選原版服飾即可生成。
  - `absolute`：在換裝頁內從 `internal` 切換過來，保留主體但清空 aichan 裝飾，再選原版服飾。

### 13.3 解析與提示詞

#### 13.3.1 `resolveDressupCostumeImage` 擴充

```ts
async function resolveDressupCostumeImage(dressup: DressupState): Promise<CostumeItem | null | undefined> {
  if (dressup.mode === 'internal') {
    // 現有邏輯：14 槽位裝飾 stitch
    const items = dressup.slots.flatMap((s) => s.items)
    if (!items.length) return undefined
    // ... stitchCards
  }
  // absolute / simple：直接返回選中的原版服飾
  if (dressup.absoluteCostume) return dressup.absoluteCostume
  return undefined
}
```

- `absolute/simple` 的服飾圖就是原版服飾的 `预览图/原图`，**不需要 stitch**（原版已是成套集合圖）。
- 若 `absoluteCostume` 為 `null`，服飾塊為空（類似 internal 清空全部裝飾）。

#### 13.3.2 `buildDressupPrompt` 擴充

- **internal**：沿用既有——「穿上圖N中已拼合為一套的 aichan 裝飾（自上而下：頭飾→髮飾→…）」。
- **absolute/simple**：服飾子句改為——「穿上圖N所示的完整服裝套裝：…（列出 `服装名称` + `标签`）」。畫風由「AI 角色合成台 → 畫風預設」統一處理，此處不額外強調風格。
- 固有強調子句在三種模式下**不變**：「保留[主體]的[耳/尾/翼/面部特徵]，不得省略或人形化」。
- 表情子句不變。

### 13.4 UI 設計

#### 13.4.1 換裝頁模式切換

在 `/dressup` 頂部工具列增加模式切換（segmented control / tabs）：

```
[內部替換] [絕對替換] [簡易換裝]
```

- **內部替換**：顯示既有 14 槽位裝飾編輯器＋一鍵 A+B/隨機/還原/清空。
- **絕對替換**：隱藏 14 槽位；改為「選擇原版服飾」區塊（可用原版 `/costumes` 的卡片/分類/篩選邏輯，或簡化版藥丸分類＋卡片網格）。選中後顯示服飾預覽圖與名稱；提供「清除服飾」按鈕。
- **簡易換裝**：最簡流程——頂部只保留主體資訊，中間大字「選一套原版服飾」，下面直接是原版服飾卡片網格；點選即完成，生成按鈕啟用。

#### 13.4.2 角色頁「開始換裝」入口擴充

`routes/characters.tsx` 的詳情彈窗或角色卡 hover 菜單增加兩個入口：

- **開始換裝（內部）**：跳 `/dressup?subject=<key>&mode=internal`
- **簡易換裝**：跳 `/dressup?subject=<key>&mode=simple`

`validateSearch` 擴充接收 `mode`，`dressup.tsx` 掛載時依 `mode` 初始化對應狀態。

#### 13.4.3 底部 RecipeDock 適配

- `isDressup = Boolean(recipe.dressup)` 不變。
- 三槽文案可隨 `dressup.mode` 微調：
  - internal：主體／裝飾（N 件）／姿勢
  - absolute/simple：主體／原版服飾／姿勢
- 操作列「隨機」僅在 `internal` 時啟用；`absolute/simple` 隨機按鈕隱藏或改為「換一件原版服飾」。

### 13.5 資料接線（已就緒，無需新增）

- 原版服飾已由 `costumesQuery`（`/data/costume-zh.json` 等）載入，現成的 `CostumeItem[]` 可直接使用。
- aichan 服飾由 `aichanCostumesQuery` 載入；兩者資料格式一致（`CostumeItem`），僅 `source`/`角色` 欄位不同。

### 13.6 實作順序（增量，每步 `tsc -b`/`oxlint`/`vite build` 全綠）

1. **型別擴充**：`DressupState` 加 `absoluteCostume: CostumeItem | null`；`validateSearch` 加 `mode`。
2. **資料層**：`lib/dressup.ts` 增加 `buildInitialSimpleDressup(key, costume)` / `buildInitialAbsoluteDressup(key)` 輔助函式。
3. **解析層**：`aiGenerator.ts` 的 `resolveDressupCostumeImage`/`buildDressupPrompt` 按 `mode` 分流。
4. **UI 層**：`dressup.tsx` 加模式切換與原版服飾選擇器；`characters.tsx` 加「簡易換裝」入口。
5. **生成驗證**：本地跑一次 absolute/simple 生成，確認形象圖＋原版服飾圖＋姿勢圖三圖分開進合成台。
6. **部署**：`vite build` 通過後部署 Cloudflare。

### 13.7 風險與取捨

1. **原版服飾與 aichan 風格差異**：原版服飾參考圖雖與 aichan 角色圖風格不同，但「AI 角色合成台 → 2. 模型与参数 → 畫風預設」已負責統一畫風，提示詞無需額外強調「二次元風格」，只需描述服裝本身（`服装名称` + `标签`）即可。
2. **NSFW 過濾**：原版服飾有 `敏感`/`分类=内衣・睡衣` 標記；absolute/simple 模式仍需遵循 SFW safe-mode（預設 ON）。
3. **簡易換裝 vs 絕對替換的界線**：simple 只是 absolute 的快捷入口，資料上可視為同一模式，減少冗餘。
4. **退出策略**：`useSubfields=false` 舊路徑不受影響；`recipe.dressup` 存在時底部 dock 才進入換裝模式，與原版三元素仍互斥。

---

**下一步**：本節 v27 規劃待你審批。確認後即按 §13.6 順序實作。

---

## 14. v29 三大基本元素收斂（原版替換回歸原版流程、aichan 換裝收束為內部替換）

> 依據 [28]–[32] 的收斂結論：取消「絕對替換／簡易換裝」這個獨立模式，回到「三大基本元素」（形象／服裝／姿勢）的簡單模型。
> 原版替換 = 在**原版流程**中選「aichan 形象」＋服裝＋姿勢；aichan 換裝 = 純內部替換（自訂拼裝服飾參考圖）。

### 14.1 目標

1. **aichan 形象歸併到原版人物形象**：`/characters` 改名「aichan 形象」，與「人物形象」並列、互斥（共用同一個「形象」槽）。
2. **原版替換回歸原版流程**：不再有 `absolute` 模式；「選人物（含 aichan）→ 選服裝 → 選姿勢」三步即為原版替換。
3. **aichan 換裝 = 內部替換**：`/dressup` 移除模式切換與原版服飾選擇器，只保留 14 槽位自訂拼裝。
4. **aichan 服装·配飾只瀏覽**：「加入配方」改為跳轉 `/dressup?subject=<角色>`（存疑清單第 2 項）。
5. **底部三槽共用**：所有路徑（原版 / aichan 形象 / aichan 換裝）都收斂到同一「主體／服飾／姿勢」三槽與同一套提示詞＋API 生成。

### 14.2 側邊欄結構（`nav.ts`）

```
工作台
  图库总览 (/)
  aichan 換裝 (/dressup)      ← 僅內部替換
  AI 角色合成台 (/studio)

參考圖庫            ← 由「三大参考图库」改名；合併原「优先参考」＋「原版参考图库」兩組
  aichan 形象 (/characters)    ← 原「AI 娘角色」
  aichan 服裝配飾 (/outfits)   ← 原「服装·配饰」
  動作姿勢庫 (/poses)          ← 原「动作姿势库」
  原版服裝庫 (/costumes)       ← 原「服装库」
  原版人像庫 (/portraits)      ← 原「人像库」

配置与说明
  API 接口配置 (/settings)
  使用说明与免责声明 (/guide)
```

- 移除「优先参考（AI 娘 × 姿势）」與「原版参考图库」兩組，合併為「參考圖庫」。
- 參考圖庫排序（[34] 定案）：aichan 形象 → aichan 服裝配飾 → 動作姿勢庫 → 原版服裝庫 → 原版人像庫。
- 原版兩庫保留原名並加 `原版_` 前綴：`原版人像庫`／`原版服裝庫`。
- aichan 三項命名統一帶 `aichan` 前綴：`aichan 換裝`／`aichan 形象`／`aichan 服裝配飾`。

### 14.3 資料／邏輯簡化（移除 absolute 模式）

- `DressupMode` 移除；`DressupState` 移除 `mode` 與 `absoluteCostume`（dressup 恆為 internal）。
- `lib/dressup.ts`：刪除 `buildInitialAbsoluteDressup`（`buildInitialSimpleDressup` 已於 v28 刪除）。
- `aiGenerator.ts`：`buildDressupPrompt` 移除 `isAbsolute` 分支（恆走 internal 服飾子句）；`resolveDressupCostumeImage` 移除 absolute 分支（恆 stitch 14 槽位）。
- `RecipeDock.tsx`：移除 `isAbsolute`／`absoluteCostume` 分支（恆顯示「N 件裝飾」）。
- `dressup.tsx`：移除 `ModeTabs`、`setMode`、`isAbsolute`、原版服飾選擇器（分類藥丸／搜尋／卡片網格／解鎖）、`validateSearch` 的 `mode`。
- `studio.tsx`：4 處「調整」連結移除 `mode` 參數。
- 舊 localStorage 中殘留的 `mode`/`absoluteCostume` 屬多餘欄位，解析時自然忽略，無需遷移。

### 14.4 頁面行為變更

- **`/dressup`（aichan 換裝）**：只保留主體選擇（卡片網格）＋ 14 槽位編輯器＋生成。頂部工具列移除模式切換，僅留「一鍵換裝／隨機裝飾／還原本體／一鍵清空／生成」。
- **`/characters`（aichan 形象）**：由「三視圖／表情素材卡」改為「角色卡」網格（每角色一張正面卡：名稱＋廠商＋固有/翼徽章），頂部廠商（品牌）藥丸；每卡**兩個按鈕**（[34]）：「正面圖加入配方」＝ `togglePortrait(正面視圖)`；「三視圖加入配方」＝把該角色三視圖（正面/側面/背面）拼成複合圖後 `togglePortrait(三視圖合成, sheet:true)`，提示詞同步切換為「三視圖設定圖」子句（相當於一個開關）。卡片本身點擊＝查看大圖（與人像庫一致）。
- **`/outfits`（aichan 服裝配飾）**：僅瀏覽；移除 `toggleCostume` 直接選入服飾槽；「加入配方」改為 `navigate('/dressup?subject=<角色>')`（[34]）；頂部藥丸在既有分類之外，增加廠商（品牌）藥丸（`CostumeItem.角色` → `AichanCharacter.品牌` join）。
- **`/portraits`（人物形象）**：僅改導航名，頁面邏輯不變。

### 14.5 與存疑清單對應

- 存疑 1「aichan 形象 ↔ 原版形象」：對應 `/characters`（aichan 形象）與 `/portraits`（人物形象）互斥共用「形象」槽。
- 存疑 2「aichan 服飾·配飾 ↔ 原版服飾」：對應 `/outfits` 僅瀏覽、`/dressup` 自訂拼裝。
- 文案見 `docs/known-limitations.md`（已更新為兩條）。

### 14.6 實作順序（每步 `tsc -b`／`oxlint src`／`vite build` 全綠）

1. 型別＋資料層：`types/gallery.ts`（移除 `DressupMode`/`mode`/`absoluteCostume`、`PortraitItem` 增 `sheet?`）、`lib/dressup.ts`（移除 `buildInitialAbsoluteDressup`）。
2. 解析層：`aiGenerator.ts` 移除 absolute 分流；`buildLegacyPrompt`/`buildSubfieldPrompt` 增 `sheet` 三視圖子句；新增 `buildThreeViewPortrait`。
3. UI 收斂：`dressup.tsx` 移除模式切換與服飾選擇器；`RecipeDock.tsx`、`studio.tsx` 移除 `mode`。
4. `/characters` 改角色卡網格（廠商藥丸＋正面圖/三視圖兩按鈕＋點擊看大圖）。
5. `/outfits` 改僅瀏覽＋廠商藥丸＋加入配方跳轉 `/dressup`。
6. `nav.ts` 側邊欄重排＋改名（參考圖庫順序依 [34]）。
7. `randomizeRecipe`（`studioStore.tsx`）依 [35] 收斂：空人像 → toast；aichan 人像固定、服裝取 aichan；原版人像走原版池。
8. `vite build` 通過後，本地檢驗無誤 → 部署（與 [28] 一致，等你驗收）。

### 14.7 [34] 增補（忠實原版、aichan 優先）

1. **兩按鈕**：AI 娘角色每卡「正面圖加入配方」＋「三視圖加入配方」。三視圖＝拼合該角色正面/側面/背面為一張設定圖，並把提示詞切換為「三視圖設定圖」子句（`PortraitItem.sheet` 開關）。
2. **原版前綴**：人像庫／服飾庫保留原名並加 `原版_` 前綴 → `原版人像庫`／`原版服裝庫`。
3. **排序**：參考圖庫 = aichan 形象 → aichan 服裝配飾 → 動作姿勢庫 → 原版服裝庫 → 原版人像庫。
4. **點擊大圖**：卡片本身點擊＝查看大圖（與人像庫一致）。
5. **服裝配飾**：「加入配方」→ 自動跳轉「aichan 換裝」（`/dressup?subject=<角色>`）。
6. **定位**：「aichan 換裝」＝「AI 角色合成台」的前置步驟／原材料加工，效果等於「製作服飾參考圖」。

### 14.8 [35] 底部 block 隨機規則（隱藏規則）

底部三元素（人像／服裝／姿勢）的「隨機」依當前人像分派，避免誤混：

1. **人像為空** → 點隨機彈 toast「請先選擇人像」，不做任何隨機。
2. **人像 = aichan 形象** → 人像固定不變；服裝取自 aichan 服裝池（`source==='aichan' && 分类==='服装'`）；姿勢取姿勢池（安全過濾）。
3. **人像 = 原版人像** → 保留原版體驗：人像／服裝／姿勢均取自原版池（服裝池本就 `!source`，不含任何 aichan）。
4. 概言之：涉及 aichan 時「專注 aichan、人像不參與隨機、避開存疑清單混合」；純原版時「完整原版體驗」。

> 實作落點：`studioStore.randomizeRecipe`（`RecipeDock` 與 `studio` 的「隨機」共用此函式），`handleRandom`/studio 隨機處補傳 `aichanCostumes`。

---

**下一步**：本節 v29（含 [34][35] 增補）規劃完備，即按 §14.6 順序實作。

---

## 15. 長遠計劃（部署公網驗收後，[36]）

> 下列事項在**推到公網、用户確認無誤之後**再執行，不與 v29 同時進行。

1. 網站上的 GitHub 鏈接引導到**當前倉庫**（`ferngherng-lab` 名下）。
2. 「使用說明與免責聲明」結合本計劃書，重寫一份**邏輯清晰**的使用說明。
3. 本倉庫 `README.md` 充分改寫，並引用之前的兩個主要倉庫。
4. 網頁與 README 的**數據來源與版權說明**務必安全嚴謹（CC BY-NC-SA 4.0／ai-chan-sheets、ギア @giaaibusi、CharaDB 等各自條件）。
5. 網頁「配置与说明 → 新增 tab」與 README 中，正式寫清楚**存疑清單**內容（承接 `docs/known-limitations.md`）。
6. **[45] 原站功能不可缺失／損壞（加強版約束）**：本網站相當於原網站的加強版，原站功能**完全不能缺失或損壞**，一切新增皆「錦上添花」。最終驗收時需逐項回歸原版三庫（姿勢／服裝／人像）瀏覽、篩選、加入配方、生成、隨機、SFW 安全模式等既有功能，確認無退化。

---

## 16. v29 後續細節修正（[37]，aichan 一致性優先）

> 延續 §14「忠實原版、aichan 優先」，修正形象選擇的一致性，並拆分圖庫總覽。

1. **圖庫總覽拆兩份**：現有「图库总览」複製為「aichan 圖庫總覽」（`/`）與「原版圖庫總覽」（`/legacy`）。
2. **aichan 圖庫總覽**「AI 娘角色庫」預覽圖 = 前幾個廠商各自的**第一個表情圖**。
3. **aichan 圖庫總覽**「AI 娘角色速選」= 前幾個廠商各自的**第一個正面圖**。
4. **形象一致性（修正 §14.7-1）**：「正面圖加入配方」＝正面視圖＋固有件（耳／尾等）拼合圖；「三視圖加入配方」＝正面＋側面＋背面＋固有件拼合圖。人物身體固有部分不可分割。
5. **即時覆蓋**：「aichan 形象」選正面／三視圖時，以最高優先級即時覆蓋既有「aichan 換裝」配置；配置永遠即時更新，「最後一次改動」為準；底部 block 永遠即時更新。
6. **aichan 形象卡片**：移除圖片頂部廠商橫條，改為卡片下方廠商標籤；點擊形象即顯示三視圖（非僅放大正視圖）。

> 實作落點：`buildThreeViewPortrait` → `buildCharacterPortrait(views, inherentParts, name, sheet)`；`studioStore.togglePortrait/toggleCostume` 選取時清空 `dressup`/`advancedPortrait`/`advancedCostume`（最後改動優先）；`characters.tsx` 重寫；`index.tsx` 改為 aichan 總覽＋新增 `legacy.tsx`。

---

## 17. v29 後續細節修正（[39]，拆分 DeepSeek Q版冬裝 + 換裝承接 + 固有強調）

> 四點細節。核心理念承接 §14「忠實原版、aichan 優先」與 §11「固有（耳/角/尾/翼）不可換」。
>
> [42] 增補「隨機＝成套配飾」為點 5（§17.6）；[43] 重申點 1（拆分後必須在畫面上顯示為**兩個人物**），已含於 §17.1。

### 17.1 點 1：DeepSeek 娘（Q 版冬装）拆成兩個角色

現況：`12_DeepSeek娘_Q版冬装` 在 `characters/inherent/portrait/costume` 四檔共用同一 `角色` key，但其圖像目錄實際有**兩個子資料夾**：

- `thumbs|img/aichan/12_DeepSeek娘_Q版冬装/冬装小肥鱼/`（22 檔：A01–A03 三视图＋B01–B08 表情＋C01–C04 服装＋D01–D07 道具）
- `thumbs|img/aichan/12_DeepSeek娘_Q版冬装/冬装小肥鱼2/`（22 檔，同名結構）

**拆法（只改 `角色`/`角色名`，不動 `id` 與實體路徑）**：`id` 是「檔案路徑式唯一識別」，且 `aichan-slot-taxonomy.json`／`aichan-costume-zones.json`／`aichan-costume-doubt.json` 皆以 `id` 為鍵。保留 `id` 與圖片路徑不變＝**零連帶修改**；僅把 44 件素材的 `角色` 與名稱字串按所屬子資料夾分流到兩個新 key。

- 新 key1＝`12_DeepSeek娘_Q版冬装_小肥鱼`，名稱＝`DeepSeek 娘（Q 版冬装 · 小肥鱼）`
- 新 key2＝`12_DeepSeek娘_Q版冬装_小肥鱼2`，名稱＝`DeepSeek 娘（Q 版冬装 · 小肥鱼2）`

分派規則（依 `id` 判斷，先查 `小肥鱼2` 再查 `小肥鱼`）：`id` 含 `/冬装小肥鱼2/` → key2；否則含 `/冬装小肥鱼/` → key1。

逐檔變更：

1. `aichan-characters.json`：`12_DeepSeek娘_Q版冬装` 一筆 → 兩筆（各自 `key`／`角色名`，`品牌`＝`DeepSeek`）。
2. `aichan-inherent.json`：`12_DeepSeek娘_Q版冬装` 一鍵 → 兩鍵：
   - key1 `parts`＝`[.../冬装小肥鱼/D01_道具_鲸鱼尾`, `.../冬装小肥鱼/D02_道具_鲸鱼鳍耳`]（鲸鱼鳍耳＝耳、鲸鱼尾＝尾）
   - key2 `parts`＝`[.../冬装小肥鱼2/D01_道具_鲸鱼尾`]（僅尾）
   - 兩者 `optional` 皆空。
3. `aichan-portrait-zh.json`：22 件 `角色` 改為對應新 key；`角色名`／`发长`／`标题`／`检索` 中的 `DeepSeek 娘（Q 版冬装）` 字串替換為對應新名稱（`标题` 保留「 · 正面／左側／背面／表情」後綴）。
4. `aichan-costume-zh.json`：22 件 `角色` 改為對應新 key；`角色名`／`标签`（陣列內該字串）／`检索` 中的名稱字串替換為對應新名稱。

> 實作：以 Python 腳本（UTF-8、`indent=1`、`ensure_ascii=False`）載入四檔、依 `角色==="12_DeepSeek娘_Q版冬装"` 過濾、依 `id` 分流改寫並寫回，避免 44 件手工漏誤。`aichan-slot-taxonomy.json`／`aichan-costume-zones.json`／`aichan-costume-doubt.json` **不改**（`id` 未變）。

### 17.2 點 2：服裝配飾「加入配方」＝套入全套配飾（b），非主體（a）

現況：`outfits.tsx goDressup(item)` 跳 `navigate({ to:'/dressup', search:{ subject:item.角色 } })`，把點擊件的角色設為**主體**（a）。

改法：新增 search 參數 `apply`（語意＝「把該角色的全套配飾（除主體）套上現有主體」）：

- `outfits.tsx goDressup` → `navigate({ to:'/dressup', search:{ apply:item.角色 } })`（主體不變，只套配飾）。
- `dressup.tsx`：`validateSearch` 增 `apply?: string`；初始化 effect 在確定主體後，若 `apply` 存在，呼叫既有 `applyOtherDecorations(apply)`（= `subjectDecorations(apply)` → `fillSlotsWithSubject` 整槽替換，主體固有保持為 A）。無主體可承接時，回退為以 `apply` 角色設主體（保底不空白）。

「A 主體 + B 全套裝飾」＝既有 `applyOtherDecorations`，已實作，此點僅接線入口。

### 17.3 點 3：aichan 換裝繼承已選形象，跳過重選

現況：`dressup.tsx` 只有 `!dressup` 時渲染主體選擇網格；由 index「aichan 換裝」連結（`subject:undefined`）或側欄進入時 `dressup` 為空 → 強制重選。

改法：初始化 effect 新增「繼承」來源，優先序：

1. `subject` 搜尋參數（characters「開始換裝」顯式帶入，現有）。
2. `recipe.dressup?.subject`（已在換裝態）。
3. **`recipe.portrait?.角色`**（當 `recipe.portrait.source==='aichan'`）——即在「aichan 形象／aichan 圖庫總覽」已選定形象時，繼承其 key，直接 `buildInitialDressup(key,...)`（含 `toggleSubfields()` 開啟）進入配飾配置界面，**跳過主體選擇**。

`dressup.tsx` 需額外解構 `recipe.portrait`。characters「開始換裝」維持 `subject` 顯式帶入（不變）；index「aichan 換裝」連結維持 `subject:undefined`（由繼承路徑接手）。

### 17.4 點 4：提示詞精確列舉固有（horn／耳／尾／翼），完整敘述拼圖每一元素

現況：`buildDressupPrompt` 固有子句僅泛寫「身体特征（鯨魚尾、鯨魚鳍耳）」，未強調角／耳／尾；形象複合圖（characters/index 選形象後走 `buildLegacyPrompt`）完全未列舉拼入的固有件。

**核心原則（[40]-1）**：固有列舉**只由「所選主體是否含有非人類固有部分（角／耳／尾／翼／面部特徵）」驅動**，與使用者從哪個 UI 入口（換裝頁／形象頁／總覽／服裝配飾）選入無關。固有件資料**隨主體對象一起流動**（換裝＝`dressup.inherent`；形象複合圖＝`portrait.固有`），提示詞對任何入口都用**同一套列舉邏輯**。

改法：

1. `types/gallery.ts`：`PortraitItem` 增 `固有?: string[]`（拼入固有件的 `服装名称` 清單）。
2. `aiGenerator.ts`：
   - 新增 `classifyBodyFeature(name)`：依序 `翼→翅膀`、`尾→尾巴`、`耳→耳朵`、`角→角（horn）`、`瞳|眼→眼部特徵`、其餘→`身体特征`（先查「翼」再查「尾」，避免「双马尾…蝙蝠翼飘带」誤判為尾巴）。
   - 新增**單一共享 helper** `buildInherentClause(names: string[])`：`names` 空 → `''`；否則產出 `并固定保留、逐一强调且不得省略或改变该角色的身体特征（角、耳、尾、翼等）：${names.map(n => `${n}（${classifyBodyFeature(n)}）`).join('、')}。上述特征必须完整出现在最终画面中，缺一不可。` —— **三個 builder 共用同一句**，僅「固有件名稱來源」不同（換裝取 `dressup.inherent`＋翼、形象複合圖取 `recipe.portrait.固有`），保證「非人類固有部分」的提示詞**不隨入口漂移**。
   - `buildCharacterPortrait`：回傳加 `固有: inherentParts.map(i => i.服装名称)`。
   - `buildDressupPrompt`：固有子句改呼叫 `buildInherentClause(fixed.map(i => i.服装名称))`（`fixed`＝`wingsOn ? [...inherent, ...wings] : inherent`）。
   - `buildLegacyPrompt` 與 `buildSubfieldPrompt`：aichan 形象分支，若 `recipe.portrait.固有?.length`，於角色子句後接 `buildInherentClause(recipe.portrait.固有)`（涵蓋「正面／三视图」形象複合圖的生成路徑，正面圖走 `buildLegacyPrompt`）。
   - 人形角色（固有為空）→ `buildInherentClause([])` 回傳空串，提示詞**不**出現角／耳／尾字樣。
3. 裝飾件沿用既有 `slotDesc`（已逐槽列舉每件 `服装名称`），不變。

### 17.5 實作順序（每步 `tsc -b`／`oxlint`／`vite build` 全綠）

1. **資料層（點 1）**：Python 腳本拆四檔（characters/inherent/portrait/costume），寫回。
2. **型別＋固有列舉（點 4）**：`gallery.ts` 加 `固有?`；`aiGenerator.ts` 加 `classifyBodyFeature`＋`buildInherentClause` 共享 helper，改 `buildCharacterPortrait`／`buildDressupPrompt`／`buildLegacyPrompt`／`buildSubfieldPrompt`。
3. **UI 承接（點 2、3、5）**：`dressup.tsx` 加 `apply` 參數＋繼承 `recipe.portrait?.角色`＋隨機改成套；`outfits.tsx` 改 `apply` 跳轉；`studio.tsx`／`RecipeDock.tsx` 隨機呼叫點同步改套裝。
4. **驗證**：`tsc -b`／`oxlint`／`vite build`；本地起服核對（角色頁出現兩個 DeepSeek Q版冬裝；服裝配飾「加入配方」套配飾不換主體；選形象後進換裝直接進配置；提示詞列舉角/耳/尾；隨機＝整套配飾）。
5. **部署**：本地驗收後 `wrangler deploy`（與前案一致，待你確認）。

---

### 17.6 點 5（[42]）：隨機＝成套配飾（隨機整套 B），非單件

現況：`lib/dressup.ts randomizeDecorations` 每槽 0..1 件（50% 留空）跨角色混抽 → 隨機結果不是「成套」，只抽單件。

改法：改成「隨機抽一個角色的**完整配飾套**」（= A 主體 + 隨機 B 全套裝飾），主體固有保持不變：

1. `lib/dressup.ts` `randomizeDecorations` 改簽名為 `(subjectKey, skeleton, pool)`，回傳 `{ slots: DressupSlotSelection[]; owner: string | null }`：
   - 從 `pool` 收集所有 `owner`（≠ `subjectKey`），即「有配飾的其他角色」候選集。
   - 候選空 → 回傳 `{ slots: skeleton.map(s => ({...s, items: []})), owner: null }`（清空，不報錯）。
   - 隨機挑一 `owner`，以該 owner 在 `pool` 中每個槽的**全部**件填入（= 該角色成套配飾），回傳 `{ slots, owner }`。
2. 三個呼叫點同步：
   - `dressup.tsx randomize`、`studio.tsx handleDressupRandom`、`RecipeDock.tsx handleDressupRandom` → `const { slots, owner } = randomizeDecorations(dressup.subject, dressup.slots, pool)`；`setDressup({ ...dressup, slots })`。
   - toast：`owner` 有值 → `已隨機套用 ${角色名} 的全套裝飾`；`owner === null` → `無其他角色可隨機（已清空裝飾）`。

> 註：`pool`（`decorationPool`）已排除固有件、並以 `owner`（= `角色`）標記，直接由 pool 重建成套配飾即可，無需再引入 `characters`／`inherent`。§17.1 DeepSeek 拆分後 `角色` key 自動分流，此處隨之正確。角色名映射：`dressup.tsx` 用既有 `charName`；`studio.tsx`／`RecipeDock.tsx` 於 `handleDressupRandom` 補查 `aichanCharactersQuery` 建 name map（或退為通用文案）。

---

### 17.7 點 6（[44]）：完全隱藏「外卖箱盖灯条」配飾

> 用户否定「外卖箱盖灯条」的實用性，且它與「美团外卖箱」道具衝突。須**完全隱藏**，排除於任何界面與選項資料。

- 目標 id＝`17_LongCat娘_美团龙猫_现代外套/D07_道具_外卖箱盖灯条`（角色 `17_LongCat娘_美团龙猫_现代外套`，`slot-taxonomy` 槽位＝`detail`）。
- 移除三處（從資料層根除，非僅 UI 過濾）：
  1. `aichan-costume-zh.json`：刪除該 id 的整筆物件。
  2. `aichan-slot-taxonomy.json`：刪 `mapping` 中該 id 的鍵。
  3. `aichan-costume-zones.json`：刪該 id 的鍵。
- 該 id 不在 `aichan-inherent.json` 與 `aichan-costume-doubt.json`（已核實），無需處理。
- **README 註記**：於資料來源／已知限制處記一條「外卖箱盖灯条 因與 美团外卖箱 衝突且不具實用性，已自選項資料移除」。

---

## 18. 待辦操作：sujmao 鏡像網頁恢復／重定向（[61]）

> 背景：`sujmao` 為早期部署身份（本專案已於 v31 換綁 `ferngherng-lab` 帳戶；舊網址 `ai-chan-pose-gallery.sujmao.workers.dev`）。sujmao 帳戶對應的網頁原本是上游原站 `https://ai-pose-gallery.anhao.app/` 的鏡像，現被「當前網站的中間版本」污染，需恢復或重定向。

1. **現況**：sujmao 帳戶網頁原本服務上游 `https://ai-pose-gallery.anhao.app/`（`anhao/ai-pose-gallery-zh`）之鏡像；目前被當前網站（ai-chan-pose-gallery）的**中間版本**污染——既非最新正式版，也非原鏡像。
2. **目標**：恢復原鏡像，或改為重定向（二擇一）。
3. **選項 A——恢復鏡像**：於 sujmao 帳戶重新部署上游 `anhao/ai-pose-gallery-zh` 原版，使該網頁再次等同上游。
4. **選項 B——重定向**：將該網頁設為 301/302 重定向至上游 `https://ai-pose-gallery.anhao.app/`（或至本專案正式網址 `https://ai-chan-pose-gallery.ferngherng-lab.workers.dev`）。
5. **執行前提**：需 sujmao 帳戶之 Cloudflare 憑證（見 `WORKSPACE.md`「憑證」節）；於 Cloudflare Workers/Pages 面板或 `wrangler deploy` 完成。
