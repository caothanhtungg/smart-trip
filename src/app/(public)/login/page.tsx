"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  RotateCw,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { isSafeCallbackUrl } from "@/proxy";

function LoginUrlListener({
  onError,
  onCallbackUrl,
}: {
  onError: (msg: string) => void;
  onCallbackUrl: (url: string) => void;
}) {
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorList = searchParams.getAll("error");
    const isGoogleOAuth =
      searchParams.get("oauth_source") === "google" ||
      searchParams.get("error") === "google_oauth" ||
      errorList.includes("google_oauth");

    if (errorList.includes("account_not_linked")) {
      onError("Tài khoản email này đã được tạo trước đó. Hệ thống đã mở liên kết tự động, vui lòng bấm đăng nhập lại bằng Google.");
    } else if (errorList.includes("access_denied")) {
      onError("Bạn đã hủy thao tác đăng nhập bằng Google.");
    } else if (isGoogleOAuth) {
      onError("Đăng nhập bằng Google không thành công hoặc đã bị hủy. Vui lòng thử lại.");
    } else if (errorParam) {
      onError("Đăng nhập thất bại. Vui lòng thử lại sau.");
    }

    const callbackParam = searchParams.get("callbackUrl");
    if (callbackParam && isSafeCallbackUrl(callbackParam)) {
      onCallbackUrl(callbackParam);
    }
  }, [searchParams, onError, onCallbackUrl]);
  return null;
}

function mapAuthErrorMessage(msg?: string): string {
  if (!msg) return "Đã xảy ra lỗi, vui lòng kiểm tra lại thông tin và thử lại.";
  const lower = msg.toLowerCase();
  if (
    lower.includes("invalid email or password") ||
    lower.includes("invalid password") ||
    lower.includes("invalid credentials")
  ) {
    return "Email hoặc mật khẩu không chính xác.";
  }
  if (lower.includes("already exists") || lower.includes("user already exist")) {
    return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.";
  }
  if (lower.includes("password is too short") || lower.includes("min")) {
    return "Mật khẩu quá ngắn, vui lòng nhập tối thiểu 8 ký tự.";
  }
  if (lower.includes("invalid email")) {
    return "Định dạng email không hợp lệ.";
  }
  return msg;
}

export default function LoginPage() {
  const [authMode, setAuthMode] = React.useState<"signin" | "signup">("signin");
  const [signupStep, setSignupStep] = React.useState<"form" | "otp">("form");
  const [legalModalOpen, setLegalModalOpen] = React.useState<"terms" | "privacy" | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = React.useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = React.useState<string>("/trips");

  // Form states
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // OTP states
  const [generatedOtp, setGeneratedOtp] = React.useState<string>("");
  const [otpDigits, setOtpDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = React.useState<number>(60);
  const [copiedOtp, setCopiedOtp] = React.useState(false);
  const [isDelivered, setIsDelivered] = React.useState<boolean>(false);
  const [, setSandboxNotice] = React.useState<string | null>(null);
  const otpInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  React.useEffect(() => {
    if (signupStep !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [signupStep, resendCooldown]);

  const resetFormFeedback = () => {
    setAuthError(null);
    setAuthSuccess(null);
  };

  const handleSwitchTab = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setSignupStep("form");
    resetFormFeedback();
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      resetFormFeedback();
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
        errorCallbackURL: `/login?oauth_source=google&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      });
      if (res?.error) {
        setAuthError(
          res.error.message ||
          "Không thể kết nối đến Google. Vui lòng kiểm tra lại cấu hình và thử lại."
        );
        setIsSubmitting(false);
        return;
      }
      if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch {
      setAuthError("Không thể kết nối đến Google. Vui lòng kiểm tra lại cấu hình và thử lại.");
      setIsSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setAuthError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (!password) {
      setAuthError("Vui lòng nhập mật khẩu của bạn.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authClient.signIn.email({
        email: trimmedEmail,
        password,
        callbackURL: callbackUrl,
      });

      if (res?.error) {
        setAuthError(mapAuthErrorMessage(res.error.message));
        setIsSubmitting(false);
        return;
      }

      setAuthSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      window.location.href = callbackUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      setAuthError(mapAuthErrorMessage(msg));
      setIsSubmitting(false);
    }
  };

  // Step 1 of Sign Up: Validate Form and generate OTP via /api/auth/send-otp
  const handleInitiateSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setAuthError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setAuthError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (password.length < 8) {
      setAuthError("Mật khẩu cần tối thiểu 8 ký tự để đảm bảo an toàn.");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, name: trimmedName }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        setAuthError(data.error || "Không thể gửi mã xác thực. Vui lòng thử lại.");
        setIsSubmitting(false);
        return;
      }

      const delivered = Boolean(data.delivered || data.data?.delivered);
      setIsDelivered(delivered);
      setGeneratedOtp(data.demoOtp || data.data?.demoOtp || "");
      setSandboxNotice(data.sandboxNotice || data.data?.sandboxNotice || null);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setSignupStep("otp");

      if (delivered) {
        setAuthSuccess("Mã OTP đã được gửi đến email của bạn!");
      }
    } catch {
      setAuthError("Không thể kết nối đến máy chủ gửi mã OTP. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  };

  // Step 2 of Sign Up: Verify OTP and create account
  const handleVerifyOtpAndCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length < 6) {
      setAuthError("Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.");
      return;
    }

    try {
      setIsSubmitting(true);
      // 1. Kiểm tra OTP qua backend API
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: enteredOtp }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));

      if (!verifyRes.ok || !verifyData.success) {
        const errorMsg =
          typeof verifyData.error === "object"
            ? verifyData.error?.message
            : verifyData.error;
        setAuthError(errorMsg || "Mã xác thực OTP không chính xác hoặc đã hết hạn.");
        setIsSubmitting(false);
        return;
      }

      // 2. Tạo tài khoản thông qua Better Auth
      const res = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        callbackURL: callbackUrl,
      });

      if (res?.error) {
        setAuthError(mapAuthErrorMessage(res.error.message));
        setIsSubmitting(false);
        return;
      }

      setAuthSuccess("Xác thực OTP thành công! Đang chuyển hướng vào hệ thống...");
      window.location.href = callbackUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : undefined;
      setAuthError(mapAuthErrorMessage(msg));
      setIsSubmitting(false);
    }
  };

  // OTP inputs handling
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleanDigit = val.replace(/\D/g, "");
    const updated = [...otpDigits];

    if (!cleanDigit) {
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    updated[index] = cleanDigit.slice(-1);
    setOtpDigits(updated);
    resetFormFeedback();

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    resetFormFeedback();
    const nextIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIdx]?.focus();
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    try {
      setIsSubmitting(true);
      resetFormFeedback();
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        setAuthError(data.error || "Không thể gửi lại mã OTP. Vui lòng thử lại.");
        return;
      }

      const delivered = Boolean(data.delivered || data.data?.delivered);
      setIsDelivered(delivered);
      setGeneratedOtp(data.demoOtp || data.data?.demoOtp || "");
      setSandboxNotice(data.sandboxNotice || data.data?.sandboxNotice || null);
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setAuthSuccess(
        delivered
          ? "Đã gửi lại mã xác thực mới đến email của bạn!"
          : "Đã tạo mã xác thực mới (xem bên dưới)!"
      );
      otpInputsRef.current[0]?.focus();
    } catch {
      setAuthError("Lỗi kết nối khi gửi lại mã OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoFillOtp = () => {
    if (!generatedOtp) return;
    const digits = generatedOtp.split("").slice(0, 6);
    setOtpDigits(digits);
    setCopiedOtp(true);
    resetFormFeedback();
    setTimeout(() => setCopiedOtp(false), 2000);
    otpInputsRef.current[5]?.focus();
  };

  return (
    <div className="w-full min-h-screen bg-bg-canvas text-text-body dark:text-slate-200 flex flex-col justify-between items-center relative overflow-x-hidden font-sans antialiased transition-colors">
      <React.Suspense fallback={null}>
        <LoginUrlListener onError={setAuthError} onCallbackUrl={setCallbackUrl} />
      </React.Suspense>

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-lime-cream/40 dark:bg-cerulean/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-ocean-mist/20 dark:bg-baltic-blue/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar - Clean, seamless, aligned with card */}
      <nav className="w-full py-4 px-4 sm:px-6 md:px-8 z-10 !bg-transparent border-none">
        <div className="w-full max-w-[920px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại trang chủ</span>
          </Link>

          {/* Brand Center */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#184E77] text-[#D9ED92] dark:bg-[#1E293B] dark:text-[#38BDF8] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <span className="font-bold text-base sm:text-lg text-yale-blue dark:text-white tracking-tight">
              Smart Trip
            </span>
          </Link>

          {/* Language Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#141C2E] border border-slate-200/80 dark:border-[#24314A] text-[11px] sm:text-xs font-semibold text-text-muted dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Tiếng Việt</span>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          MAIN AUTH SLIDING CONTAINER (Refined based on Images 2 & 3)
          ========================================================================= */}
      <main className="my-auto py-4 sm:py-6 px-4 w-full flex justify-center items-center z-10">
        <div className="relative w-full max-w-[920px] min-h-[580px] bg-white dark:bg-[#111827] rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(24,78,119,0.12)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-slate-200/70 dark:border-[#1F2937]">
          {/* Mobile Top Segmented Tab (visible only on mobile md:hidden) */}
          <div className="md:hidden p-4 pb-0 bg-slate-50 dark:bg-[#0F172A] border-b border-slate-200/70 dark:border-[#1F2937]">
            <div className="flex rounded-xl bg-slate-200/70 dark:bg-[#1E293B] p-1">
              <button
                type="button"
                onClick={() => handleSwitchTab("signin")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === "signin"
                    ? "bg-white dark:bg-[#111827] text-yale-blue dark:text-white shadow-xs"
                    : "text-text-muted dark:text-slate-400"
                  }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab("signup")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === "signup"
                    ? "bg-white dark:bg-[#111827] text-yale-blue dark:text-white shadow-xs"
                    : "text-text-muted dark:text-slate-400"
                  }`}
              >
                Đăng ký
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              LEFT SIDE ON DESKTOP: SIGN IN FORM
              ----------------------------------------------------------------- */}
          <div
            className={`w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-center transition-all duration-700 ease-in-out ${authMode === "signin"
                ? "md:opacity-100 md:pointer-events-auto md:translate-x-0"
                : "hidden md:flex md:opacity-0 md:pointer-events-none md:-translate-x-8"
              } md:absolute md:top-0 md:left-0 md:h-full z-[2]`}
          >
            <div className="w-full max-w-sm mx-auto text-center space-y-5">
              {/* Heading */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-yale-blue dark:text-white tracking-tight">
                  Đăng nhập
                </h1>
                <p className="text-xs sm:text-sm text-text-muted dark:text-slate-400 mt-1.5">
                  Quản lý chuyến đi và quyết toán chi phí cùng nhóm
                </p>
              </div>

              {/* Social Login Button Row (Inspired by Images 2 & 3) */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#2D3E60] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:border-ocean-mist dark:hover:border-[#38BDF8] transition-all duration-200 shadow-2xs cursor-pointer group active:scale-95 disabled:opacity-60"
                  aria-label="Đăng nhập bằng tài khoản Google"
                  title="Đăng nhập với Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                </button>
              </div>

              {/* Subtitle Divider */}
              <p className="text-xs text-text-muted dark:text-slate-400">
                hoặc sử dụng Email & Mật khẩu
              </p>

              {/* Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3.5 text-left">
                {/* Email Input */}
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Địa chỉ Email"
                    autoComplete="email"
                    disabled={isSubmitting}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#2D3E60] focus:border-ocean-mist dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#0B1120] focus:ring-2 focus:ring-ocean-mist/20 dark:focus:ring-[#38BDF8]/20 text-sm text-yale-blue dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#2D3E60] focus:border-ocean-mist dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#0B1120] focus:ring-2 focus:ring-ocean-mist/20 dark:focus:ring-[#38BDF8]/20 text-sm text-yale-blue dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yale-blue dark:hover:text-white transition-colors cursor-pointer p-1"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Feedback Alerts */}
                {authError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-functional-negative/10 border border-functional-negative/20 text-xs text-functional-negative flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}
                {authSuccess && (
                  <div
                    role="status"
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Submit Button - Solid vibrant blue in dark mode, no black split */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-[#184E77] hover:bg-[#1E6091] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-60 pt-0.5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </div>
                  ) : (
                    <span>Đăng nhập</span>
                  )}
                </button>
              </form>

              {/* Mobile Quick Switch */}
              <div className="md:hidden pt-2 text-xs text-text-muted dark:text-slate-400">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchTab("signup")}
                  className="font-bold text-cerulean dark:text-[#38BDF8] hover:underline"
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              RIGHT SIDE ON DESKTOP: SIGN UP & OTP FORM
              ----------------------------------------------------------------- */}
          <div
            className={`w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-center transition-all duration-700 ease-in-out ${authMode === "signup"
                ? "md:opacity-100 md:pointer-events-auto md:translate-x-0"
                : "hidden md:flex md:opacity-0 md:pointer-events-none md:translate-x-8"
              } md:absolute md:top-0 md:left-1/2 md:h-full z-[2]`}
          >
            <div className="w-full max-w-sm mx-auto text-center space-y-4">
              {signupStep === "otp" ? (
                /* OTP STEP */
                <div className="space-y-4 text-center">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-yale-blue dark:text-white tracking-tight">
                      Xác thực mã OTP
                    </h2>
                    <p className="text-xs sm:text-sm text-text-muted dark:text-slate-400 mt-1">
                      Mã 6 chữ số đã được gửi đến:
                      <br />
                      <strong className="text-yale-blue dark:text-slate-100 font-semibold">
                        {email}
                      </strong>
                    </p>
                  </div>

                  {/* Delivery Status or Sandbox Box */}
                  {isDelivered ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs space-y-1 text-left">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Email đã gửi thành công!</span>
                      </div>
                      <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
                        Vui lòng kiểm tra hộp thư đến (hoặc spam) của <strong>{email}</strong> để lấy mã OTP.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300 text-[11px]">
                          Chế độ thử nghiệm
                        </span>
                        {generatedOtp ? (
                          <button
                            type="button"
                            onClick={handleAutoFillOtp}
                            className="text-[11px] font-bold text-cerulean dark:text-[#38BDF8] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            {copiedOtp ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedOtp ? "Đã điền" : "Tự động điền"}</span>
                          </button>
                        ) : null}
                      </div>
                      {generatedOtp ? (
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[11px] text-text-muted dark:text-slate-300">Mã:</span>
                          <strong className="font-mono text-sm tracking-widest text-yale-blue dark:text-white px-2 py-0.5 rounded bg-white dark:bg-[#1A2337] border border-amber-500/30">
                            {generatedOtp}
                          </strong>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* 6 OTP Inputs */}
                  <form onSubmit={handleVerifyOtpAndCreateAccount} className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputsRef.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={idx === 0 ? handleOtpPaste : undefined}
                          disabled={isSubmitting}
                          className="w-10 h-12 sm:w-11 sm:h-13 rounded-xl text-center text-xl font-bold font-mono bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200 dark:border-[#2D3E60] text-yale-blue dark:text-white focus:bg-white dark:focus:bg-[#0B1120] focus:border-ocean-mist dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-ocean-mist/20 dark:focus:ring-[#38BDF8]/20 outline-none transition-all shadow-2xs"
                          aria-label={`Số OTP thứ ${idx + 1}`}
                        />
                      ))}
                    </div>

                    {authError && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-functional-negative/10 border border-functional-negative/20 text-xs text-functional-negative text-left flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-xl bg-[#184E77] hover:bg-[#1E6091] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang kích hoạt...</span>
                        </div>
                      ) : (
                        <span>Xác nhận & Hoàn tất</span>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSignupStep("form");
                          resetFormFeedback();
                        }}
                        className="text-text-muted hover:text-yale-blue dark:hover:text-white transition-colors cursor-pointer"
                      >
                        ← Đổi thông tin
                      </button>
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || isSubmitting}
                        onClick={handleResendOtp}
                        className="font-bold text-cerulean dark:text-[#38BDF8] hover:underline disabled:text-text-muted disabled:no-underline disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                      >
                        <RotateCw className={`w-3 h-3 ${resendCooldown > 0 ? "animate-spin-slow opacity-60" : ""}`} />
                        <span>{resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : "Gửi lại mã"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* REGISTRATION FORM (Image 3 Style: Name, Email, Password, Confirm Password) */
                <>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-yale-blue dark:text-white tracking-tight">
                      Tạo tài khoản
                    </h1>
                    <p className="text-xs sm:text-sm text-text-muted dark:text-slate-400 mt-1.5">
                      Lên kế hoạch và chia sẻ chi phí cùng nhóm bạn
                    </p>
                  </div>

                  {/* Social Buttons Row (Google) */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      id="google-signup-btn"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#2D3E60] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:border-ocean-mist dark:hover:border-[#38BDF8] transition-all duration-200 shadow-2xs cursor-pointer group active:scale-95 disabled:opacity-60"
                      aria-label="Đăng ký bằng tài khoản Google"
                      title="Đăng ký với Google"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          fill="#EA4335"
                        />
                      </svg>
                    </button>
                  </div>

                  <p className="text-xs text-text-muted dark:text-slate-400">
                    hoặc đăng ký với Email
                  </p>

                  <form onSubmit={handleInitiateSignUp} className="space-y-3 text-left">
                    {/* Name */}
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Họ và tên"
                        autoComplete="name"
                        disabled={isSubmitting}
                        className="w-full h-11 sm:h-[46px] pl-11 pr-4 rounded-xl bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#2D3E60] focus:border-ocean-mist dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#0B1120] focus:ring-2 focus:ring-ocean-mist/20 dark:focus:ring-[#38BDF8]/20 text-sm text-yale-blue dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Địa chỉ Email"
                        autoComplete="email"
                        disabled={isSubmitting}
                        className="w-full h-11 sm:h-[46px] pl-11 pr-4 rounded-xl bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#2D3E60] focus:border-ocean-mist dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#0B1120] focus:ring-2 focus:ring-ocean-mist/20 dark:focus:ring-[#38BDF8]/20 text-sm text-yale-blue dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        className="w-full h-11 sm:h-[46px] pl-11 pr-11 rounded-xl bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#2D3E60] focus:border-ocean-mist dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#0B1120] focus:ring-2 focus:ring-ocean-mist/20 dark:focus:ring-[#38BDF8]/20 text-sm text-yale-blue dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yale-blue dark:hover:text-white transition-colors cursor-pointer p-1"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        className="w-full h-11 sm:h-[46px] pl-11 pr-11 rounded-xl bg-slate-100/90 dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#2D3E60] focus:border-ocean-mist dark:focus:border-[#38BDF8] focus:bg-white dark:focus:bg-[#0B1120] focus:ring-2 focus:ring-ocean-mist/20 dark:focus:ring-[#38BDF8]/20 text-sm text-yale-blue dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yale-blue dark:hover:text-white transition-colors cursor-pointer p-1"
                        aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {authError && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-functional-negative/10 border border-functional-negative/20 text-xs text-functional-negative flex items-start gap-2"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 sm:h-[46px] rounded-xl bg-[#184E77] hover:bg-[#1E6091] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-60 pt-0.5"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang gửi mã...</span>
                        </div>
                      ) : (
                        <span>Đăng ký</span>
                      )}
                    </button>
                  </form>

                  {/* Mobile Quick Switch */}
                  <div className="md:hidden pt-2 text-xs text-text-muted dark:text-slate-400">
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => handleSwitchTab("signin")}
                      className="font-bold text-cerulean dark:text-[#38BDF8] hover:underline"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* -----------------------------------------------------------------
              SLIDING OVERLAY PANEL ON DESKTOP (The colored card from Images 2 & 3)
              ----------------------------------------------------------------- */}
          <div
            className={`hidden md:block absolute top-0 left-0 w-1/2 h-full z-[10] transition-all duration-700 ease-in-out shadow-2xl overflow-hidden ${authMode === "signin"
                ? "translate-x-full rounded-l-[36px]"
                : "translate-x-0 rounded-r-[36px]"
              }`}
          >
            {/* Rich Coastal Gradient Background */}
            <div className="relative w-full h-full bg-gradient-to-br from-[#184E77] via-[#1E6091] to-[#168AAD] dark:from-[#0F2847] dark:via-[#16385C] dark:to-[#1A4B75] text-white p-10 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Subtle ambient glow & SVG Route line */}
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-lime-cream/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-mint-green/20 blur-3xl pointer-events-none" />

              <svg
                className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
                viewBox="0 0 400 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M-50 150 Q 150 250 250 150 T 450 350"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
                <circle cx="150" cy="200" r="5" fill="#D9ED92" />
                <circle cx="250" cy="150" r="6" fill="#76C893" />
              </svg>

              {/* OVERLAY CONTENT 1: When in Sign In view -> Prompt to Sign Up (Image 2 style) */}
              <div
                className={`transition-all duration-500 flex flex-col items-center text-center z-10 ${authMode === "signin"
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none absolute"
                  }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-lime-cream mb-6 shadow-inner">
                  <Compass className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                  Xin chào bạn!
                </h2>
                <p className="text-sm text-white/85 max-w-[280px] leading-relaxed mb-8">
                  Đăng ký tài khoản để bắt đầu lên kế hoạch và chia sẻ chi phí cùng nhóm bạn.
                </p>
                <button
                  type="button"
                  id="switch-to-signup-btn"
                  onClick={() => handleSwitchTab("signup")}
                  className="px-10 py-3 rounded-full border-2 border-white/90 text-white font-bold text-xs uppercase tracking-wider hover:!bg-white hover:!text-[#184E77] transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
                >
                  Đăng ký
                </button>
              </div>

              {/* OVERLAY CONTENT 2: When in Sign Up view -> Prompt to Sign In (Image 3 style) */}
              <div
                className={`transition-all duration-500 flex flex-col items-center text-center z-10 ${authMode === "signup"
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none absolute"
                  }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-lime-cream mb-6 shadow-inner">
                  <Compass className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                  Chào mừng trở lại!
                </h2>
                <p className="text-sm text-white/85 max-w-[280px] leading-relaxed mb-8">
                  Đăng nhập ngay để tiếp tục quản lý các chuyến đi và quyết toán cùng đồng đội.
                </p>
                <button
                  type="button"
                  id="switch-to-signin-btn"
                  onClick={() => handleSwitchTab("signin")}
                  className="px-10 py-3 rounded-full border-2 border-white/90 text-white font-bold text-xs uppercase tracking-wider hover:!bg-white hover:!text-[#184E77] transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Bottom Footer - Seamless, aligned with card, no clipping */}
      <div className="w-full pt-2 pb-6 sm:pb-8 px-4 sm:px-6 md:px-8 z-10 !bg-transparent border-none">
        <div className="w-full max-w-[920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Bảo mật an toàn theo tiêu chuẩn quốc tế</span>
          </div>

          <div className="flex items-center gap-4">
            <span>© 2026 Smart Trip Vietnam</span>
            <button
              type="button"
              onClick={() => setLegalModalOpen("terms")}
              className="hover:text-cerulean dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
            >
              Điều khoản
            </button>
            <button
              type="button"
              onClick={() => setLegalModalOpen("privacy")}
              className="hover:text-cerulean dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
            >
              Bảo mật
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LEGAL TERMS & PRIVACY MODAL
          ========================================================================= */}
      <Modal
        isOpen={legalModalOpen !== null}
        onClose={() => setLegalModalOpen(null)}
        title={
          legalModalOpen === "terms"
            ? "Điều khoản Sử dụng (Bản mẫu)"
            : "Chính sách Bảo mật (Bản mẫu)"
        }
        description="Nội dung mô phỏng giao diện — Chưa phải văn bản pháp lý chính thức"
      >
        <div className="space-y-4 py-2 text-sm text-text-body leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3.5 rounded-xl bg-bg-canvas dark:bg-[#1A2337] border border-border-hairline dark:border-[#24314A] text-xs text-text-muted dark:text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-yale-blue dark:text-white">
              <Info className="w-4 h-4 text-cerulean shrink-0" />
              <span>Ghi chú dữ liệu mẫu (Mockup Notice)</span>
            </div>
            <p>
              Đây là nội dung bản mẫu được thiết kế để mô phỏng tương tác giao diện demo. Nội dung này không phải là văn bản pháp lý hay chính sách chính thức của Smart Trip.
            </p>
          </div>

          {legalModalOpen === "terms" ? (
            <>
              <p>
                <strong>1. Mục đích sử dụng:</strong> Smart Trip hỗ trợ các nhóm bạn lên lịch trình, chia sẻ chi phí và giải quyết công nợ sau chuyến đi một cách minh bạch, tự nguyện.
              </p>
              <p>
                <strong>2. Quyền hạn Trưởng nhóm:</strong> Người tạo chuyến đi giữ vai trò Trưởng nhóm, có trách nhiệm điều phối lịch trình, quản lý thành viên và chốt sổ công nợ.
              </p>
              <p>
                <strong>3. Giao dịch tài chính:</strong> Các khoản thanh toán qua mã VietQR hoặc tiền mặt diễn ra trực tiếp giữa các thành viên ngoài hệ thống. Smart Trip chỉ đóng vai trò tính toán rút gọn nợ.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Thu thập thông tin:</strong> Hệ thống lưu trữ thông tin cơ bản do người dùng cung cấp (tên hiển thị, email, avatar) và thông tin STK ngân hàng (nếu cung cấp để nhận tiền chuyển khoản).
              </p>
              <p>
                <strong>2. Bảo mật mật khẩu:</strong> Mật khẩu của người dùng được băm mã hóa một chiều tự động, tuyệt đối không lưu trữ bản rõ.
              </p>
              <p>
                <strong>3. Không chia sẻ bên thứ ba:</strong> Dữ liệu nhóm du lịch không được thương mại hóa hoặc chuyển giao cho mục đích quảng cáo bên ngoài.
              </p>
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-border-hairline dark:border-[#24314A]">
            <Button variant="primary" onClick={() => setLegalModalOpen(null)}>
              Đóng lại
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
