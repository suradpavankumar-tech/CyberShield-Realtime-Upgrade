import { useState } from "react";
import type { FormEvent } from "react";

import {
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function Register() {

  const navigate =
    useNavigate();

  const { register } =
    useAuth();


  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
   * ==================================================
   * FORM SUBMISSION
   * ==================================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {

    event.preventDefault();

    setError("");


    const trimmedName =
      fullName.trim();

    const trimmedEmail =
      email.trim().toLowerCase();


    /*
     * ------------------------------------------------
     * CLIENT-SIDE VALIDATION
     * ------------------------------------------------
     */

    if (!trimmedName) {

      setError(
        "Please enter your full name.",
      );

      return;

    }


    if (trimmedName.length < 2) {

      setError(
        "Full name must contain at least 2 characters.",
      );

      return;

    }


    if (!trimmedEmail) {

      setError(
        "Please enter your email address.",
      );

      return;

    }


    /*
     * The browser input type already performs basic
     * email validation, but we also validate here
     * because submit can be triggered programmatically.
     */

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


    if (!password) {

      setError(
        "Please enter a password.",
      );

      return;

    }


    if (password.length < 8) {

      setError(
        "Password must contain at least 8 characters.",
      );

      return;

    }


    if (password !== confirmPassword) {

      setError(
        "Passwords do not match.",
      );

      return;

    }


    /*
     * ------------------------------------------------
     * BACKEND REGISTRATION
     * ------------------------------------------------
     */

    try {

      setLoading(true);


      await register({
        full_name:
          trimmedName,

        email:
          trimmedEmail,

        password,
      });


      /*
       * IMPORTANT:
       *
       * Registration returns the created User,
       * not an authentication token.
       *
       * Therefore we MUST NOT navigate directly
       * to the protected dashboard.
       */


      navigate(
        "/login",
        {
          replace: true,

          state: {
            registrationSuccess:
              "Your CyberShield account was created successfully. Sign in to continue.",
          },

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
              (item) =>
                item?.msg,
            )
            .filter(
              (
                message,
              ): message is string =>
                typeof message ===
                "string" &&
                message.trim()
                  .length > 0,
            );


        setError(
          messages.length > 0
            ? messages.join(" ")
            : "Unable to create your account. Please check your information.",
        );


      } else {

        setError(
          typeof detail ===
          "string"
            ? detail
            : typeof err?.response
                ?.data?.message ===
              "string"
              ? err.response.data
                  .message
              : "Unable to create your account. Please try again.",
        );

      }

    } finally {

      setLoading(false);

    }

  };


  /*
   * ==================================================
   * RENDER
   * ==================================================
   */

  return (

    <main className="relative flex min-h-screen overflow-hidden bg-[#060b14]">

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute left-1/4 top-[-20%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.05] blur-3xl" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-3xl" />

      </div>


      <div className="relative mx-auto flex w-full max-w-6xl items-center px-6 py-12">

        <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">


          {/* ==================================================
              DESKTOP BRAND / VALUE PROPOSITION
          ================================================== */}

          <section className="hidden lg:block">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">

                <ShieldCheck
                  size={24}
                />

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

              Build a clearer picture of

              <span className="text-cyan-400">

                {" "}
                suspicious activity.

              </span>

            </h1>


            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">

              Create your CyberShield workspace and investigate
              suspicious URLs, messages, and emails with
              explainable security signals.

            </p>


            <div className="mt-8 space-y-3">

              {[
                "URL intelligence and risk analysis",
                "NLP-powered message assessment",
                "Cross-signal email investigation",
              ].map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-400"
                >

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">

                    <UserPlus
                      size={14}
                    />

                  </div>

                  {item}

                </div>

              ))}

            </div>

          </section>


          {/* ==================================================
              REGISTER CARD
          ================================================== */}

          <section>

            <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#0a1220]/90 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">


              {/* Mobile brand */}

              <div className="mb-8 lg:hidden">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">

                    <ShieldCheck
                      size={21}
                    />

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
                  CREATE WORKSPACE
                </p>


                <h2 className="mt-2 text-3xl font-bold text-white">
                  Create your account
                </h2>


                <p className="mt-2 text-sm text-slate-500">
                  Start investigating threats with CyberShield.
                </p>

              </div>


              {/* Error */}

              {error && (

                <div
                  role="alert"
                  aria-live="polite"
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
                className="mt-7 space-y-4"
              >


                {/* Full name */}

                <div>

                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Full name
                  </label>


                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(
                        event.target.value,
                      )
                    }
                    placeholder="Your full name"
                    disabled={loading}
                    maxLength={100}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>


                {/* Email */}

                <div>

                  <label
                    htmlFor="registerEmail"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Email address
                  </label>


                  <input
                    id="registerEmail"
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
                    htmlFor="registerPassword"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Password
                  </label>


                  <div className="relative">

                    <input
                      id="registerPassword"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      placeholder="At least 8 characters"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >

                      {showPassword ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}

                    </button>

                  </div>

                </div>


                {/* Confirm password */}

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-xs font-medium text-slate-300"
                  >
                    Confirm password
                  </label>


                  <div className="relative">

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Repeat your password"
                      disabled={loading}
                      maxLength={128}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />


                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) =>
                            !value,
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >

                      {showConfirmPassword ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}

                    </button>

                  </div>

                </div>


                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (

                    <span className="flex items-center gap-2">

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />

                      Creating workspace...

                    </span>

                  ) : (

                    "Create account"

                  )}

                </button>

              </form>


              {/* ==================================================
                  LOGIN LINK
              ================================================== */}

              <div className="mt-7 border-t border-white/10 pt-6 text-center">

                <p className="text-sm text-slate-500">
                  Already have an account?
                </p>


                <Link
                  to="/login"
                  className="mt-2 inline-block text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Sign in instead
                </Link>

              </div>


            </div>

          </section>

        </div>

      </div>

    </main>

  );

}


export default Register;