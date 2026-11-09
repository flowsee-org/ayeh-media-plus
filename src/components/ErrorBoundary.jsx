import React from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { reportClientError } from "@/lib/errorLogger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    reportClientError({
      type: "reactErrorBoundary",
      message: error?.message || "React component crash",
      stack: `${error?.stack || ""}\nComponentStack:\n${errorInfo?.componentStack || ""}`,
      meta: {
        componentStack: errorInfo?.componentStack,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6" dir="rtl">
          <div className="max-w-md w-full rounded-3xl border border-destructive/20 bg-card p-6 sm:p-8 text-center shadow-lg">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 ring-1 ring-destructive/20">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-1.5">
              خطایی در نمایش این بخش رخ داده است
            </h3>

            <p className="font-doran text-xs text-muted-foreground mb-4 leading-relaxed">
              جزئیات این خطا به طور خودکار در مرکز پایش خطاهای سیستم ثبت شد تا توسط دستیار برطرف گردد.
            </p>

            {this.state.error?.message && (
              <div className="text-right p-3 rounded-xl bg-muted/60 border border-border/60 text-xs font-mono text-muted-foreground mb-5 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 transition-all font-ui"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>تلاش دوباره</span>
              </button>

              <button
                onClick={() => { window.location.href = "/"; }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all font-ui"
              >
                <Home className="h-3.5 w-3.5" />
                <span>صفحه اصلی</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
