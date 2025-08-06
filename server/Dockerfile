FROM node:20-alpine

# 設置工作目錄
WORKDIR /app

# 安裝 nodemon 等開發依賴
RUN npm install -g nodemon

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有檔案
COPY . .

# 暴露埠號
EXPOSE 3001

# 啟動應用程式
CMD ["npm", "start"]