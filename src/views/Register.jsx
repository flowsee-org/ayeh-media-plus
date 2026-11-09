'use client';
import React, { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { IslamicStar } from "@/components/IslamicOrnaments";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }
    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    setLoading(true);
    try {
      await api.auth.register({ email, password, full_name: fullName });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await api.auth.verifyOtp({ email, otpCode });
      // verifyOtp already stores the token in base44Client; no need to set again.
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      navigate(returnTo || "/");
    } catch (err) {
      setError(err.message || "کد تأیید نامعتبر است");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await api.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "ارسال مجدد کد ناموفق بود");
    }
  };

  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1b4d] via-[#1a2a6c] to-[#0d1540] px-4" dir="rtl">
        <div className="absolute inset-0 pattern-islamic opacity-15 pointer-events-none" />
        <div className="relative w-full max-w-md z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-glow mb-4 border border-orange-400/30">
              <Mail className="w-8 h-8 text-orange-300" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white">تأیید ایمیل</h1>
            <p className="text-blue-200/70 mt-2 text-sm">کد ۶ رقمی برای <span className="text-orange-300">{email}</span> ارسال شد</p>
          </div>

          <div className="bg-white/8 backdrop-blur-xl rounded-3xl border border-white/15 p-8 shadow-premium">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center mb-6" dir="ltr">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => (
                    <InputOTPSlot key={i} index={i} className="bg-white/10 border-white/25 text-white text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              className="w-full h-12 font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white border-0 shadow-gold-glow"
              onClick={handleVerify}
              disabled={loading || otpCode.length < 6}
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />تأیید...</>
                : <><CheckCircle className="w-4 h-4 mr-2" />تأیید و ورود</>}
            </Button>

            <p className="text-center text-sm text-blue-200/60 mt-4">
              کد دریافت نکردید؟{" "}
              <button onClick={handleResend} className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
                ارسال مجدد
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#041a14] via-[#063326] to-[#02130e] px-4" dir="rtl">
      <div className="absolute inset-0 pattern-islamic opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-amber-500/15 via-emerald-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-950 shadow-emerald-glow mb-4 border border-amber-400/40">
            <UserPlus className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">به آیه پلاس بپیوندید</h1>
          <p className="text-blue-200/70 mt-2 text-sm">حساب بسازید، تدبّر را تجربه کنید</p>
        </div>

        <div className="bg-white/8 backdrop-blur-xl rounded-3xl border border-white/15 p-8 shadow-premium">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-400/40" />
            <IslamicStar size={14} className="text-orange-400" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-400/40" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-blue-200 text-sm font-medium">نام کامل</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                autoFocus
                placeholder="نام و نام خانوادگی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 bg-white/8 border-white/20 text-white placeholder:text-blue-200/40 focus:border-orange-400/60"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-200 text-sm font-medium">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" />
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 h-12 bg-white/8 border-white/20 text-white placeholder:text-blue-200/40 focus:border-orange-400/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-200 text-sm font-medium">رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" />
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  placeholder="حداقل ۶ کاراکتر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-12 bg-white/8 border-white/20 text-white placeholder:text-blue-200/40 focus:border-orange-400/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-blue-200 text-sm font-medium">تکرار رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" />
                <Input
                  id="confirm"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 h-12 bg-white/8 border-white/20 text-white placeholder:text-blue-200/40 focus:border-orange-400/60"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white border-0 shadow-gold-glow transition-all mt-2"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />در حال ساخت حساب...</>
              ) : (
                "ساخت حساب و ورود"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-blue-200/60 mt-6">
            حساب دارید؟{" "}
            <Link to="/login" className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
              وارد شوید
            </Link>
          </p>
        </div>

        <p className="text-center font-arabic text-blue-300/50 text-sm mt-6" dir="rtl" lang="ar">
          وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا
        </p>
      </div>
    </div>
  );
}
