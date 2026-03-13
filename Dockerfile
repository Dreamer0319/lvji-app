FROM node:20-alpine

WORKDIR /app

# 安装后端依赖
COPY backend/package.json ./backend/
WORKDIR /app/backend
RUN npm install

# 复制后端代码
COPY backend/server.js ./

# 复制前端
WORKDIR /app
COPY frontend ./frontend

# 创建启动脚本
RUN echo '#!/bin/sh\ncd /app/backend && node server.js &\ncd /app/frontend && npx http-server -p 8080 --proxy http://localhost:8080?' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8080 3001

CMD ["/bin/sh", "/app/start.sh"]
