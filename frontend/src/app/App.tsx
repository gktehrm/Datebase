import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Sidebar, View } from "./components/Sidebar";
import { RealTimeLogs } from "./components/RealTimeLogs";
import { LogHistory } from "./components/LogHistory";
import { Statistics } from "./components/Statistics";
import { LogData } from "./components/LogCard";
import { LoginModal, AuthenticatedUser } from "./components/auth/LoginModal";
import { SignupModal } from "./components/auth/SignupModal";
import { EmailVerificationModal } from "./components/auth/EmailVerificationModal";

// Generate detailed logs
function generateDetailLogs(systemCall: string, riskLevel: string, timestamp: Date): string[] {
  const logs: string[] = [];
  const unixTime = Math.floor(timestamp.getTime() / 1000);

  // Common data fields
const bashCommands = [
  'Bash: {"command": "whoami && id", "description": "Check current user and privileges"}',

  'Bash: {"command": "ls -la /tmp/workspace/code.md 2>&1", "description": "Check if code.md exists"}',
];

return [
  bashCommands[Math.floor(Math.random() * bashCommands.length)]
];
}
function generateActions(
  agentName: string,
  timestamp: Date,
  systemCall: string,
  riskLevel: string
) {
  return [
    {
      actionNo: 2,
      agentName,
      createdAt: timestamp.toISOString(),
      syscall: "execve",
      argv: "/usr/bin/git -c core.quotepath=false ls-files --others --exclude-standard",
      rawSummary:
        "execve /usr/bin/git /usr/bin/git -c core.quotepath=false ls-files --others --exclude-standard",
      meaning: "Git 저장소 조회",
      ruleResult: "safe",
    },
    {
      actionNo: 3,
      agentName,
      createdAt: timestamp.toISOString(),
      syscall: systemCall,
      argv: systemCall === "lstat" ? "lstat /dev/shm/test.txt" : "cat /dev/shm/test.txt",
      rawSummary:
        systemCall === "lstat"
          ? "lstat /dev/shm/test.txt"
          : "execve /usr/bin/cat cat /dev/shm/test.txt",
      meaning: riskLevel === "harmful" ? "위험 가능성이 있는 시스템 작업" : "파일 또는 경로 상태 조회",
      ruleResult: riskLevel === "normal" ? "safe" : "review",
    },
  ];
}
// Mock data generator
function generateMockLog(id: number, timestamp: Date): LogData {
  const riskLevels: Array<"harmful" | "ambiguous" | "normal"> = ["harmful", "ambiguous", "normal"];
  const events = [
    "파일 시스템 접근",
    "네트워크 요청",
    "데이터베이스 쿼리",
    "API 호출",
    "시스템 명령 실행",
    "권한 상승 시도",
    "외부 라이브러리 로드",
    "사용자 데이터 접근",
  ];
  const models = ["GPT", "GEMINI", "CLAUDE", "CODEX"];

  // Dangerous system calls for harmful logs
  const dangerousSystemCalls = [
    "unlink",
    "unlinkat",
    "rmdir",
    "truncate",
    "ftruncate",
    "execve",
    "chmod",
    "fchmod",
    "chown",
    "fchown",
    "setuid",
    "setgid",
    "setresuid",
    "setresgid",
    "capset",
    "mount",
    "umount",
    "umount2",
    "chroot",
    "reboot",
    "init_module",
    "delete_module",
    "kill",
    "connect",
    "sendto",
    "sendmsg",
  ];

  // Normal system calls for ambiguous and normal logs
  const normalSystemCalls = [
    "open",
    "read",
    "write",
    "close",
    "stat",
    "fstat",
    "lstat",
    "poll",
    "lseek",
    "mmap",
    "mprotect",
    "munmap",
    "brk",
    "socket",
    "accept",
    "bind",
    "listen",
    "getpid",
    "getuid",
    "getgid",
  ];

  const descriptions = [
    "시스템 파일에 대한 읽기 작업을 수행했습니다.",
    "외부 API 엔드포인트로 HTTP 요청을 전송했습니다.",
    "데이터베이스에 SELECT 쿼리를 실행했습니다.",
    "새로운 프로세스를 생성하려고 시도했습니다.",
    "파일 권한을 변경하려고 시도했습니다.",
    "환경 변수에 접근했습니다.",
    "타사 라이브러리를 동적으로 로드했습니다.",
    "사용자 인증 정보에 접근했습니다.",
  ];

  const prompts = [
  "현재 폴더 상태를 확인해줘",
  "RAM에 hello 파일을 만들고 내용을 읽어줘",
  "프로젝트 파일 목록을 확인해줘",
  "임시 파일을 생성하고 실행 결과를 보여줘",
  "Git 저장소에서 변경되지 않은 파일을 확인해줘",
];

  const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

  // Only harmful logs require approval
  const requiresApproval = riskLevel === "ambiguous";

  // Select system call based on risk level
  const systemCall = riskLevel === "harmful"
    ? dangerousSystemCalls[Math.floor(Math.random() * dangerousSystemCalls.length)]
    : normalSystemCalls[Math.floor(Math.random() * normalSystemCalls.length)];

  // Generate detailed logs
  const detailLogs = generateDetailLogs(systemCall, riskLevel, timestamp);
  const model = models[Math.floor(Math.random() * models.length)];

  return {
    id: `LOG-${String(id).padStart(6, "0")}`,
    timestamp,
    eventName: events[Math.floor(Math.random() * events.length)],
    riskLevel,
    model,
    systemCall,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    requiresApproval,
    approvalStatus: null,
    
    detailLogs,
    userPrompt: prompts[Math.floor(Math.random() * prompts.length)],
    actions: generateActions(model, timestamp, systemCall, riskLevel),
  };
}

// Generate historical logs (past 3 days)
function generateHistoricalLogs(): LogData[] {
  const logs: LogData[] = [];
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 50; i++) {
    const randomTime = new Date(
      threeDaysAgo.getTime() + Math.random() * (now.getTime() - threeDaysAgo.getTime())
    );
    const log = generateMockLog(i + 1, randomTime);

    // Simulate some harmful logs having been approved/rejected
    if (log.requiresApproval && Math.random() < 0.7) {
      log.approvalStatus = Math.random() < 0.6 ? "approved" : "rejected";
    }

    logs.push(log);
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>("realtime");
  const [historicalLogs, setHistoricalLogs] = useState<LogData[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<LogData[]>([]);
  const [logCounter, setLogCounter] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Auth modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Initialize historical logs
  useEffect(() => {
    setHistoricalLogs(generateHistoricalLogs());
  }, []);

  // Add new real-time logs periodically
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newLog = generateMockLog(logCounter, new Date());

      // Add new log at the beginning (top) of the array
      setRealtimeLogs((prev) => [newLog, ...prev]);
      setLogCounter((c) => c + 1);

      // Pause if approval is required (only harmful logs)
      if (newLog.requiresApproval) {
        setIsPaused(true);
      }
    }, 3000); // New log every 3 seconds

    return () => clearInterval(interval);
  }, [logCounter, isPaused]);

  const handleApproval = useCallback((logId: string, approved: boolean) => {
    setRealtimeLogs((prev) =>
      prev.map((log) =>
        log.id === logId
          ? { ...log, approvalStatus: approved ? "approved" : "rejected" }
          : log
      )
    );
    setIsPaused(false);
  }, []);

  const handleEmailVerification = (email: string) => {
    setVerificationEmail(email);
    setShowSignupModal(false);
    setShowEmailVerificationModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setAuthenticatedUser(null);
  };

  return (
    <div className="size-full flex bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={authenticatedUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full p-8 overflow-auto">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {currentView === "realtime" && (
              <RealTimeLogs logs={realtimeLogs} onApproval={handleApproval} />
            )}
            {currentView === "history" && (
              <LogHistory logs={[...historicalLogs, ...realtimeLogs]} />
            )}
            {currentView === "statistics" && (
              <Statistics
                historicalLogs={historicalLogs}
                realtimeLogs={realtimeLogs}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={setAuthenticatedUser}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
        onEmailVerification={handleEmailVerification}
      />
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        email={verificationEmail}
        onSwitchToLogin={() => {
          setShowEmailVerificationModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}
