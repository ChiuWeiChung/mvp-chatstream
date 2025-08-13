FROM node:20-alpine as builder

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有檔案
COPY . .

# build
RUN npm run build

# 生產階段：使用 nginx-rtmp 支援 HLS 串流
FROM tiangolo/nginx-rtmp
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /www

# 暴露埠號 (8080 for web, 1935 for RTMP)
EXPOSE 8080 1935

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]