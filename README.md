# 肉舖日常｜叫貨推演

以精肉部門經營為主題的 3D 教學模擬遊戲。玩家擔任主任，規劃叫貨、加工與排班，再觀察缺貨、報廢及營業利益，透過重演調整決策。

## 目前功能

- 可旋轉、縮放的 3D 肉舖；WASD／方向鍵走動、點地板移動、E 與角色互動。
- 小林負責叫貨、阿宏負責加工排班、店長負責結算，副主任提供巡場建議。
- 14 天模擬、庫存效期、分時到貨、加工排程、營業結算及重演比較。
- 人事成本每人每小時 250 元，休息不計薪。
- 瀏覽器自動存檔；不同裝置及不同網址的進度各自獨立。
- WebGL 不可用時嘗試使用平面場景備援。

| 班別 | 工作時間 | 休息時間 | 計薪工時 | 每人每班成本 |
| --- | --- | --- | --- | --- |
| 早班 | 09:00–13:00、14:00–18:00 | 13:00–14:00 | 8 小時 | 2,000 元 |
| 中班 | 11:00–15:00、16:00–20:00 | 15:00–16:00 | 8 小時 | 2,000 元 |
| 晚班 | 13:00–17:00、18:00–22:00 | 17:00–18:00 | 8 小時 | 2,000 元 |
| 短班 | 09:00–12:00、12:30–15:00 | 12:00–12:30 | 5.5 小時 | 1,375 元 |

價格、需求、效期與加工產能均為教學示範設定；副主任依遊戲資料與規則產生建議，沒有連接 AI 服務。

## 上傳到 GitHub

1. 解壓縮本專案。
2. 在 GitHub 建立一個空白 Repository（儲存庫）。
3. 將 `meat-shop-order-sim` 資料夾**裡面的內容**上傳至儲存庫根目錄，包含 `dist/`、`tests/`、`.github/`、`package.json` 和本說明。
4. 提交至 `main` 分支。

請上傳解壓後的檔案，單獨上傳 ZIP 不會發布網站。`.github` 是隱藏資料夾，使用檔案管理員上傳時請確認它有一起上傳。

## 使用 GitHub Pages 發布

1. 開啟儲存庫的 **Settings → Pages**。
2. 將 **Build and deployment → Source** 設為 **GitHub Actions**。
3. 本專案的 `.github/workflows/pages.yml` 會在推送至 `main` 時執行測試並發布 `dist/`。
4. 如果首次上傳時尚未啟用 Pages，設定好後到 **Actions → Deploy GitHub Pages → Run workflow** 手動執行。
5. 成功後，在 **Settings → Pages** 查看 GitHub 提供的網站網址。

工作流程預設使用 `main` 分支；若你的分支名稱不同，請修改 `pages.yml` 的 `branches`。
此壓縮檔尚未代你建立 GitHub 儲存庫或啟用 Pages。既有 Sites 網站不受此匯出影響。

## 本機開啟

這是靜態網站，不需要安裝 npm 套件，也不需要 API 金鑰或資料庫。
請使用 HTTP 伺服器開啟，避免直接雙擊 HTML 時瀏覽器阻擋 3D 模組。

已安裝 Python 3 時，在專案根目錄執行：

```sh
python3 -m http.server 8765 --directory dist
```

Windows 若使用 Python Launcher：

```sh
py -m http.server 8765 --directory dist
```

然後開啟 http://localhost:8765/ 。關閉伺服器請按 Ctrl+C。

## 測試

已安裝 Node.js 22 或更新版本時：

```sh
npm test
```

不需要先執行 `npm install`。測試涵蓋成本守恆、到貨時點、重演一致性、班別休息、人事成本、短班產能、存檔換算及副主任回報的時間限制。

## 檔案結構

```text
dist/
  index.html           網站入口
  style.css            介面樣式
  engine.js            庫存、排程、成本與模擬核心
  app.js               遊戲介面與存檔
  advisor.js           副主任建議規則
  deputy-ui.js         副主任巡查簿
  scene.js             3D 場景
  scene-fallback.js    備援場景
  vendor/              Three.js 與授權文件
tests/                 邏輯測試
.github/workflows/     GitHub Pages 自動發布設定
```

## 第三方元件與授權

使用 Three.js 0.170.0（包含 OrbitControls），其 MIT 授權保留於 `dist/vendor/THREE-LICENSE.txt`。
本專案原始程式的授權由專案擁有者決定；此匯出未替原始程式新增開源授權。

本檔案包不含帳號憑證、Sites 設定或原始 Git 歷史。
