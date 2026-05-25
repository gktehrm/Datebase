import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Shield,
  Terminal,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

export interface ActionLog {
  actionNo: number;
  agentName: string;
  createdAt: string;
  syscall: string;
  argv: string;
  rawSummary: string;
  meaning: string;
  ruleResult: "safe" | "review" | "danger" | string;
}

export interface LogData {
  id: string;
  timestamp: Date;
  eventName: string;
  riskLevel: "harmful" | "ambiguous" | "normal";
  model: string;
  systemCall: string;
  description: string;

  userPrompt?: string;

  requiresApproval?: boolean;
  approvalStatus?: "approved" | "rejected" | null;

  actions?: ActionLog[];
  detailLogs?: string[];
}

interface LogCardProps {
  log: LogData;
  onApproval?: (logId: string, approved: boolean) => void;
  index?: number;
}

const riskConfig = {
  harmful: {
    label: "Harmful",
    bg: "bg-[var(--harmful-bg)]",
    border: "border-[var(--harmful)]",
    text: "text-[var(--harmful)]",
    icon: AlertCircle,
  },
  ambiguous: {
    label: "Ambiguous",
    bg: "bg-[var(--ambiguous-bg)]",
    border: "border-[var(--ambiguous)]",
    text: "text-[var(--ambiguous)]",
    icon: AlertCircle,
  },
  normal: {
    label: "Normal",
    bg: "bg-[var(--normal-bg)]",
    border: "border-[var(--normal)]",
    text: "text-[var(--normal)]",
    icon: Shield,
  },
};

function getRuleBadgeStyle(ruleResult: string) {
  if (ruleResult === "safe") {
    return "bg-emerald-50 text-emerald-700 border-emerald-300";
  }

  if (ruleResult === "review") {
    return "bg-amber-50 text-amber-700 border-amber-300";
  }

  if (ruleResult === "danger") {
    return "bg-red-50 text-red-700 border-red-300";
  }

  return "bg-slate-50 text-slate-700 border-slate-300";
}

function ActionCard({ action }: { action: ActionLog }) {
  const rows = [
    ["agent name", action.agentName],
    ["created at", action.createdAt],
    ["syscall", action.syscall],
    ["argv", action.argv],
    ["raw summary", action.rawSummary],
    ["meaning", action.meaning],
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-mono text-sm font-bold text-slate-800">
          [ACTION #{action.actionNo}]
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRuleBadgeStyle(
            action.ruleResult
          )}`}
        >
          {action.ruleResult}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[130px_1fr] gap-3 text-sm"
          >
            <div className="font-mono text-xs font-semibold text-slate-500">
              {label}
            </div>
            <div className="break-all font-mono text-xs text-slate-800">
              {value || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogCard({ log, onApproval, index = 0 }: LogCardProps) {
  const config = riskConfig[log.riskLevel];
  const RiskIcon = config.icon;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`
        relative overflow-hidden rounded-xl border-2
        ${config.bg} ${config.border}
        ${
          log.requiresApproval && !log.approvalStatus
            ? "shadow-2xl ring-4 ring-yellow-400/40"
            : "shadow-md"
        }
        transition-all duration-300 hover:shadow-lg
      `}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />

      <div className="relative p-4">
        <div
          className="mb-3 flex cursor-pointer items-center justify-between gap-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm text-foreground">
              {log.timestamp.toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${config.text} ${config.bg} ${config.border}`}
            >
              {config.label}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </div>
        </div>

        {log.userPrompt && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white/70 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <MessageSquare className="h-4 w-4" />
              사용자 프롬프트
            </div>
            <div className="break-words text-sm font-medium text-slate-800">
              {log.userPrompt}
            </div>
          </div>
        )}

        <div className="mb-3 grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Agent</div>
            <div className="font-mono text-sm font-medium text-foreground">
              {log.model}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-muted-foreground">
              시스템 호출
            </div>
            <div className="font-mono text-sm font-medium text-foreground">
              {log.systemCall}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-muted-foreground">승인 여부</div>
            <div className="text-sm font-medium">
              {log.approvalStatus === "approved" && (
                <span className="text-emerald-600">승인됨</span>
              )}
              {log.approvalStatus === "rejected" && (
                <span className="text-red-600">거부됨</span>
              )}
              {!log.approvalStatus && log.requiresApproval && (
                <span className="text-amber-600">대기중</span>
              )}
              {!log.approvalStatus && !log.requiresApproval && (
                <span className="text-slate-500">-</span>
              )}
            </div>
          </div>
        </div>

        {log.requiresApproval && !log.approvalStatus && onApproval && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex gap-3 border-t border-border pt-4"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApproval(log.id, true);
              }}
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-emerald-600 hover:shadow-xl active:scale-95"
            >
              승인 (Yes)
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApproval(log.id, false);
              }}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-red-600 hover:shadow-xl active:scale-95"
            >
              거부 (No)
            </button>
          </motion.div>
        )}

        {log.approvalStatus && (
          <div
            className={`mt-3 rounded-lg px-4 py-2 text-center text-sm font-semibold ${
              log.approvalStatus === "approved"
                ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {log.approvalStatus === "approved" ? "✓ 승인됨" : "✗ 거부됨"}
          </div>
        )}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 border-t border-slate-200 pt-4"
            >
              {log.actions && log.actions.length > 0 && (
                <div className="mb-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <RiskIcon className="h-4 w-4" />
                    분석 액션
                  </h4>

                  <div className="space-y-3">
                    {log.actions.map((action) => (
                      <ActionCard
                        key={`${action.actionNo}-${action.createdAt}`}
                        action={action}
                      />
                    ))}
                  </div>
                </div>
              )}

              {log.detailLogs && log.detailLogs.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Terminal className="h-4 w-4" />
                    상세 로그
                  </h4>

                  <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-900 p-4">
                    <div className="space-y-1 font-mono text-xs">
                      {log.detailLogs.map((logLine, idx) => (
                        <div key={idx} className="break-all text-slate-300">
                          {logLine}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}