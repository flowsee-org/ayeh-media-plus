import React from 'react';
import { IslamicStar } from '@/components/IslamicOrnaments';
import { ShieldAlert } from 'lucide-react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-2xl shadow-premium border border-border/40">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
              <ShieldAlert className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">دسترسی محدود</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            شما برای استفاده از این برنامه ثبت‌نشده‌اید. لطفاً با مدیر برنامه برای درخواست دسترسی تماس بگیرید.
          </p>
          <div className="p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground text-right">
            <p className="mb-2">اگر فکر می‌کنید این خطاست، می‌توانید:</p>
            <ul className="list-disc list-inside mr-2 space-y-1.5">
              <li>ورود با حساب کاربری صحیح را تأیید کنید</li>
              <li>با مدیر برنامه برای دریافت دسترسی تماس بگیرید</li>
              <li>از حساب خارج شده و مجدداً وارد شوید</li>
            </ul>
          </div>
          <div className="flex justify-center mt-6">
            <IslamicStar size={20} className="text-accent/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;