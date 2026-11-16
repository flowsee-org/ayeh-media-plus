import { useState } from "react";
import { CalendarClock, Download } from "lucide-react";
import { toast } from "react-hot-toast";

/** Builds an .ics file for a daily recitation plan (works with Google Calendar import). */
function buildIcs({ time, days, minutes, reminder }) {
  const [hh, mm] = time.split(":").map(Number);

  // Start at the next occurrence of the chosen time: if today's slot has
  // already passed, begin tomorrow so the first reminder isn't in the past.
  const start = new Date();
  start.setHours(hh, mm, 0, 0);
  if (start.getTime() <= Date.now()) {
    start.setDate(start.getDate() + 1);
  }

  // Emit UTC (trailing "Z") so the event is interpreted unambiguously in any
  // calendar/timezone. A local-time value without TZID/VTIMEZONE shifts.
  const dt = (d) => `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

  const end = new Date(start.getTime() + minutes * 60000);
  const stamp = dt(new Date());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quran Tadabbur//Recitation Plan//FA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:tadabbur-plan-${stamp}@ayeh.media`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt(start)}`,
    `DTEND:${dt(end)}`,
    `RRULE:FREQ=DAILY;COUNT=${days}`,
    "SUMMARY:تلاوت روزانه قرآن",
    "DESCRIPTION:برنامه تلاوت روزانه شما — ساخته‌شده در پلتفرم قرآن تدبر",
    "BEGIN:VALARM",
    `TRIGGER:-PT${reminder}M`,
    "ACTION:DISPLAY",
    "DESCRIPTION:یادآوری تلاوت روزانه قرآن",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function RecitationPlan() {
  const [time, setTime] = useState("21:00");
  const [days, setDays] = useState(30);
  const [minutes, setMinutes] = useState(30);
  const [reminder, setReminder] = useState(10);

  const download = () => {
    try {
      const ics = buildIcs({ time, days, minutes, reminder });
      const blob = new Blob([`\ufeff${ics}`], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recitation-plan.ics";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("فایل برنامه ذخیره شد — آن را در تقویم گوگل وارد کنید");
    } catch {
      toast.error("ساخت فایل تقویم ناموفق بود");
    }
  };

  const dayOption = (n, label) => (
    <button
      key={n}
      type="button"
      onClick={() => setDays(n)}
      className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
        days === n ? "bg-accent text-accent-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded border border-accent/15 bg-card/40 p-6 mb-8 shadow-soft">
      <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-accent" />
        برنامه تلاوت روزانه
      </h2>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        زمان تلاوت را تنظیم کنید، فایل تقویم را دانلود و در تقویم گوگل وارد کنید (Google Calendar ← Settings ← Import) تا یادآوری روزانه دریافت کنید.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <label className="text-xs text-muted-foreground">
          ساعت تلاوت
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full h-10 rounded border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          مدت هر جلسه (دقیقه)
          <input
            type="number"
            min={5}
            max={120}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) || 30)}
            className="mt-1 w-full h-10 rounded border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          یادآوری قبل (دقیقه)
          <input
            type="number"
            min={0}
            max={120}
            value={reminder}
            onChange={(e) => setReminder(Number(e.target.value) || 0)}
            className="mt-1 w-full h-10 rounded border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1.5">تعداد روزها</div>
        <div className="flex gap-2">
          {dayOption(7, "۷ روز")}
          {dayOption(30, "۳۰ روز")}
          {dayOption(90, "۹۰ روز")}
          {dayOption(365, "یک سال")}
        </div>
      </div>

      <button
        onClick={download}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
      >
        <Download className="h-4 w-4" /> دانلود فایل تقویم (Google / iOS)
      </button>
    </div>
  );
}