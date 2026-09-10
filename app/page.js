"use client";

import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "flyer"
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Welcome to **BOMBA AI**.\n\nI can help you build apps or create professional flyers.\n\nJust describe what you need!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Flyer Generator state
  const [businessName, setBusinessName] = useState("Kingsley Shoes");
  const [headline, setHeadline] = useState("STEP UP YOUR GAME");
  const [description, setDescription] = useState(
    "Premium stylish sneakers designed to elevate your everyday look."
  );
  const [price, setPrice] = useState("₦25,000");
  const [phone, setPhone] = useState("08000000000");

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "⚠️ Something went wrong. Please try again.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Network error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function downloadFlyer() {
    const flyer = document.getElementById("flyer");
    if (!flyer) return;

    const popup = window.open("", "_blank");
    if (!popup) return;

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BOMBA AI Flyer</title>
          <style>
            body {
              margin: 0;
              background: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .flyer {
              width: 1080px;
              height: 1080px;
              position: relative;
              overflow: hidden;
              padding: 76px;
              background: radial-gradient(circle at 85% 12%, rgba(255,212,59,.35), transparent 28%),
                          linear-gradient(135deg, #050505, #171717 50%, #000);
              color: white;
            }
            .brand { color: #ffd43b; font-size: 42px; font-weight: 900; letter-spacing: 2px; }
            .badge {
              display: inline-block; margin-top: 55px; padding: 10px 20px;
              border-radius: 30px; background: #ffd43b; color: #000;
              font-size: 18px; font-weight: 900;
            }
            h2 {
              max-width: 800px; margin: 40px 0 0; font-size: 88px;
              line-height: .92; font-weight: 950; text-transform: uppercase;
            }
            .subtitle { max-width: 620px; margin-top: 35px; font-size: 27px; line-height: 1.3; color: #eee; }
            .price-area { margin-top: 45px; }
            .price-label { color: #ddd; font-size: 20px; text-transform: uppercase; font-weight: bold; }
            .price { color: #ffd43b; font-size: 76px; font-weight: 950; }
            .product { position: absolute; right: 70px; top: 430px; font-size: 180px; transform: rotate(-10deg); }
            .bottom {
              position: absolute; left: 76px; right: 76px; bottom: 76px;
              padding-top: 35px; border-top: 2px solid rgba(255,255,255,.2);
              display: flex; justify-content: space-between; align-items: center; font-size: 21px;
            }
            .order { color: #ffd43b; font-weight: bold; }
            .shop {
              background: #ffd43b; color: #000; padding: 14px 25px;
              border-radius: 30px; font-weight: 900;
            }
          </style>
        </head>
        <body>
          <div class="flyer">
            <div class="brand">${businessName.toUpperCase()}</div>
            <div class="badge">NEW COLLECTION</div>
            <h2>${headline.toUpperCase()}</h2>
            <div class="subtitle">${description}</div>
            <div class="price-area">
              <div class="price-label">Starting From</div>
              <div class="price">${price}</div>
            </div>
            <div class="product">👟</div>
            <div class="bottom">
              <div>
                <span class="order">ORDER NOW</span><br>
                WhatsApp: ${phone}
              </div>
              <div class="shop">SHOP NOW</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          <\/script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#ffd43b",
          color: "#000",
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900 }}>
          🤖 BOMBA AI
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
          Build Apps • Create Flyers • Grow Fast
        </p>
      </header>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #222",
          background: "#0a0a0a",
        }}
      >
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            flex: 1,
            padding: "14px",
            border: "none",
            background: activeTab === "chat" ? "#111" : "transparent",
            color: activeTab === "chat" ? "#ffd43b" : "#888",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          💬 Build App
        </button>
        <button
          onClick={() => setActiveTab("flyer")}
          style={{
            flex: 1,
            padding: "14px",
            border: "none",
            background: activeTab === "flyer" ? "#111" : "transparent",
            color: activeTab === "flyer" ? "#ffd43b" : "#888",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          🎨 Flyer Generator
        </button>
      </div>

      {/* ===================== CHAT TAB ===================== */}
      {activeTab === "chat" && (
        <>
          <div
            style={{
              flex: 1,
              maxWidth: "800px",
              width: "100%",
              margin: "0 auto",
              padding: "20px 16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: msg.role === "user" ? "#ffd43b" : "#1a1a1a",
                  color: msg.role === "user" ? "#000" : "#fff",
                  padding: "13px 16px",
                  borderRadius: "16px",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  fontSize: "15px",
                }}
              >
                {msg.content}
              </div>
            ))}

            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#1a1a1a",
                  padding: "13px 16px",
                  borderRadius: "16px",
                  color: "#aaa",
                }}
              >
                Thinking...
              </div>
            )}
          </div>

          <div
            style={{
              maxWidth: "800px",
              width: "100%",
              margin: "0 auto",
              padding: "14px 16px",
              borderTop: "1px solid #222",
              display: "flex",
              gap: "10px",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Describe the app you want to build..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "13px 15px",
                borderRadius: "12px",
                border: "1px solid #333",
                background: "#111",
                color: "white",
                fontSize: "15px",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: "0 20px",
                borderRadius: "12px",
                border: "none",
                background: "#ffd43b",
                color: "#000",
                fontWeight: 800,
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </div>
        </>
      )}

      {/* ===================== FLYER TAB ===================== */}
      {activeTab === "flyer" && (
        <div
          style={{
            flex: 1,
            maxWidth: "700px",
            width: "100%",
            margin: "0 auto",
            padding: "24px 16px 40px",
            overflowY: "auto",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
              Business Name
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={inputStyle}
            />

            <label style={{ display: "block", margin: "16px 0 6px", fontWeight: 600 }}>
              Main Headline
            </label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              style={inputStyle}
            />

            <label style={{ display: "block", margin: "16px 0 6px", fontWeight: 600 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <label style={{ display: "block", margin: "16px 0 6px", fontWeight: 600 }}>
              Price
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={inputStyle}
            />

            <label style={{ display: "block", margin: "16px 0 6px", fontWeight: 600 }}>
              WhatsApp / Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Live Preview */}
          <h3 style={{ color: "#ffd43b", marginBottom: 12, textAlign: "center" }}>
            Live Preview
          </h3>

          <div
            id="flyer"
            style={{
              width: "100%",
              maxWidth: "420px",
              aspectRatio: "1/1",
              margin: "0 auto",
              position: "relative",
              overflow: "hidden",
              padding: "7%",
              background:
                "radial-gradient(circle at 85% 12%, rgba(255,212,59,.35), transparent 28%), linear-gradient(135deg, #050505 0%, #171717 50%, #000 100%)",
              borderRadius: "8px",
              color: "white",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  color: "#ffd43b",
                  fontSize: "clamp(18px, 4vw, 28px)",
                  fontWeight: 900,
                  letterSpacing: "1.5px",
                }}
              >
                {businessName.toUpperCase() || "YOUR BUSINESS"}
              </div>

              <div
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "#ffd43b",
                  color: "#000",
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                NEW COLLECTION
              </div>

              <h2
                style={{
                  margin: "14px 0 0",
                  fontSize: "clamp(28px, 6vw, 42px)",
                  lineHeight: 0.95,
                  fontWeight: 950,
                  textTransform: "uppercase",
                }}
              >
                {headline || "YOUR HEADLINE"}
              </h2>

              <p
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  lineHeight: 1.4,
                  color: "#eee",
                  maxWidth: "75%",
                }}
              >
                {description}
              </p>

              <div style={{ marginTop: "18px" }}>
                <div style={{ fontSize: "12px", color: "#ccc", fontWeight: 600 }}>
                  STARTING FROM
                </div>
                <div
                  style={{
                    color: "#ffd43b",
                    fontSize: "clamp(26px, 5vw, 36px)",
                    fontWeight: 950,
                  }}
                >
                  {price}
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: "2px solid rgba(255,255,255,0.2)",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
              }}
            >
              <div>
                <strong style={{ color: "#ffd43b" }}>ORDER NOW</strong>
                <br />
                WhatsApp: {phone}
              </div>
              <div
                style={{
                  background: "#ffd43b",
                  color: "#000",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  fontWeight: 900,
                  fontSize: "12px",
                }}
              >
                SHOP NOW
              </div>
            </div>
          </div>

          <button
            onClick={downloadFlyer}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "420px",
              margin: "20px auto 0",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background: "white",
              color: "#000",
              fontWeight: 900,
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            📥 Save / Print Flyer
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "10px",
  border: "1px solid #333",
  background: "#111",
  color: "white",
  fontSize: "15px",
  outline: "none",
};