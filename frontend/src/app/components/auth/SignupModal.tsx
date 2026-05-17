import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Eye, EyeOff, Mail, Lock, User, ChevronRight } from "lucide-react";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onEmailVerification: (email: string) => void;
}

export function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  onEmailVerification,
}: SignupModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreements, setAgreements] = useState({
    all: false,
    age: false,
    terms: false,
    privacy: false,
    marketing: false,
  });

  const handleAgreementChange = (key: keyof typeof agreements) => {
    if (key === "all") {
      const newValue = !agreements.all;
      setAgreements({
        all: newValue,
        age: newValue,
        terms: newValue,
        privacy: newValue,
        marketing: newValue,
      });
    } else {
      const newAgreements = { ...agreements, [key]: !agreements[key] };
      newAgreements.all =
        newAgreements.age &&
        newAgreements.terms &&
        newAgreements.privacy &&
        newAgreements.marketing;
      setAgreements(newAgreements);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!agreements.age || !agreements.terms || !agreements.privacy) {
    alert("필수 약관에 동의해주세요.");
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "회원가입 실패");
      return;
    }

    alert("회원가입 완료! 이메일 인증을 진행해주세요.");
    onEmailVerification(email);
  } catch (err) {
    console.error(err);
    alert("서버 연결 오류가 발생했습니다.");
  }
};
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-white">회원가입</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Body - Scrollable */}
              <form onSubmit={handleSignup} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      이름
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      이메일
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      비밀번호
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-slate-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Agreements */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-semibold text-slate-700">약관 동의</h3>

                    {/* All Agree */}
                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={agreements.all}
                          onChange={() => handleAgreementChange("all")}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-slate-900">모두 동의</span>
                      </div>
                    </label>

                    <div className="space-y-2 pl-2">
                      {/* Age Agreement */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={agreements.age}
                            onChange={() => handleAgreementChange("age")}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">만 14세 이상입니다</span>
                        </div>
                      </label>

                      {/* Terms Agreement */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={agreements.terms}
                            onChange={() => handleAgreementChange("terms")}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">이용약관 동의</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                      </label>

                      {/* Privacy Agreement */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={agreements.privacy}
                            onChange={() => handleAgreementChange("privacy")}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">
                            개인정보 수집 및 이용 동의
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                      </label>

                      {/* Marketing Agreement */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={agreements.marketing}
                            onChange={() => handleAgreementChange("marketing")}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-500">
                            마케팅 정보 이메일 수신 동의 (선택)
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                      </label>
                    </div>
                  </div>

                  {/* Signup Button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    회원가입
                  </button>

                  {/* Login Link */}
                  <div className="text-center pt-2 pb-2">
                    <span className="text-sm text-slate-600">이미 회원이신가요? </span>
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      로그인
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
