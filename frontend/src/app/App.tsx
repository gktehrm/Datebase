import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sidebar, View } from "./components/Sidebar";
import { RealTimeLogs } from "./components/RealTimeLogs";
import { LogHistory } from "./components/LogHistory";
import { Statistics } from "./components/Statistics";
import { ActionLog, LogData } from "./components/LogCard";
import { LoginModal, AuthenticatedUser } from "./components/auth/LoginModal";
import { SignupModal } from "./components/auth/SignupModal";
import { EmailVerificationModal } from "./components/auth/EmailVerificationModal";

type GuardActionRecord = {
  id?: number;
  action_order?: number;
  agent_name?: string | null;
  event_id?: string | null;
  created_at?: string | null;
  syscall?: string | null;
  path?: string | null;
  argv?: string | null;
  raw_summary?: string | null;
  summary?: string | null;
  meaning?: string | null;
  normalized_action?: string | null;
  target_class?: string | null;
  rule_result?: string | null;
};

type GuardRunRecord = {
  id: number;
  agent_name: string;
  user_prompt: string;
  ai_agent_reasoning?: string | null;
  rule_base_result?: string | null;
  rule_base_reason?: string | null;
  guard_llm_result?: string | null;
  guard_llm_reason?: string | null;
  final_decision: "ALLOW" | "USER_CONFIRM" | "BLOCK";
  approval_status?: "pending" | "approved" | "rejected" | null;
  created_at: string;
  actions?: GuardActionRecord[];
};

type GuardRunDetailRecord = {
  run: GuardRunRecord;
  actions: GuardActionRecord[];
};

type GuardRunStreamMessage =
  | { type: "connected" }
  | { type: "guard-run-created"; run: GuardRunRecord; actions: GuardActionRecord[] }
  | { type: "guard-run-updated"; run: GuardRunRecord };

const API_URL = import.meta.env.VITE_API_URL;

function mapDecisionToRiskLevel(
  decision: GuardRunRecord["final_decision"]
): LogData["riskLevel"] {
  if (decision === "BLOCK") {
    return "harmful";
  }

  if (decision === "USER_CONFIRM") {
    return "ambiguous";
  }

  return "normal";
}

function mapActionRecordToLogAction(action: GuardActionRecord): ActionLog {
  const argv = [action.argv, action.path].filter(Boolean).join(" | ");
  const rawSummary = [action.raw_summary, action.summary]
    .filter(Boolean)
    .join("\n");

  return {
    actionNo: action.action_order ?? 0,
    agentName: action.agent_name ?? "unknown",
    eventId: action.event_id ?? undefined,
    createdAt: action.created_at ?? "",
    syscall: action.syscall ?? "-",
    path: action.path ?? undefined,
    argv: argv || "-",
    rawSummary: rawSummary || "-",
    summary: action.summary ?? undefined,
    meaning: action.meaning ?? "-",
    normalizedAction: action.normalized_action ?? undefined,
    targetClass: action.target_class ?? undefined,
    ruleResult: action.rule_result ?? "safe",
  };
}

function mapRunToLogData(
  run: GuardRunRecord,
  actions: GuardActionRecord[] = run.actions ?? []
): LogData {
  const firstAction = actions[0];
  const detailLogs = [
    run.ai_agent_reasoning,
    run.rule_base_result ? `RULE BASE RESULT: ${run.rule_base_result}` : null,
    run.rule_base_reason ? `RULE BASE REASON: ${run.rule_base_reason}` : null,
    run.guard_llm_result ? `GUARD LLM RESULT: ${run.guard_llm_result}` : null,
    run.guard_llm_reason ? `GUARD LLM REASON: ${run.guard_llm_reason}` : null,
    `FINAL DECISION: ${run.final_decision}`,
  ].filter(Boolean) as string[];

  return {
    id: String(run.id),
    timestamp: new Date(run.created_at),
    eventName: run.final_decision,
    riskLevel: mapDecisionToRiskLevel(run.final_decision),
    model: run.agent_name,
    systemCall: firstAction?.syscall ?? "-",
    description:
      run.guard_llm_reason ??
      run.rule_base_reason ??
      "No additional explanation provided.",
    userPrompt: run.user_prompt,
    requiresApproval: run.approval_status === "pending",
    approvalStatus:
      run.approval_status === "approved" || run.approval_status === "rejected"
        ? run.approval_status
        : null,
    actions: actions.map(mapActionRecordToLogAction),
    detailLogs,
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>("realtime");
  const [historicalLogs, setHistoricalLogs] = useState<LogData[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<LogData[]>([]);
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedUser | null>(() => {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadGuardRuns() {
      try {
        const response = await fetch(`${API_URL}/guard-runs`);
        if (!response.ok) {
          throw new Error(`Failed to load guard runs: ${response.status}`);
        }

        const rows: GuardRunRecord[] = await response.json();
        if (cancelled) {
          return;
        }

        setHistoricalLogs(rows.map((row) => mapRunToLogData(row, row.actions ?? [])));
      } catch (error) {
        console.error(error);
      }
    }

    loadGuardRuns();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/guard-runs/stream`);

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as GuardRunStreamMessage;

        if (message.type === "guard-run-created") {
          const newLog = mapRunToLogData(message.run, message.actions);

          setRealtimeLogs((prev) => {
            const filtered = prev.filter((log) => log.id !== newLog.id);
            return [newLog, ...filtered];
          });

          setHistoricalLogs((prev) =>
            prev.filter((log) => log.id !== String(message.run.id))
          );
        }

        if (message.type === "guard-run-updated") {
          setRealtimeLogs((prev) =>
            prev.map((log) =>
              log.id === String(message.run.id)
                ? {
                    ...log,
                    requiresApproval: message.run.approval_status === "pending",
                    approvalStatus:
                      message.run.approval_status === "approved" ||
                      message.run.approval_status === "rejected"
                        ? message.run.approval_status
                        : null,
                  }
                : log
            )
          );

          setHistoricalLogs((prev) =>
            prev.map((log) =>
              log.id === String(message.run.id)
                ? {
                    ...log,
                    requiresApproval: message.run.approval_status === "pending",
                    approvalStatus:
                      message.run.approval_status === "approved" ||
                      message.run.approval_status === "rejected"
                        ? message.run.approval_status
                        : null,
                  }
                : log
            )
          );
        }
      } catch (error) {
        console.error(error);
      }
    };

    eventSource.onerror = (error) => {
      console.error(error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const allLogs = useMemo(
    () => [...realtimeLogs, ...historicalLogs],
    [realtimeLogs, historicalLogs]
  );

  const handleApproval = async (logId: string, approved: boolean) => {
    try {
      const response = await fetch(`${API_URL}/guard-runs/${logId}/approval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approval_status: approved ? "approved" : "rejected",
          approved_by: authenticatedUser?.id ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update approval: ${response.status}`);
      }

      const data: { run: GuardRunRecord } = await response.json();
      const nextStatus =
        data.run.approval_status === "approved" || data.run.approval_status === "rejected"
          ? data.run.approval_status
          : null;

      setRealtimeLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? { ...log, approvalStatus: nextStatus, requiresApproval: false }
            : log
        )
      );

      setHistoricalLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? { ...log, approvalStatus: nextStatus, requiresApproval: false }
            : log
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

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
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={authenticatedUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      <main className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-8">
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
            {currentView === "history" && <LogHistory logs={allLogs} />}
            {currentView === "statistics" && (
              <Statistics
                historicalLogs={historicalLogs}
                realtimeLogs={realtimeLogs}
              />
            )}
          </motion.div>
        </div>
      </main>

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
