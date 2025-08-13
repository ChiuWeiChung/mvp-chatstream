# SockStream

## 專案簡介
SockStream 是個模擬直播平台的練習專案，主要就是想把 **WebSocket (Socket.io)** 和 **HLS 影音串流** 這兩個技術組合在一起玩玩看。  

使用者登入後，可以在不同的 **頻道 (namespace)** 裡建立或加入房間 (**room**)：  
- 如果你是房主 (host)，就能直接推送直播畫面
- 如果你是觀眾，就能即時收看並在聊天室裡互動

這個專案主要是想練習「即時通訊」和「影音串流」的整合，所以資料儲存、頻道管理等功能都刻意簡化，專心把重點放在直播與聊天的體驗上。

## 專案定位
這是一個**學習型專案**，因為近期接觸並學習了 **WebSocket (Socket.io)** 以及 **HLS (HTTP Live Streaming)** 技術，想透過實際整合應用來加深理解，所以就做了這個模擬直播互動平台的完整範例。  

為了專注在核心技術的學習上，刻意把資料處理和頻道管理簡化了：
- 頻道 (**namespace**) 直接在後端寫死
- 房間 (**room**) 資料不做持久化儲存
- 資料庫只用來存使用者登入相關的基本資訊  

這樣可以把重點放在即時通訊與影音串流的整合實作上，不用被複雜的資料庫設計或商業邏輯分散注意力。

## 技術堆疊
### 前端
- **React**
- **React Router 7**
- **Tailwind CSS**
- **Socket.io Client**
- **HLS.js**

### 後端
- **Node.js**
- **Express**
- **Socket.io**
- **better-auth**（支援 Google Provider 與 email/password 登入）
- **SQLite (better-sqlite3)**  
  > 僅用於配合 better-auth 的 OAuth 驗證需求，儲存使用者登入資料，沒有額外應用。

### 部署與啟動
- 使用 **Docker** 進行前後端獨立容器化
- 根目錄包含 `docker-compose.yml` 作為啟動入口
- 前端 Dockerfile 內含 **RTMP Server Nginx Image**，用於推播與轉碼

## 核心功能
1. **使用者登入 / 登出**  
   - 支援 Google Provider 登入  
   - 支援 email/password 登入（作為次要方式）
2. **建立房間（Host 模式）**  
   - 房主擁有推播直播的權限
3. **串流推播（Host）**  
   - 使用 HLS 技術進行影音推送
4. **即時聊天室（Socket.io）**  
   - 支援訊息同步與多人即時互動
5. **房間列表 / 類別瀏覽**  
   - 根據 namespace 顯示房間清單
6. **視訊播放（HLS）**  
   - 使用 HLS.js 於瀏覽器播放直播

## 安裝與執行
> 待補