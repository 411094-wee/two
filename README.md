# Lunch Choice Wheel

這個專案是一個純 HTML / CSS / JavaScript 的「午餐選擇機」，不使用任何前端框架。它包含：

- 一個可視化的輪盤，從 1~20 個項目中隨機選擇
- 每個項目對應中文午餐名稱與英文翻譯
- 可新增新午餐項目並自動翻譯英文
- 可將資料同步到 Google 試算表，並從試算表合併回本機

## 檔案結構

- `index.html`：頁面結構
- `style.css`：樣式與輪盤外觀
- `script.js`：輪盤邏輯、翻譯、Google 試算表同步

## 功能說明

1. 頁面載入時會顯示 20 個預設午餐項目
2. 輪盤每次順時針旋轉，轉速介於 30~200 度/秒
3. 輪盤上只顯示編號，選到後會顯示對應的中文與英文午餐名稱
4. 可以新增午餐項目，並可手動輸入英文名稱
5. 若未手動輸入英文，會自動呼叫翻譯 API 取得英文名稱
6. 若設定了 Google 試算表 Web App URL，會同步目前資料到試算表
7. 也會從試算表讀取資料並合併到本機，避免重複項目

## 使用步驟

1. 打開本專案目錄
2. 使用瀏覽器開啟 `index.html`
3. 轉動輪盤：
   - 點選「開始轉一轉」
   - 等待輪盤停止，然後看結果顯示「第 N 號：中文 / English」
4. 新增午餐：
   - 在「午餐名稱」輸入中文
   - 「英文名稱」可留空，系統會自動翻譯
   - 點選「加入午餐選項」

## Google 試算表同步設定

要啟用 Google 試算表同步，請執行以下步驟：

1. 開啟 Google 試算表，建立新的試算表
2. 打開 「擴充功能 > Apps Script」
3. 新增一個 Apps Script 專案，貼上以下範例程式碼：

```javascript
function createJsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  return output;
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');

  if (!sheet) {
    return createJsonResponse({ success: false, message: '找不到 Sheet1' });
  }

  if (data.action === 'fetch') {
    const values = sheet.getDataRange().getValues();
    return createJsonResponse({ success: true, rows: values });
  }

  if (data.action === 'replace') {
    sheet.clearContents();
    if (Array.isArray(data.rows) && data.rows.length > 0) {
      sheet.getRange(1, 1, data.rows.length, data.rows[0].length).setValues(data.rows);
    }
    return createJsonResponse({ success: true });
  }

  if (data.action === 'append') {
    if (Array.isArray(data.rows) && data.rows.length > 0) {
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, data.rows.length, data.rows[0].length).setValues(data.rows);
    }
    return createJsonResponse({ success: true });
  }

  return createJsonResponse({ success: false, message: '未知 action' });
}
```

> 如果你在瀏覽器控制台看到 CORS 錯誤，表示 Apps Script 回應沒有帶 `Access-Control-Allow-Origin`。
> 請務必使用上面 `createJsonResponse()` 的寫法，讓網頁可以從 `index.html` 正常連線。
4. 部署為網路應用程式：
   - 選擇「部署」>「新增部署」
   - 部署類型選「網路應用程式」
   - 設定為「任何人，包括匿名使用者」可存取
   - 取得 Deploy URL
5. 將 `script.js` 中的 `GOOGLE_SHEETS_WEBAPP_URL` 改成該 Deploy URL

## 範例操作流程

- 第一次載入時：
  - 系統會先從 Google 試算表讀取資料
  - 合併試算表與本機資料，若試算表有新資料將同步回本機
  - 再把最後合併結果寫回試算表
- 新增午餐時：
  - 本機新增一筆
  - 同時呼叫 `append` 將新項目推送到試算表

## 注意事項

- 如果 `GOOGLE_SHEETS_WEBAPP_URL` 未設定，Google 同步功能會跳過
- 若同步失敗，頁面會顯示同步狀態訊息
- 同一名稱資料視為重複，系統只保留其中一筆

## 開發過程紀錄

1. 建立基礎 HTML/CSS/JS，先顯示選項清單與按鈕
2. 使用 SVG 建立輪盤，每個項目從圓心等分成扇形
3. 增加順時針旋轉邏輯，並讓速度介於 30~200 度/秒
4. 設計新增午餐功能，並新增英文名稱欄位
5. 加入自動翻譯功能（MyMemory API + 轉換備援）
6. 加入 Google 試算表同步，支援 fetch / replace / append

## 如何測試

1. 本機直接打開 `index.html`
2. 確認輪盤可以轉動並顯示結果
3. 新增午餐項目後，確認清單更新
4. 設定 `GOOGLE_SHEETS_WEBAPP_URL` 並重新載入頁面
5. 確認同步狀態文字顯示、試算表內有資料

---

如果你希望，也可以再幫你把 README 改成更簡潔的快速使用版。
