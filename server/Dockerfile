# /server/Dockerfile

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000

# Đổi dòng cuối thành lệnh chạy thực tế của bạn
CMD ["node", "src/server.js"]