# ai-chan-pose-gallery

> 基於 [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh) 的 fork：在原有「姿勢／服裝／人像」三大參考圖庫與 AI 角色合成工作台之上，新增 **AI 娘（aichan）** 擬人化角色系統。

**在線演示**：<https://ai-chan-pose-gallery.ferngherng-lab.workers.dev>

---

## 存疑清單（請先讀）

本清單記錄「效果無法 100% 保證、或需人工抽檢」的項目：

1. **aichan 形象 ↔ 原版形象（衝突／互斥／融合）**：aichan 形象與原版人像共用同一個「形象」槽位（互斥，一次只能選一個）。aichan 形象與原版服裝／姿勢疊加時，風格、身形、視角未必一致，能否正確融合無法保證，需人工抽檢。
2. **aichan 服飾·配飾 ↔ 原版服飾（衝突／互斥／融合）**：aichan 服飾·配飾目前**僅供瀏覽**；「加入配方」跳轉至「aichan 換裝」，由使用者以 14 槽位自訂拼裝一張服飾參考圖。與原版服飾／形象疊加時存在衝突／互斥／融合的可能，效果無法保證，需人工抽檢。
3. **已移除的配飾（資料清理）**：`外卖箱盖灯条` 配飾（`17_LongCat娘_美团龙猫_现代外套`）因與同角色「美团外卖箱」道具衝突且不具實用性，已自選項資料**完全移除**，不再出現於任何界面。

---

## 這是什麼

原站為 **ギア（@giaaibusi）** 發布的三大 AI 繪畫參考圖庫（姿勢／服裝／人像）。[anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh) 完成三站合一、全量中文化與 AI 角色合成工作台；本 fork 在此之上新增 **AI 娘（aichan）**：

- **aichan 圖庫總覽**（`/`）／**aichan 形象**（`/characters`）／**aichan 服裝配飾**（`/outfits`）／**aichan 換裝**（`/dressup`，固有耳/角/尾/翼/髮型隨主體，14 槽位自訂拼裝）。

> 具體技術細節（資料規模、ComfyUI 插件、Agent 技能、部署方式）請見原倉庫 [anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh)。

---

## 資料來源與授權

- **原有姿勢／服裝／人像**：源自原作者 **ギア（@giaaibusi）** 公開站點，著作權歸原作者所有（人像遵循 CC0 1.0）。
- **二次元服裝（440 套）**：源自 **たき AI（@taki_auto）** 的 [CharaDB](https://charadb-2fi.pages.dev/)（詳見其 [LICENSE](https://github.com/taki-ttt/charadb/blob/main/LICENSE)），圖片自原站在線加載。
- **AI 娘（aichan）**：原始角色立繪出自 **ZipZipPipe**，由 [lmy414/ai-chan-sheets](https://github.com/lmy414/ai-chan-sheets) 補全為橫版設定圖，遵循 **CC BY-NC-SA 4.0（署名－非商業性使用－相同方式共享）**；均為粉絲二次創作的非官方擬人化，與對應 AI 公司無關。

---

## 免責聲明

1. **學習與創作限定**：本項目（含前端工作台、ComfyUI 插件、工作流模板）**僅供個人學習、人體結構研究、合法藝術創作與技術交流使用**，嚴禁用於生成違法違規／淫穢色情內容，或未經授權對真人照片換臉／深偽等侵害他人權益的行為。
2. **NSFW（18+）敏感內容提示**：圖庫含部分成人向素體姿勢與內衣／性感穿搭參考，系統預設開啟「安全模式 (SFW)」屏蔽；**未滿 18 周歲的未成年人嚴禁關閉安全模式或訪問相關內容**。
3. **使用者責任**：所有 AI 生圖請求由使用者自行配置的 API 或本機 ComfyUI 執行，平台不收集、不存儲任何上傳圖片或生成結果。使用者違規使用或傳播所產生的一切法律責任，由使用者本人獨立承擔。
4. **開源協議**：前端代碼（`src/`）、ComfyUI 插件（`comfyui_plugin/`）與腳本（`scripts/`）以 [MIT](LICENSE) 開源；不覆蓋 `img/`、`thumbs/`、`data/` 中的圖片與原始數據。

---

## 本地開發與部署

```bash
pnpm install
pnpm dev                 # 本地開發（http://localhost:5173）
bash scripts/build.sh    # 完整構建：vite build + 複製 data/thumbs/img 到 dist/
npx wrangler deploy      # 部署 Cloudflare Workers + Assets
```

> 部署必須走 `scripts/build.sh`：Vite 的 `build` 會清空 `dist/`，若只跑 `pnpm build` 會漏掉 `data/thumbs/img`，導致線上載入資料與圖片報錯。
