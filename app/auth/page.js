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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
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

        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage(
          "Account created successfully. Check your email if confirmation is required."
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
          {mode === "login" ? "Welcome back" : "Create your account"}
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "14px",
              borderRadius: "10px",
              border: "1px solid #333",
              background: "#151515",
              color: "#fff",
              fontSize: "16px",
            }}
          />

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
              : "CREATE ACCOUNT"}
          </button>
        </form>

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
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
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
      </div>
    </main>
  );
}