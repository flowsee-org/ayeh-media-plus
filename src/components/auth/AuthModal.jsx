import { useState, useEffect, useRef } from "react";
import {
  X,
  Phone,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  User,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  // Step: 'phone' | 'otp' | 'onboarding'
  const [step, setStep] = useState("phone");

  // Phone & Captcha Form
  const [phone, setPhone] = useState("");
  const [captchaData, setCaptchaData] = useState({ captchaId: "", svg: "" });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // OTP Form
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(90);
  const [devOtpHint, setDevOtpHint] = useState("");

  // Onboarding Form (New User)
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const otpInputRef = useRef(null);

  // Load Captcha on open
  const loadCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      const res = await api.auth.getCaptcha();
      if (res?.captchaId && res?.svg) {
        setCaptchaData(res);
        setCaptchaAnswer("");
      }
    } catch (err) {
      console.error("Error loading captcha:", err);
      toast.error("خطا در دریافت کد امنیتی");
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setDevOtpHint("");
      setFullName("");
      loadCaptcha();
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus OTP input on step change
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  if (!isOpen) return null;

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      toast.error("لطفاً شماره تلفن همراه خود را وارد کنید");
      return;
    }
    if (!captchaAnswer.trim()) {
      toast.error("لطفاً کد امنیتی داخل تصویر را وارد کنید");
      return;
    }

    try {
      setSendingOtp(true);
      const res = await api.auth.sendOtpPhone({
        phone: cleanPhone,
        captchaId: captchaData.captchaId,
        captchaAnswer: captchaAnswer.trim(),
      });

      if (res.success) {
        toast.success("کد تأیید ۵ رقمی پیامک شد 📩");
        setStep("otp");
        setCountdown(90);
        if (res.dev_otp) {
          setDevOtpHint(res.dev_otp);
        }
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      toast.error(err?.data?.message || err.message || "خطا در ارسال کد تایید");
      loadCaptcha(); // Refresh captcha on failure
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      toast.error("لطفاً کد ۵ رقمی را وارد کنید");
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await api.auth.verifyOtpPhone({
        phone: phone.trim(),
        otp: cleanOtp,
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);

        if (res.isNewUser) {
          // Proceed to soft onboarding step
          setStep("onboarding");
        } else {
          // Existing user - finalize immediately
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
          toast.success(`خوش آمدید، ${res.user.full_name || "همراه گرامی"} ✨`);
          onSuccess?.(res.user);
          onClose();
        }
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      toast.error(err?.data?.message || err.message || "کد تأیید اشتباه یا منقضی شده است");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3: Complete Soft Onboarding
  const handleSaveProfile = async (skip = false) => {
    try {
      setSavingProfile(true);
      let finalUser = currentUser;

      if (!skip && fullName.trim()) {
        const updateRes = await api.auth.completeProfile({
          full_name: fullName.trim(),
        });
        if (updateRes.user) {
          finalUser = { ...currentUser, ...updateRes.user };
        }
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success(`عضویت شما در آیه پلاس با موفقیت تکمیل شد 🎉`);
      onSuccess?.(finalUser);
      onClose();
    } catch (err) {
      console.error("Profile complete error:", err);
      // Even if name update fails, user is already logged in
      onSuccess?.(currentUser);
      onClose();
    } finally {
      setSavingProfile(false);
    }
  };

  // Resend OTP
  const handleResend = () => {
    if (countdown > 0) return;
    setStep("phone");
    loadCaptcha();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 w-8 h-8 rounded-full hover:bg-accent/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-kalameh text-foreground">
            {step === "phone"
              ? "ورود به آیه پلاس"
              : step === "otp"
              ? "تأیید شماره همراه"
              : "تکمیل مشخصات"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {step === "phone"
              ? "شماره همراه خود را برای دریافت کد یکبارمصرف وارد کنید"
              : step === "otp"
              ? `کد ۵ رقمی ارسال‌شده به ${phone} را وارد کنید`
              : "نام خود را وارد کنید تا همراهان آیه شما را بشناسند"}
          </p>
        </div>

        {/* --- STEP 1: Phone & Numerical Captcha --- */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                شماره تلفن همراه *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-background border border-border/70 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all placeholder:text-muted-foreground/60 text-right"
                />
              </div>
            </div>

            {/* Numerical SVG Captcha */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-foreground">
                کد امنیتی داخل تصویر *
              </label>
              <div className="flex items-center gap-2">
                {/* Captcha Image Container */}
                <div
                  className="rounded-xl border border-border/80 overflow-hidden shrink-0 flex items-center justify-center bg-muted/30 h-[46px] w-[140px]"
                  dangerouslySetInnerHTML={{ __html: captchaData.svg || "" }}
                />

                {/* Reload Captcha Button */}
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={loadingCaptcha}
                  title="تصویر جدید"
                  className="p-2.5 rounded-xl bg-background border border-border/70 hover:border-accent hover:bg-accent/5 text-muted-foreground hover:text-accent transition-all shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingCaptcha ? "animate-spin" : ""}`} />
                </button>

                {/* Captcha Answer Input */}
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="کد تصویر"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border/70 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sendingOtp || !phone.trim() || !captchaAnswer.trim()}
              className="w-full mt-4 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-md hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{sendingOtp ? "در حال ارسال کد..." : "دریافت کد تایید پیامکی"}</span>
            </button>
          </form>
        )}

        {/* --- STEP 2: OTP Verification --- */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* Dev hint badge if available */}
            {devOtpHint && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs text-center font-mono">
                کد یکبارمصرف آزمایشی: <span className="font-bold tracking-widest text-sm">{devOtpHint}</span>
              </div>
            )}

            {/* 5-digit code input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground text-center">
                کد ۵ رقمی پیامک شده
              </label>
              <input
                ref={otpInputRef}
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="— — — — —"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3 rounded-xl bg-background border border-border/70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>

            {/* Timer & Back / Resend links */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>ویرایش شماره</span>
              </button>

              {countdown > 0 ? (
                <span className="font-mono">
                  ارسال مجدد ({Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-accent font-semibold hover:underline"
                >
                  ارسال مجدد کد
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={verifyingOtp || !otp.trim()}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-md hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{verifyingOtp ? "در حال اعتبارسنجی..." : "تایید و ورود"}</span>
            </button>
          </form>
        )}

        {/* --- STEP 3: Soft Onboarding for New User --- */}
        {step === "onboarding" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                نام و نام خانوادگی (اختیاری)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی رضایی"
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-background border border-border/70 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                می‌توانید بعداً نیز در بخش پروفایل، نام و تصویر کاربری خود را ویرایش کنید.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => handleSaveProfile(false)}
                className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-md hover:bg-accent/90 transition-all"
              >
                {savingProfile ? "در حال ثبت..." : "ذخیره و ورود به سامانه"}
              </button>
              <button
                type="button"
                onClick={() => handleSaveProfile(true)}
                className="w-full py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                بعداً تکمیل می‌کنم (ورود)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
