import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


interface LoginLocationState {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };

  registrationSuccess?: string;
}


function Login() {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  const { login } =
    useAuth();


  const locationState =
    (location.state as LoginLocationState | null) ??
    null;


  const fromPath =
    locationState?.from?.pathname ??
    "/dashboard";


  const registrationSuccess =
    locationState?.registrationSuccess ??
    "";


  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");


  const [showPassword, setShowPassword] =
    useState(false);


  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
   * ==================================================
   * CLEAR ROUTER STATE AFTER READING IT
   * ==================================================
   *
   * The registration message comes through navigation
   * state. Replace the current history entry so a
   * browser refresh does not keep reusing the message.
   *
   * We intentionally do this only when a registration
   * success message exists.
   * ==================================================
   */

  useEffect(() => {

    if (!registrationSuccess) {
      return;
    }


    window.history.replaceState(
      {},
      document.title,
      window.location.href,
    );

  }, [registrationSuccess]);


  /*
   * ==================================================
   * LOGIN
   * ==================================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {

    event.preventDefault();

    setError("");


    const trimmedEmail =
      email.trim().toLowerCase();


    /*
     * ------------------------------------------------
     * CLIENT VALIDATION
     * ------------------------------------------------
     */

    if (!trimmedEmail || !password) {

      setError(
        "Please enter your email and password.",
      );

      return;

    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailPattern.test(
        trimmedEmail,
      )
    ) {

      setError(
        "Please enter a valid email address.",
      );

      return;

    }


    /*
     * ------------------------------------------------
     * AUTHENTICATE AGAINST BACKEND
     * ------------------------------------------------
     */

    try {

      setLoading(true);


      await login({
        email:
          trimmedEmail,

        password,
      });


      /*
       * AuthContext now contains:
       *
       * - JWT access token
       * - authenticated user
       *
       * ProtectedRoute can therefore allow access.
       */

      navigate(
        fromPath,
        {
          replace: true,
        },
      );


    } catch (err: any) {

      const detail =
        err?.response?.data?.detail;


      if (
        Array.isArray(detail)
      ) {

        const messages =
          detail
            .map(
              (item: {
                msg?: unknown;
              }) =>
                item?.msg,
            )
            .filter(
              (
                message: unknown,
              ): message is string =>
                typeof message ===
                "string" &&
                message.trim()
                  .length > 0,
            );


        setError(
          messages.length > 0
            ? messages.join(" ")
            : "Unable to sign in. Please check your credentials.",
        );


      } else if (
        typeof detail ===
        "string"
      ) {

        setError(detail);


      } else if (
        typeof err?.response
          ?.data?.message ===
        "string"
      ) {

        setError(
          err.response.data.message,
        );


      } else if (
        typeof err?.userMessage ===
        "string"
      ) {

        setError(
          err.userMessage,
        );


      } else {

        setError(
          "Unable to sign in. Please check your credentials.",
        );

      }

    } finally {

      setLoading(false);

    }

  };


  return (

    <main className="relative flex min-h-screen overflow-hidden bg-[#060b14]">

      {/* ==================================================
          BACKGROUND
      ================================================== */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-1/2 top-[-20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/[0.06] blur-3xl" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-3xl" />

      </div>


      <div className="relative mx-auto flex w-full max-w-6xl items-center px-6 py-12">

        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">


          {/* ==================================================
              DESKTOP BRAND
          ================================================== */}

          <section className="hidden lg:block">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">

                <ShieldCheck size={24} />

              </div>


              <div>

                <p className="text-lg font-bold text-white">
                  CyberShield
                </p>

                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Intelligent Threat Analysis
                </p>

              </div>

            </div>


            <h1 className="mt-10 max-w-xl text-5xl font-bold leading-tight tracking-tight text-white">

              Understand threats

              <span className="text-cyan-400">

                {" "}
                before they become incidents.

              </span>

            </h1>


            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">

              Analyze suspicious URLs, messages, and emails using
              intelligent risk signals and explainable threat
              indicators.

            </p>


            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">

              {[
                "URL Intelligence",
                "NLP Analysis",
                "Risk Assessment",
              ].map((item) => (

                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                >

                  <p className="text-xs font-medium text-slate-300">
                    {item}
                  </p>

                </div>

              ))}

            </div>

          </section>


          {/* ==================================================
              LOGIN CARD
          ================================================== */}

          <section>

            <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#0a1220]/90 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">


              {/* Mobile brand */}

              <div className="mb-8 lg:hidden">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">

                    <ShieldCheck size={21} />

                  </div>


                  <div>

                    <p className="font-bold text-white">
                      CyberShield
                    </p>

                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                      Threat Intelligence
                    </p>

                  </div>

                </div>

              </div>


              {/* Header */}

              <div>

                <p className="text-sm font-medium text-cyan-400">
                  SECURE ACCESS
                </p>


                <h2 className="mt-2 text-3xl font-bold text-white">
                  Welcome back
                </h2>


                <p className="mt-2 text-sm text-slate-500">
                  Sign in to continue your security workspace.
                </p>

              </div>


              {/* ==================================================
                  REGISTRATION SUCCESS
              ================================================== */}

              {registrationSuccess && (

                <div
                  role="status"
                  aria-live="polite"
                  className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3"
                >

                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

                  <p className="text-sm leading-5 text-emerald-300">
                    {registrationSuccess}
                  </p>

                </div>

              )}


              {/* ==================================================
                  ERROR
              ================================================== */}

              {error && (

                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm leading-5 text-red-300"
                >

                  {error}

                </div>

              )}


              {/* ==================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
              >


                {/* Email */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Email address
                  </label>


                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="you@example.com"
                    disabled={loading}
                    maxLength={254}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>


                {/* Password */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Password
                  </label>


                  <div className="relative">

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Enter your password"
                      disabled={loading}
                      maxLength={128}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />


                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value,
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >

                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}

                    </button>

                  </div>

                </div>


                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (

                    <span className="flex items-center gap-2">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />

                      Authenticating...

                    </span>

                  ) : (

                    "Sign in"

                  )}

                </button>

              </form>


              {/* ==================================================
                  REGISTER
              ================================================== */}

              <div className="mt-7 border-t border-white/10 pt-6 text-center">

                <p className="text-sm text-slate-500">
                  Don't have a CyberShield account?
                </p>


                <Link
                  to="/register"
                  className="mt-2 inline-block text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Create an account
                </Link>

              </div>


            </div>

          </section>

        </div>

      </div>

    </main>

  );
}


export default Login;