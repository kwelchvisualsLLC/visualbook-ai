import { GOLD, CARD, CARD2, BORDER, TEXT, MUTED, BG } from "./lib.js";

export const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: 12 }}>
    <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
    {children}
  </label>
);

const inputBase = {
  width: "100%", boxSizing: "border-box", background: CARD2, color: TEXT,
  border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px",
  fontSize: 15, outline: "none", fontFamily: "inherit",
};

export const Input = (props) => (
  <input {...props} style={{ ...inputBase, ...(props.style || {}) }} />
);
export const Textarea = (props) => (
  <textarea {...props} style={{ ...inputBase, resize: "vertical", ...(props.style || {}) }} />
);
export const Select = ({ children, ...props }) => (
  <select {...props} style={{ ...inputBase, appearance: "none", WebkitAppearance: "none", ...(props.style || {}) }}>
    {children}
  </select>
);

export const Btn = ({ variant = "gold", style, ...props }) => {
  const v = {
    gold: { background: GOLD, color: "#0a0a0a", border: "none" },
    ghost: { background: "transparent", color: GOLD, border: `1px solid ${GOLD}` },
    dark: { background: CARD2, color: TEXT, border: `1px solid ${BORDER}` },
    danger: { background: "transparent", color: "#e25555", border: "1px solid #5a2a2a" },
  }[variant];
  return (
    <button
      {...props}
      style={{
        padding: "12px 18px", borderRadius: 10, fontSize: 15, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3,
        ...v, ...(style || {}),
      }}
    />
  );
};

export const Card = ({ children, onClick, style }) => (
  <div
    onClick={onClick}
    style={{
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: 16, marginBottom: 12, cursor: onClick ? "pointer" : "default",
      ...(style || {}),
    }}
  >
    {children}
  </div>
);

export const Pill = ({ children, color = GOLD }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, color, border: `1px solid ${color}55`,
    background: color + "1a", padding: "3px 9px", borderRadius: 999, letterSpacing: 0.4,
  }}>{children}</span>
);

export const Stat = ({ label, value, accent }) => (
  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: accent ? GOLD : TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    <div style={{ fontSize: 11, color: MUTED, letterSpacing: 0.6, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
  </div>
);

export const Empty = ({ icon = "✦", text }) => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
    <div style={{ fontSize: 40, color: BORDER, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 14 }}>{text}</div>
  </div>
);

export function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", zIndex: 50,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: BG, border: `1px solid ${BORDER}`, borderRadius: "18px 18px 0 0",
          width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const SectionTitle = ({ children, right }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 12px" }}>
    <div style={{ fontSize: 13, color: MUTED, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>{children}</div>
    {right}
  </div>
);
