"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    if (mode !== "forgot" && !password) {
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage("Login successful. Redirecting...");

        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (data?.session) {
          setMessage("Account created successfully. Redirecting...");

          setTimeout(() => {
            window.location.href = "/";
          }, 700);
        } else {
          setMessage(
            "Account created successfully. Please check your email to confirm your account."
          );
        }
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/auth?mode=reset`,
          }
        );

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage(
          "Password reset email sent. Please check your email inbox."
        );
      }
    } catch (error) {
      setMessage(
        error?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0d0d0d",
          border: "1px solid #252525",
          borderRadius: "20px",
          padding: "28px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "58px",
            height: "58px",
            borderRadius: "16px",
            background: "#FFD43B",
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "900",
            fontSize: "22px",
            marginBottom: "18px",
          }}
        >
          TB
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "900",
          }}
        >
          BOMBA AI
        </h1>

        <p
          style={{
            color: "#aaa",
            marginTop: "8px",
            marginBottom: "24px",
          }}
        >
          Automate. Grow. Earn.
        </p>

        <h2
          style={{
            fontSize: "20px",
            marginBottom: "18px",
          }}
        >
          {mode === "login"
            ? "Welcome back"
            : mode === "signup"
            ? "Create your account"
            : "Reset your password"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #333",
              background: "#151515",
              color: "#fff",
              fontSize: "16px",
            }}
          />

          {mode !== "forgot" && (
            <div
              style={{
                position: "relative",
                marginBottom: "14px",
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 48px 14px 14px",
                  borderRadius: "10px",
                  border: "1px solid #333",
                  background: "#151515",
                  color: "#fff",
                  fontSize: "16px",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#FFD43B",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "6px",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#FFD43B",
              color: "#000",
              fontWeight: "900",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "LOGIN"
              : mode === "signup"
              ? "CREATE ACCOUNT"
              : "SEND RESET EMAIL"}
          </button>
        </form>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            style={{
              marginTop: "14px",
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#FFD43B",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Forgot password?
          </button>
        )}

        {message && (
          <p
            style={{
              marginTop: "16px",
              color: "#FFD43B",
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            switchMode(mode === "login" ? "signup" : "login")
          }
          style={{
            marginTop: "18px",
            width: "100%",
            padding: "12px",
            border: "1px solid #333",
            borderRadius: "10px",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {mode === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </button>

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "12px",
              border: "1px solid #333",
              borderRadius: "10px",
              background: "transparent",
              color: "#aaa",
              cursor: "pointer",
            }}
          >
            Back to Login
          </button>
        )}
      </div>
    </main>
  );
}