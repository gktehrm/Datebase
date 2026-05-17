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

나중에 DB 실제 데이터를 UI에 보이게 하려면 흐름은 이렇게 잡으면 됩니다.

text



DB
→ backend API
→ frontend fetch()
→ realtimeLogs / historicalLogs state
→ 기존 LogCard UI에 표시



현재 프론트는 이미 LogData (line 5) 타입에 맞는 배열만 받으면 화면에 표시할 수 있습니다.

1. DB에 로그 테이블 만들기

예시로 이런 형태가 필요합니다.

sql



CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  event_name TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  model TEXT NOT NULL,
  system_call TEXT NOT NULL,
  description TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT,
  detail_logs TEXT[]
);



risk_level은 "harmful", "ambiguous", "normal" 중 하나여야 프론트와 잘 맞습니다.

2. 백엔드에 로그 조회 API 추가

backend/server.js (line 1)에 예를 들어 이런 API를 추가합니다.

js



app.get("/logs", async (req, res) => {
  const result = await pool.query(`
    SELECT
      id,
      timestamp,
      event_name,
      risk_level,
      model,
      system_call,
      description,
      requires_approval,
      approval_status,
      detail_logs
    FROM logs
    ORDER BY timestamp DESC
  `);

  res.json(result.rows);
});



3. 프론트에서 API 호출

frontend/src/app/App.tsx (line 13)에 useEffect를 다시 추가해서 DB 로그를 받아오면 됩니다.

tsx



useEffect(() => {
  async function loadLogs() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/logs`);
    const rows = await res.json();

    const logs = rows.map((row: any) => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      eventName: row.event_name,
      riskLevel: row.risk_level,
      model: row.model,
      systemCall: row.system_call,
      description: row.description,
      requiresApproval: row.requires_approval,
      approvalStatus: row.approval_status,
      detailLogs: row.detail_logs,
    }));

    setRealtimeLogs(logs);
  }

  loadLogs();
}, []);



이때 App.tsx import도 다시 이렇게 바꿔야 합니다.

tsx



import { useState, useEffect, useCallback } from "react";



4. 실시간 데이터가 필요하면

단순 조회면 fetch()로 충분합니다. 하지만 시스템 로그가 계속 들어오고 UI에 바로 떠야 한다면 둘 중 하나를 쓰면 됩니다.


쉬운 방식: 3초마다 /logs를 다시 호출하는 polling

좋은 방식: WebSocket 또는 Server-Sent Events로 새 로그만 프론트에 push


처음 연결은 polling으로 시작하는 게 제일 단순합니다.

핵심

DB 데이터를 프론트에 바로 붙이는 게 아니라, 반드시 중간에 백엔드 API가 필요합니다. 그리고 백엔드에서 내려주는 데이터를 LogData 형태로 변환해서 realtimeLogs 또는 historicalLogs에 넣으면 기존 UI 틀은 그대로 재사용됩니다.