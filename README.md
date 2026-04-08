# IOT Smart Home Project

He thong giam sat va dieu khien thiet bi trong nha thong minh voi:
- Backend Node.js + Express + MySQL + MQTT + Socket.IO
- Frontend React
- Swagger API Docs
- Docker Compose

## 1) Cau truc du an

- `server/`: Backend API, MQTT listener, Socket.IO
- `web-control/`: Frontend React dashboard
- `docker-compose.yml`: Chay toan bo stack bang Docker

## 2) Yeu cau moi truong

- Node.js 18+
- npm
- MySQL 8 (neu chay local khong dung Docker)
- MQTT broker (neu chay local khong dung Docker)
- Docker Desktop (neu chay bang Docker)

## 3) Chay local (khong Docker)

### 3.1 Backend

1. Vao thu muc backend:

   `cd server`

2. Cai dependencies:

   `npm install`

3. Tao file `.env` trong `server/` voi noi dung tham khao:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=123456
   DB_NAME=smart_home_db
   PORT=3001
   MQTT_BROKER=mqtt://localhost:1883
   ```

4. Khoi tao database bang script SQL trong `server/database.txt`.

5. Chay backend:

   `npm start`

Backend mac dinh chay tai: http://localhost:3001

### 3.2 Frontend

1. Mo terminal moi, vao frontend:

   `cd web-control`

2. Cai dependencies:

   `npm install`

3. Chay frontend:

   `npm start`

Frontend mac dinh chay tai: http://localhost:3000

## 4) Chay bang Docker Compose (co source code)

Tu thu muc goc du an:

`docker compose up --build`

Services mac dinh:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- MySQL: localhost:3307
- MQTT: localhost:1883

Tat toan bo:

`docker compose down`

## 5) Chay Docker khong can source code (chi pull va run)

Muc tieu: nguoi dung cuoi khong can clone source app, chi can 1 file compose deploy.

### Windows CMD

1. Tao thu muc bat ky:

   `mkdir iot-run && cd iot-run`

2. Tai file compose deploy:

   `curl -L "https://raw.githubusercontent.com/thuc123vippro/iot-project/main/docker-compose.deploy.yml" -o docker-compose.yml`

3. Chay he thong (tu dong pull image neu chua co):

   `docker compose up -d`

4. Kiem tra:

   `docker compose ps`

Truy cap sau khi chay:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api-docs

Lenh dung/reset:
- Dung: `docker compose down`
- Dung va xoa volume DB: `docker compose down -v`

## 6) API Docs (Swagger)

Swagger UI khi backend dang chay:
- http://localhost:3001/api-docs

## 7) Tao API docs public (khong can localhost)

Du an da co `server/docs/index.html` va `server/docs/openapi.json` de deploy static docs.

Cach nhanh nhat:
1. Vao https://app.netlify.com/drop
2. Keo tha ca thu muc `server/docs`
3. Netlify se tra ve link public

Khi API thay doi, cap nhat lai file docs:

`cd server`

`node -e "const fs=require('fs'); const spec=require('./src/config/swagger'); fs.writeFileSync('./docs/openapi.json', JSON.stringify(spec,null,2)); console.log('Generated docs/openapi.json');"`

## 8) Git workflow co ban

Sau khi sua code:

`git add .`

`git commit -m "Your message"`

`git push`

## 9) Luu y

- Khong commit `node_modules`, `.env`, va build artifacts.
- Da bo qua bang file `.gitignore` o thu muc goc.
