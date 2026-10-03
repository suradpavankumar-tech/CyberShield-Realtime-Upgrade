import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  RefreshCw,
  Shield,
} from "lucide-react";


interface ErrorBoundaryProps {
  children: ReactNode;
}


interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}


/*
 * =========================================================
 * GLOBAL ERROR BOUNDARY
 * =========================================================
 *
 * Prevents an unexpected React rendering error from
 * leaving the entire CyberShield interface unusable.
 *
 * This does NOT hide backend/API errors.
 * Those continue through the existing service/page
 * error handling.
 * =========================================================
 */

class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {

  constructor(
    props: ErrorBoundaryProps,
  ) {

    super(props);

    this.state = {
      hasError: false,
      errorMessage: "",
    };

  }


  /*
   * =======================================================
   * CAPTURE RENDERING ERRORS
   * =======================================================
   */

  static getDerivedStateFromError(
    error: Error,
  ): ErrorBoundaryState {

    return {
      hasError: true,

      errorMessage:
        error?.message ||
        "An unexpected application error occurred.",
    };

  }


  /*
   * =======================================================
   * LOG ERROR
   * =======================================================
   *
   * Keep this useful for development and production
   * diagnostics without exposing stack traces to users.
   * =======================================================
   */

  componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ) {

    console.error(
      "CyberShield application error:",
      error,
      errorInfo,
    );

  }


  /*
   * =======================================================
   * RECOVER
   * =======================================================
   */

  handleReload = () => {

    window.location.reload();

  };


  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  render() {

    if (
      !this.state.hasError
    ) {

      return this.props.children;

    }


    return (
      <main className="min-h-screen bg-[#060b14] px-5 py-10 text-white">

        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">

          <section className="w-full rounded-2xl border border-red-400/15 bg-[#0a1220] p-7 text-center shadow-2xl">

            {/* Brand */}

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-400">

              <Shield
                size={22}
              />

            </div>


            {/* Error icon */}

            <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">

              <AlertTriangle
                size={22}
              />

            </div>


            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">

              Application error

            </p>


            <h1 className="mt-2 text-xl font-bold text-white">

              CyberShield needs to recover

            </h1>


            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">

              An unexpected interface error interrupted
              this page. Your backend security data has
              not been intentionally modified.

            </p>


            {/* Safe diagnostic */}

            {this.state.errorMessage && (
              <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left">

                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">

                  Diagnostic

                </p>

                <p className="mt-1 break-words text-xs leading-5 text-slate-500">

                  {this.state.errorMessage}

                </p>

              </div>
            )}


            {/* Recovery */}

            <button
              type="button"
              onClick={
                this.handleReload
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
            >

              <RefreshCw
                size={14}
              />

              Reload CyberShield

            </button>


            <p className="mt-4 text-[10px] text-slate-700">

              Reloading restores the application interface
              without creating or deleting backend scans.

            </p>

          </section>

        </div>

      </main>
    );

  }

}


export default ErrorBoundary;