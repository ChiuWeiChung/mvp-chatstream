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

## 技術棧 (Tech Stack)

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
- **better-auth** & **SQLite (better-sqlite3)**  
  > better-sqlite3 僅用於配合 better-auth 驗證（儲存使用者登入資料）。

### 環境 (By Docker Image)
- **node:20-alpine**
- **tiangolo/nginx-rtmp**
  > 1.處理靜態網頁的 Proxy 以及串流推播 (RTMP)

### 部署與啟動
- 使用 **Docker** 進行前後端獨立容器化
- 根目錄包含 `docker-compose.yml` 作為啟動入口
- 前端 Dockerfile 內含 **RTMP Server Nginx Image**，用於推播與串流

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

## 如何啟動 (Production mode)
1. 請在 server 資料夾底下新增 .env 
2. `.env` 配置如下

```dotenv
BETTER_AUTH_SECRET=p7YF5/SchUxSTQ2KSKRQk0P9UgG3PIX57dIe4Xm+UUc=
BETTER_AUTH_URL=http://localhost:3001 # 後端 Server 的 URL
CLIENT_AUTH_URL=http://localhost:8080 # 前端 Server 的 URL
STREAM_KEY_SECRET=vcnKDJL8eSZ8Z5cmxQxUHSOAS8qVPZcIfotYds/Gx40=
PORT=3001
```

其中的 `BETTER_AUTH_SECRET` 是給 better-auth 加密使用，另外 `STREAM_KEY_SECRET` 則是用來產生串流通道金鑰所需的 secret key，都可以在 terminal 透過指令產生

```bash
openssl rand -base64 32
```

3. 請在 server 資料夾底下透過下方指令新增 database.db 

   ```console
   npx @better-auth/cli migrate
   ```
4. 請在 client 資料夾底下新增 .env 
5. `.env` 配置如下

   ```dotenv
   VITE_API_URL=http://localhost:3001 #需對應 server 設定檔中的 BETTER_AUTH_URL
   ```

6. 在專案跟目錄下執行 `docker-compose.yml`

   ```console
   docker-compose up --build -d
   ```
7. 使用瀏覽器連線: http://localhost:8080
8. 準備推播工具 (ex: OBS)
   1. 以下以 OBS 舉例

## 可以改進的地方

這個小小專案目的是在實現即時通訊與影像串流的功能，feature 確實實現了，但其實有些地方 (ex: 安全性，邊際效應等議題沒有考慮完全)，但就有點像是「輪子造好了」、「車子也會跑」，但這台車有些螺絲可能沒有拴
緊，而且這台車只是個「滑板車」，所以在我看來還有許多可以改近修正的地方，未來有機會慢慢補足，以下是我覺得這個專案可以優化的地方

1. 商業邏輯待修正
   1. 目前只要是登入者可以在不同頻道之間新增房間，有點不直覺
   2. 登入者應該要有專屬自己的房間登入者應該要有專屬自己的房間，登入人員可以在自己的房間新增所謂的「類別」，以此反映到不同的 namespace (頻道類別)
2. 影音串流的延遲
   1. 不管是 HLS 或是 DASH 的協議，多多少少都會有所謂的延遲，因此得從設定方面著墨，看還有哪些參數可以把延遲降低
   2. 如果真的要達到低延遲，後續會研究一下 WebRTC 搭配 media server 來實現，待研究
3. **頻道（namespace）** 與 **房間（room）** 的控管
   1. 目前房間的資料僅透過 Server 變數來維護，當 Server 重啟後，房間資料就會遺失，後需需要透過 DB (比如說現在的 sqlite) 來管控
4. 其他
   1. 前端新增 Debounce 避免過度渲染
   2. 加強 RTMP Server 串流驗證機制 (on connect/ on play 等)
      1. 擴充 on connect / on play 等階段需處理的權限
      2. 已被使用之 stream code 需要被註銷，避免重複利用