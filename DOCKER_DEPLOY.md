# Docker Deploy Quick Guide

Muc tieu: Chay he thong IOT chi bang Docker image da publish, khong can source code.

## 1) Yeu cau

- Docker Desktop da cai
- Docker Compose plugin da co (`docker compose version`)

## 2) Chay nhanh bang CMD

1. Tao thu muc moi:

`mkdir iot-run && cd iot-run`

2. Tai file deploy compose:

`curl -L "https://raw.githubusercontent.com/thuc123vippro/iot-project/main/docker-compose.deploy.yml" -o docker-compose.yml`

3. Chay stack:

`docker compose up -d`

4. Kiem tra:

`docker compose ps`

## 3) URL sau khi chay

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api-docs

## 4) Quan ly

- Xem log:

`docker compose logs -f`

- Dung:

`docker compose down`

- Dung va reset DB volume:

`docker compose down -v`

## 5) Loi thuong gap

- Port da dung (3000/3001/3307/1883): tat app khac dang chiem port.
- Khong tai duoc image: kiem tra internet va Docker login.
- DB khoi dong lau: cho 10-30s roi kiem tra lai `docker compose ps`.
