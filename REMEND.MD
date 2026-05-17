BACKEND npm run dev
Frontend npm run dev

지금은 내 컴퓨터로만 가능 -> 전체로 전환해야 함
① 내 PC IP 확인

Windows 터미널에서:

ipconfig

👉 여기서 이거 찾기:

IPv4 주소 : 192.168.xxx.xxx

예:

192.168.0.12
② backend .env 수정
BACKEND_URL=http://192.168.0.12:5000

👉 기존 localhost → IP로 변경

③ server.js 수정 (중요)
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});

👉 이거 안 하면 외부 접근 안 됨

④ 서버 재시작
npm run dev
⑤ frontend도 수정

frontend/.env

VITE_API_URL=http://192.168.0.12:5000

👉 이것도 localhost → IP로 변경

그리고:

npm run dev