import { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  RotateCw,
  Trash2,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  Globe,
  Server,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function ErrorDoctor() {
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState({ backend: 0, frontend: 0 });
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState("all"); // 'all' | 'backend' | 'frontend'
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [diagnoses, setDiagnoses] = useState({}); // errorId -> diagnosis object
  const [diagnosingId, setDiagnosingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchErrors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/logs/errors?limit=150");
      const data = await res.json();
      setErrors(data.items || []);
      setStats(data.stats || { backend: 0, frontend: 0 });
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("خطا در دریافت لاگ‌های سیستم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrors();
    const interval = setInterval(fetchErrors, 20000);
    return () => clearInterval(interval);
  }, [fetchErrors]);

  const handleClearLogs = async () => {
    if (!window.confirm("آیا از پاکسازی تمام لاگ‌های خطای پروژه مطمئن هستید؟")) return;
    try {
      const res = await fetch("/api/logs/errors/clear", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("لاگ‌های خطا با موفقیت پاک شدند ✨");
        fetchErrors();
        setDiagnoses({});
      }
    } catch {
      toast.error("خطا در پاکسازی لاگ‌ها");
    }
  };

  const handleDiagnose = async (errorItem) => {
    if (diagnoses[errorItem.id]) return;
    try {
      setDiagnosingId(errorItem.id);
      const res = await fetch("/api/logs/errors/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorId: errorItem.id, errorData: errorItem }),
      });
      const data = await res.json();
      if (data.diagnosis) {
        setDiagnoses((prev) => ({ ...prev, [errorItem.id]: data.diagnosis }));
      }
    } catch {
      toast.error("خطا در تحلیل هوشمند");
    } finally {
      setDiagnosingId(null);
    }
  };

  const handleSimulateTestError = async (sourceType = "frontend") => {
    try {
      if (sourceType === "frontend") {
        await fetch("/api/logs/client-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "خطای تستی فرانت‌اند برای ارزیابی دستیار عیب‌یابی",
            stack: "Error: Simulated Frontend Test Error\n    at handleSimulateTestError (src/components/admin/ErrorDoctor.jsx:102:11)",
            type: "testError",
            route: window.location.pathname,
          }),
        });
      } else {
        await fetch("/api/logs/client-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "خطای تستی بک‌اند شبیه‌سازی‌شده (Test Backend Error)",
            stack: "Error: Simulated Backend Server Exception\n    at router.post (server/routes/test.js:45:12)",
            type: "expressError",
            route: "/api/test/simulated",
          }),
        });
      }
      toast.success(`یک خطای تستی (${sourceType === "frontend" ? "فرانت‌اند" : "بک‌اند"}) ثبت شد.`);
      fetchErrors();
    } catch {
      toast.error("خطا در شبیه‌سازی");
    }
  };

  const handleCopyStack = (errId, stack) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(stack);
      setCopiedId(errId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("ردیابی خطا (Stack Trace) در کلیپ‌بورد کپی شد");
    }
  };

  const filteredErrors = errors.filter((item) => {
    if (filterSource !== "all" && item.source !== filterSource) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = (item.message || "").toLowerCase().includes(q);
      const matchRoute = (item.route || "").toLowerCase().includes(q);
      const matchType = (item.type || "").toLowerCase().includes(q);
      return matchMsg || matchRoute || matchType;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-ui" dir="rtl">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>مجموع خطاها</span>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {errors.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            پایش شده در فایل‌های JSONL و لاگ
          </div>
        </div>

        <div className="p-4 rounded border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>خطاهای بک‌اند</span>
            <Server className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {stats.backend || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Express / Prisma / Process
          </div>
        </div>

        <div className="p-4 rounded border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>خطاهای فرانت‌اند</span>
            <Globe className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {stats.frontend || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            React / Window / Rejections
          </div>
        </div>

        <div className="p-4 rounded border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>وضعیت سلامت پروژه</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500 animate-pulse"></span>
            <span>دستیار آماده عیب‌یابی</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            دستور CLI: <code className="text-accent font-bold">npm run doctor</code>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded border border-border bg-card shadow-soft">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Source Tabs */}
          <div className="flex bg-muted/60 p-1 rounded border border-border/60">
            <Button
              onClick={() => setFilterSource("all")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                filterSource === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              همه ({errors.length})
            </Button>
            <Button
              onClick={() => setFilterSource("backend")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                filterSource === "backend"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              بک‌اند ({stats.backend || 0})
            </Button>
            <Button
              onClick={() => setFilterSource("frontend")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                filterSource === "frontend"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              فرانت‌اند ({stats.frontend || 0})
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در متن یا مسیر..."
              className="w-full pl-3 pr-8 py-1.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={() => handleSimulateTestError("frontend")}
            className="px-3 py-1.5 rounded border border-border hover:bg-muted/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            title="ثبت یک خطای تستی برای اطمینان از عملکرد پایش"
          >
            تست فرانت
          </Button>

          <Button
            onClick={() => handleSimulateTestError("backend")}
            className="px-3 py-1.5 rounded border border-border hover:bg-muted/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            title="ثبت یک خطای تستی برای اطمینان از عملکرد پایش"
          >
            تست بک‌اند
          </Button>

          <Button
            onClick={fetchErrors}
            disabled={loading}
            className="p-2 rounded border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
            title="بروزرسانی لاگ‌ها"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={handleClearLogs}
            disabled={errors.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold border border-destructive/20 transition-all disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>پاکسازی لاگ‌ها</span>
          </Button>
        </div>
      </div>

      {/* Error Items List */}
      {filteredErrors.length === 0 ? (
        <div className="p-12 text-center rounded border border-dashed border-border/80 bg-card/50">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-foreground">
            هیچ خطایی برای نمایش وجود ندارد
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            سیستم در شرایط ایده‌آل و بدون خطای فعال کار می‌کند.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredErrors.map((err) => {
            const isExpanded = expandedId === err.id;
            const diagnosis = diagnoses[err.id];
            const isDiagnosing = diagnosingId === err.id;

            return (
              <div
                key={err.id}
                className="rounded border border-border bg-card shadow-soft overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  onClick={() => {
                    setExpandedId(isExpanded ? null : err.id);
                    if (!isExpanded && !diagnosis) {
                      handleDiagnose(err);
                    }
                  }}
                  className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`shrink-0 mt-0.5 px-2.5 py-1 rounded text-xs font-bold uppercase font-mono ${
                        err.source === "backend"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {err.source}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                          {err.message}
                        </span>
                        {err.type && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                            {err.type}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        <span>{new Date(err.timestamp).toLocaleTimeString("fa-IR")} — {new Date(err.timestamp).toLocaleDateString("fa-IR")}</span>
                        {err.route && <span className="font-mono text-accent">{err.method || ""} {err.route}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDiagnose(err);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-accent/15 hover:bg-accent/25 text-accent text-xs font-bold border border-accent/20 transition-all"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{diagnosis ? "تحلیل شده" : isDiagnosing ? "در حال تحلیل..." : "تحلیل دستیار"}</span>
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Diagnostic Assistant */}
                {isExpanded && (
                  <div className="p-4 border-t border-border/60 bg-muted/20 space-y-4">
                    {/* Assistant Diagnosis Box */}
                    {diagnosis ? (
                      <div className="p-4 rounded border border-accent/30 bg-accent/[0.04] space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-accent">
                            <Sparkles className="h-4 w-4" />
                            <span>تشخیص و راهنمای فیکس دستیار هوشمند:</span>
                          </div>
                          <span className="text-muted-foreground text-[11px]">
                            محل کد: <code className="font-mono text-foreground font-bold">{diagnosis.fileLocation}</code>
                          </span>
                        </div>

                        <div className="text-xs text-foreground font-medium leading-relaxed">
                          <strong>علت ریشه‌ای: </strong>
                          {diagnosis.explanation}
                        </div>

                        <div className="p-3 rounded bg-card border border-border text-xs text-foreground font-medium leading-relaxed">
                          <strong className="text-emerald-600 dark:text-emerald-400">💡 راهکار پیشنهادی برای فیکس: </strong>
                          <p className="mt-1">{diagnosis.suggestedFix}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded bg-card border border-border text-xs">
                        <span className="text-muted-foreground">برای مشاهده ریشه خطا و نحوه فیکس، دکمه تحلیل دستیار را بزنید.</span>
                        <Button
                          onClick={() => handleDiagnose(err)}
                          disabled={isDiagnosing}
                          className="px-3 py-1 rounded bg-accent text-accent-foreground font-bold text-xs hover:opacity-90"
                        >
                          {isDiagnosing ? "در حال تحلیل..." : "شروع تحلیل هوشمند"}
                        </Button>
                      </div>
                    )}

                    {/* Stack Trace Box */}
                    {err.stack && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-bold flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5" />
                            ردیابی پشته (Stack Trace):
                          </span>
                          <Button
                            onClick={() => handleCopyStack(err.id, err.stack)}
                            className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-mono"
                          >
                            {copiedId === err.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span>کپی شد!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>کپی استک</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <pre className="p-3 rounded bg-black/90 text-amber-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-52" dir="ltr">
                          {err.stack}
                        </pre>
                      </div>
                    )}

                    {/* Client info if available */}
                    {err.clientInfo && (
                      <div className="text-xs text-muted-foreground border-t border-border/40 pt-2 flex flex-wrap gap-4 font-mono">
                        {err.clientInfo.userAgent && <span>UserAgent: {err.clientInfo.userAgent.slice(0, 60)}...</span>}
                        {err.clientInfo.screen && <span>Screen: {err.clientInfo.screen}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
