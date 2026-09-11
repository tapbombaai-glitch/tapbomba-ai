"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please describe what you want BOMBA to build");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "user_001",
          text: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to connect to BOMBA AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 tracking-tight">
            BOMBA AI
          </h1>
          <p className="text-xl text-purple-300">
            Describe it. BOMBA builds it.
          </p>
          <p className="text-gray-400 mt-2">Automate. Grow. Earn.</p>
        </div>

        {/* Input Box */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: Create a beautiful flyer for my plant shop opening next week..."
            className="w-full h-36 bg-black/40 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200"
          >
            {loading ? "BOMBA is building..." : "Build with BOMBA"}
          </button>

          {error && (
            <p className="mt-4 text-red-400 text-center">{error}</p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">
              Result
            </h2>
            <pre className="bg-black/40 p-4 rounded-xl text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <p className="text-center text-gray-500 text-sm mt-12">
          BOMBA AI • Foundation First
        </p>
      </div>
    </main>
  );
}