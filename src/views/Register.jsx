'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/AuthContext";
import BrandLogo from "@/components/ui/brand-logo";

export default function Register() {
  const { checkUserAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Login redirects unverified accounts here with ?email=&verify=1 after resendOtp.
  useEffect(() => {
    const pendingEmail = (searchParams.get("email") || "").trim();
    const verify = searchParams.get("verify") === "1";
    if (pendingEmail && verify) {
      setEmail(pendingEmail);
      setShowOtp(true);
    }
  }, [searchParams]);

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
      await api.auth.verifyOtp({ email, otpCode });
      await checkUserAuth();
      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || "/");
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
      <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BrandLogo variant="inline" />
          </div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-rokh-bold font-bold text-foreground">تأیید ایمیل</h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-editorial">
              کد ۶ رقمی برای <span className="text-primary font-medium">{email}</span> ارسال شد
            </p>
          </div>
          <div className="bg-card rounded border border-border shadow-sm p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}
            <div className="flex justify-center mb-6" dir="ltr">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full h-11 font-bold" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
              {loading ? <><Loader2 className="w-4 h-4 ms-2 animate-spin" />تأیید...</> : <><CheckCircle className="w-4 h-4 ms-2" />تأیید و ورود</>}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              کد دریافت نکردید؟{" "}
              <Button variant="link" size="sm" onClick={handleResend} className="text-primary font-semibold">
                ارسال مجدد
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo variant="inline" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-rokh-bold font-bold text-foreground">ثبت‌نام در آیه پلاس</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-editorial">
            حساب بسازید و ویدیوهای قرآنی را دنبال کنید
          </p>
        </div>

        <div className="bg-card rounded border border-border shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">نام کامل</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                autoFocus
                placeholder="نام و نام خانوادگی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pe-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  placeholder="حداقل ۶ کاراکتر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">تکرار رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pe-10 h-11"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 ms-2 animate-spin" />در حال ساخت حساب...</>
              ) : (
                <><UserPlus className="w-4 h-4 ms-2" />ساخت حساب</>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            حساب دارید؟{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">وارد شوید</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
