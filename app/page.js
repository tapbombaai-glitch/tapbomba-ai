style={{
  padding: "14px 10px",
  borderRadius: 14,
  border:
    mode === key
      ? `2px solid ${BRAND.accent}`
      : "1px solid #333",
  background:
    mode === key
      ? BRAND.accent
      : "#111",
  color:
    mode === key
      ? "#000"
      : "#fff",
  fontWeight: 800,
  cursor: "pointer",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  position: "relative",
  zIndex: 10,
}}