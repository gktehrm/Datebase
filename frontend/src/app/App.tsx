import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Sidebar, View } from "./components/Sidebar";
import { RealTimeLogs } from "./components/RealTimeLogs";
import { LogHistory } from "./components/LogHistory";
import { Statistics } from "./components/Statistics";
import { LogData } from "./components/LogCard";
import { LoginModal } from "./components/auth/LoginModal";
import { SignupModal } from "./components/auth/SignupModal";
import { EmailVerificationModal } from "./components/auth/EmailVerificationModal";
import { UserCircle } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("realtime");
  const [historicalLogs] = useState<LogData[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<LogData[]>([]);

  // Auth modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleApproval = useCallback((logId: string, approved: boolean) => {
    setRealtimeLogs((prev) =>
      prev.map((log) =>
        log.id === logId
          ? { ...log, approvalStatus: approved ? "approved" : "rejected" }
          : log
      )
    );
  }, []);

  const handleEmailVerification = (email: string) => {
    setVerificationEmail(email);
    setShowSignupModal(false);
    setShowEmailVerificationModal(true);
  };

  return (
    <div className="size-full flex bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

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

      {/* Auth Button - Floating */}
      <button
        onClick={() => setShowLoginModal(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 z-40"
        title="로그인"
      >
        <UserCircle className="w-6 h-6" />
      </button>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
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
