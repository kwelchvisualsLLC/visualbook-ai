import { useState, useEffect, useMemo, useRef } from "react";
import {
  GOLD, BG, CARD, CARD2, BORDER, TEXT, MUTED,
  load, save, loadKey, saveKey, loadHome, saveHome, loadGmapKey, saveGmapKey, DEFAULT_HOME,
  loadReminderTimes, saveReminderTimes, uid,
  SHOOT_TYPES, deliverablesFor, money, fmtDate, fmtDateShort, to12h,
  balanceOf, depositOf, clientStats, localParse, aiParse, aiParseImage, ocrImage, fileToBase64, pushToCalendar,
  roundTripMiles,
} from "./lib.js";
import { Field, Input, Textarea, Select, Btn, Card, Pill, Stat, Empty, Modal, SectionTitle } from "./ui.jsx";

const NAV = [
  ["home", "Home", "M3 11l9-8 9 8M5 10v10h14V10"],
  ["bookings", "Bookings", "M4 5h16v15H4zM4 9h16M8 3v4M16 3v4"],
  ["clients", "Clients", "M16 19c0-3-3-5-6-5s-6 2-6 5M10 11a3 3 0 100-6 3 3 0 000 6M18 14a3 3 0 100-5"],
  ["quotes", "Quotes", "M6 3h9l5 5v13H6zM14 3v6h6M9 13h6M9 17h6"],
  ["calendar", "Calendar", "M4 5h16v15H4zM4 9h16M8 3v4M16 3v4"],
];

const Icon = ({ d, active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? GOLD : MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function App() {
  const [tab, setTab] = useState("home");
  const [bookings, setBookings] = useState(() => load("bookings", []));
  const [clients, setClients] = useState(() => load("clients", []));
  const [quotes, setQuotes] = useState(() => load("quotes", []));
  const [view, setView] = useState(null);

  useEffect(() => save("bookings", bookings), [bookings]);
  useEffect(() => save("clients", clients), [clients]);
  useEffect(() => save("quotes", quotes), [quotes]);

  function upsertClientFromBooking(b) {
    setClients((prev) => {
      let existing = prev.find((c) => c.id === b.clientId);
      if (!existing && b.clientName) {
        existing = prev.find((c) => c.name.trim().toLowerCase() === b.clientName.trim().toLowerCase());
      }
      if (existing) {
        return prev.map((c) => c.id === existing.id ? {
          ...c,
          email: c.email || b.email, phone: c.phone || b.phone,
          instagram: c.instagram || b.instagram, city: c.city || b.location,
        } : c);
      }
      return [...prev, {
        id: b.clientId, name: b.clientName || "Unnamed", email: b.email || "", phone: b.phone || "",
        instagram: b.instagram || "", website: "", city: b.location || "", notes: [], createdAt: Date.now(),
      }];
    });
  }

  function saveBooking(b, { silent } = {}) {
    const exists = bookings.some((x) => x.id === b.id);
    setBookings((prev) => exists ? prev.map((x) => x.id === b.id ? b : x) : [b, ...prev]);
    upsertClientFromBooking(b);
    if (!exists && !silent) pushToCalendar(b);
  }
  function deleteBooking(id) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  const ctx = {
    bookings, setBookings, clients, setClients, quotes, setQuotes,
    saveBooking, deleteBooking, setView, setTab,
  };

  return (
    <div style={{ background: BG, minHeight: "100dvh", color: TEXT, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", position: "relative" }}>
        <Header onSettings={() => setView({ type: "settings" })} />
        <div style={{ flex: 1, padding: "0 16px 90px", overflowY: "auto" }}>
          {tab === "home" && <Home {...ctx} />}
          {tab === "bookings" && <Bookings {...ctx} />}
          {tab === "clients" && <Clients {...ctx} />}
          {tab === "quotes" && <Quotes {...ctx} />}
          {tab === "calendar" && <CalendarView {...ctx} />}
        </div>
        <Nav tab={tab} setTab={(t) => { setTab(t); setView(null); }} />

        {(view?.type === "newBooking" || view?.type === "editBooking") && (
          <BookingForm {...ctx} editId={view.id} initial={view.initial} onClose={() => setView(null)} />
        )}
        {view?.type === "client" && <ClientProfile {...ctx} id={view.id} onClose={() => setView(null)} />}
        {view?.type === "report" && <ClientReport {...ctx} id={view.id} onClose={() => setView(null)} />}
        {view?.type === "settings" && <Settings onClose={() => setView(null)} {...ctx} />}
      </div>
    </div>
  );
}

function Header({ onSettings }) {
  return (
    <div style={{ padding: "16px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3, color: TEXT }}>
          VISUAL<span style={{ color: GOLD }}>BOOK</span>
        </div>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 3 }}>KWELCHVISUALS</div>
      </div>
      <button onClick={onSettings} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.7">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L12.5 2h-1l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.3 2.5h1l.3-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5a7 7 0 00.1-1z" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function Nav({ tab, setTab }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto",
      background: "#0d0d0dee", backdropFilter: "blur(12px)", borderTop: `1px solid ${BORDER}`,
      display: "flex", padding: "8px 4px calc(8px + env(safe-area-inset-bottom))", zIndex: 20,
    }}>
      {NAV.map(([key, label, d]) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0",
          }}>
            <Icon d={d} active={active} />
            <span style={{ fontSize: 10, color: active ? GOLD : MUTED, fontWeight: active ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================ HOME ============================
function Home({ bookings, clients, setView, setTab }) {
  const now = new Date();
  const totals = bookings.reduce((a, b) => {
    a.rev += Number(b.totalPrice) || 0;
    a.bal += balanceOf(b);
    a.hours += Number(b.hours) || 0;
    return a;
  }, { rev: 0, bal: 0, hours: 0 });

  const upcoming = bookings
    .filter((b) => b.date && new Date(b.date + "T00:00:00") >= new Date(now.toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginTop: 6, marginBottom: 10 }}>
        <Stat label="Total Revenue" value={money(totals.rev)} accent />
        <Stat label="Balance Due" value={money(totals.bal)} />
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <Stat label="Bookings" value={bookings.length} />
        <Stat label="Clients" value={clients.length} />
        <Stat label="Hours" value={totals.hours} />
      </div>

      <Btn style={{ width: "100%", padding: 16, fontSize: 16, marginBottom: 8 }}
        onClick={() => setView({ type: "newBooking" })}>
        ✦ New Smart Booking
      </Btn>
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <Btn variant="dark" style={{ flex: 1 }} onClick={() => setTab("quotes")}>＋ Quote</Btn>
        <Btn variant="dark" style={{ flex: 1 }} onClick={() => setTab("calendar")}>Calendar</Btn>
      </div>

      <SectionTitle right={<span onClick={() => setTab("bookings")} style={{ fontSize: 12, color: GOLD, cursor: "pointer" }}>All →</span>}>
        Upcoming Shoots
      </SectionTitle>
      {upcoming.length === 0 ? (
        <Empty text="No upcoming shoots yet. Tap New Smart Booking." />
      ) : upcoming.map((b) => (
        <Card key={b.id} onClick={() => setView({ type: "editBooking", id: b.id })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{b.clientName || "Client"}</div>
              <div style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>{b.shootType} · {b.location || "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>{fmtDateShort(b.date)}</div>
              <div style={{ color: MUTED, fontSize: 12 }}>{to12h(b.startTime)}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================ BOOKINGS ============================
function Bookings({ bookings, setView }) {
  const [q, setQ] = useState("");
  const sorted = [...bookings].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const filtered = sorted.filter((b) =>
    !q || (b.clientName + b.shootType + b.location).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "10px 0 14px" }}>
        <Input placeholder="Search bookings…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Btn onClick={() => setView({ type: "newBooking" })} style={{ whiteSpace: "nowrap" }}>＋ New</Btn>
      </div>
      {filtered.length === 0 ? <Empty text="No bookings yet." /> : filtered.map((b) => {
        const bal = balanceOf(b);
        return (
          <Card key={b.id} onClick={() => setView({ type: "editBooking", id: b.id })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{b.clientName || "Client"}</div>
                <div style={{ color: MUTED, fontSize: 13 }}>{b.shootType}</div>
              </div>
              <Pill color={bal > 0 ? "#e0a030" : "#4caf78"}>{bal > 0 ? money(bal) + " due" : "Paid"}</Pill>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED }}>
              <span>{fmtDate(b.date)} · {to12h(b.startTime)}</span>
              <span style={{ color: GOLD, fontWeight: 700 }}>{money(b.totalPrice)}</span>
            </div>
            {b.location && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>📍 {b.location}</div>}
          </Card>
        );
      })}
    </div>
  );
}

// ============================ BOOKING FORM ============================
const emptyBooking = () => ({
  id: uid(), clientId: uid(), clientName: "", email: "", phone: "", instagram: "",
  shootType: "", date: "", startTime: "", endTime: "", hours: 0, miles: 0, location: "",
  totalPrice: 0, depositStatus: "no", depositAmount: 0, deliverables: [], notes: "", createdAt: Date.now(),
});

function BookingForm({ editId, bookings, saveBooking, deleteBooking, onClose, initial }) {
  const existing = editId ? bookings.find((b) => b.id === editId) : null;
  const [b, setB] = useState(() => existing ? { ...existing } : { ...emptyBooking(), ...(initial || {}) });
  const [smart, setSmart] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [milesBusy, setMilesBusy] = useState(false);
  const [milesMsg, setMilesMsg] = useState("");
  const [review, setReview] = useState(null);
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const fileRef = useRef(null);
  const set = (k, v) => setB((p) => ({ ...p, [k]: v }));

  // stop the mic if the form unmounts while listening
  useEffect(() => () => { try { recogRef.current && recogRef.current.stop(); } catch { /* */ } }, []);

  function changeType(t) {
    setB((p) => ({ ...p, shootType: t, deliverables: deliverablesFor(t) }));
  }

  // Auto round-trip mileage from home base for a given destination
  async function computeMiles(destination, { force } = {}) {
    const dest = (destination ?? b.location ?? "").trim();
    if (!dest) { setMilesMsg("Add a location first to auto-calc miles."); return; }
    setMilesBusy(true); setMilesMsg("Calculating from base…");
    try {
      const { miles, oneWay, source } = await roundTripMiles(dest);
      setB((p) => ({ ...p, miles }));
      setMilesMsg(`${miles} mi round trip (${oneWay} each way · ${source})`);
    } catch (e) {
      setMilesMsg("Couldn't auto-calc: " + String(e.message || e).slice(0, 60));
    } finally {
      setMilesBusy(false);
    }
  }

  // Apply a parsed result into the form + build a "detected" review summary
  function applyParsed(parsed, used, err) {
    const detected = [];
    setB((p) => {
      const merged = { ...p };
      for (const k of Object.keys(parsed)) {
        const v = parsed[k];
        if (v !== "" && v !== 0 && v != null) merged[k] = v;
      }
      merged.depositStatus = parsed.depositStatus;
      if (parsed.depositAmount) merged.depositAmount = parsed.depositAmount;
      if (parsed.shootType) merged.deliverables = deliverablesFor(parsed.shootType);
      return merged;
    });
    if (parsed.clientName) detected.push(parsed.clientName);
    if (parsed.shootType) detected.push(parsed.shootType);
    if (parsed.date) detected.push(fmtDateShort(parsed.date));
    if (parsed.startTime) detected.push(to12h(parsed.startTime));
    if (parsed.location) detected.push("📍" + parsed.location);
    if (parsed.totalPrice) detected.push(money(parsed.totalPrice));
    if (parsed.depositStatus === "partial" && parsed.depositAmount) detected.push(money(parsed.depositAmount) + " dep");
    setReview(detected);
    setMsg(`Suggested from ${used} — review & adjust below.` + (err ? ` (${err})` : ""));
    if (parsed.location && !parsed.miles) computeMiles(parsed.location);
  }

  async function runSmartFill(textOverride) {
    const text = (typeof textOverride === "string" ? textOverride : smart).trim();
    if (!text) return;
    setBusy(true); setMsg(""); setReview(null);
    const key = loadKey();
    let parsed, used, err = "";
    try {
      if (key) { parsed = await aiParse(text, key); used = "Claude AI"; }
      else { parsed = localParse(text); used = "built-in parser"; }
    } catch (e) {
      parsed = localParse(text); used = "built-in parser"; err = String(e.message || e).slice(0, 60);
    }
    applyParsed(parsed, used, err);
    setBusy(false);
  }

  // Screenshot intake: Claude vision if key set, else on-device OCR + parser
  async function runImageFill(file) {
    if (!file) return;
    setBusy(true); setReview(null); setMsg("");
    const key = loadKey();
    try {
      let parsed, used;
      if (key) {
        setMsg("Reading screenshot with Claude…");
        const b64 = await fileToBase64(file);
        parsed = await aiParseImage(b64, file.type || "image/png", key);
        used = "Claude vision";
      } else {
        setMsg("Reading screenshot on-device (OCR)… first time may take a moment.");
        const text = await ocrImage(file);
        if (!text.trim()) throw new Error("No text found in image");
        setSmart(text);
        parsed = localParse(text);
        used = "on-device OCR";
      }
      applyParsed(parsed, used, "");
    } catch (e) {
      setMsg("Screenshot read failed: " + String(e.message || e).slice(0, 70) +
        (loadKey() ? "" : " — add your Anthropic key in Settings for best results."));
    } finally {
      setBusy(false);
    }
  }

  // Voice intake via the browser's speech recognition
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMsg("Voice isn't supported in this browser — try your keyboard's mic 🎤 in the text box."); return; }
    if (listening) { try { recogRef.current && recogRef.current.stop(); } catch { /* */ } return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = true;
    let finalText = smart ? smart + " " : "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i];
        if (tr.isFinal) finalText += tr[0].transcript + " ";
        else interim += tr[0].transcript;
      }
      setSmart((finalText + interim).trim());
    };
    rec.onerror = (e) => { setMsg("Voice error: " + (e.error || "unknown")); setListening(false); };
    rec.onend = () => {
      setListening(false);
      const t = finalText.trim();
      if (t) runSmartFill(t);
    };
    recogRef.current = rec;
    setReview(null); setMsg("Listening… tap the mic again when done.");
    setListening(true);
    try { rec.start(); } catch { /* */ }
  }

  function submit() {
    if (!b.clientName.trim()) { setMsg("Add a client name first."); return; }
    saveBooking({
      ...b,
      totalPrice: Number(b.totalPrice) || 0, hours: Number(b.hours) || 0,
      miles: Number(b.miles) || 0, depositAmount: Number(b.depositAmount) || 0,
    });
    onClose();
  }

  function toggleDeliverable(i) {
    setB((p) => ({ ...p, deliverables: p.deliverables.filter((_, idx) => idx !== i) }));
  }
  function addDeliverable() {
    const t = prompt("Add deliverable:");
    if (t) setB((p) => ({ ...p, deliverables: [...p.deliverables, t] }));
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{existing ? "Edit Booking" : "New Booking"}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 26, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ background: "linear-gradient(135deg,#1a1607,#141414)", border: `1px solid ${GOLD}44`, borderRadius: 14, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: 1, marginBottom: 8 }}>✦ AI SMART INTAKE</div>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>Type, speak, or drop in a screenshot — AI suggests the booking, you adjust anything below.</div>
        <Textarea rows={3} value={smart} onChange={(e) => setSmart(e.target.value)}
          placeholder={'Type or speak — e.g. "Music video for Jay, Saturday July 12, Oakland, $1800, 5 hours, $500 deposit"'} />

        {/* Voice + Screenshot row */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn variant={listening ? "gold" : "dark"} onClick={toggleVoice} disabled={busy}
            style={{ flex: 1, ...(listening ? { animation: "pulse 1s infinite" } : {}) }}>
            {listening ? "● Listening…" : "🎤 Voice"}
          </Btn>
          <Btn variant="dark" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy} style={{ flex: 1 }}>
            📷 Screenshot
          </Btn>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) runImageFill(f); e.target.value = ""; }} />
        </div>

        <Btn onClick={() => runSmartFill()} disabled={busy} style={{ width: "100%", marginTop: 8, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Reading…" : "✦ Suggest Booking"}
        </Btn>

        {review && review.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {review.map((d, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: GOLD + "1a", border: `1px solid ${GOLD}55`, borderRadius: 999, padding: "3px 9px" }}>{d}</span>
            ))}
          </div>
        )}
        {msg && <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>{msg}</div>}
      </div>

      <Field label="Client Name"><Input value={b.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Jay Carter" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Email"><Input value={b.email} onChange={(e) => set("email", e.target.value)} type="email" /></Field></div>
        <div style={{ flex: 1 }}><Field label="Phone"><Input value={b.phone} onChange={(e) => set("phone", e.target.value)} /></Field></div>
      </div>
      <Field label="Instagram"><Input value={b.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@handle" /></Field>

      <Field label="Shoot Type">
        <Select value={b.shootType} onChange={(e) => changeType(e.target.value)}>
          <option value="">Select type…</option>
          {SHOOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>

      <Field label="Date"><Input type="date" value={b.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Start"><Input type="time" value={b.startTime} onChange={(e) => set("startTime", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="End"><Input type="time" value={b.endTime} onChange={(e) => set("endTime", e.target.value)} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Hours"><Input type="number" inputMode="decimal" value={b.hours || ""} onChange={(e) => set("hours", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}>
          <Field label="Miles (round trip)">
            <div style={{ display: "flex", gap: 6 }}>
              <Input type="number" inputMode="decimal" value={b.miles || ""} onChange={(e) => set("miles", e.target.value)} style={{ flex: 1 }} />
              <Btn variant="ghost" disabled={milesBusy} onClick={() => computeMiles(b.location, { force: true })}
                style={{ padding: "0 12px", whiteSpace: "nowrap", opacity: milesBusy ? 0.5 : 1 }}>
                {milesBusy ? "…" : "↻ Auto"}
              </Btn>
            </div>
          </Field>
        </div>
      </div>
      <Field label="Location">
        <Input value={b.location} onChange={(e) => set("location", e.target.value)}
          onBlur={() => { if (b.location.trim() && !Number(b.miles)) computeMiles(b.location); }}
          placeholder="Oakland, CA" />
      </Field>
      {milesMsg && <div style={{ fontSize: 11, color: MUTED, marginTop: -6, marginBottom: 10 }}>🚗 {milesMsg}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Total Price"><Input type="number" inputMode="decimal" value={b.totalPrice || ""} onChange={(e) => set("totalPrice", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Deposit Paid">
          <Select value={b.depositStatus} onChange={(e) => set("depositStatus", e.target.value)}>
            <option value="no">No</option><option value="partial">Partial</option><option value="yes">Yes (full)</option>
          </Select>
        </Field></div>
      </div>
      {b.depositStatus === "partial" && (
        <Field label="Deposit Amount"><Input type="number" inputMode="decimal" value={b.depositAmount || ""} onChange={(e) => set("depositAmount", e.target.value)} /></Field>
      )}
      <div style={{ background: CARD2, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: MUTED }}>
        Balance due: <span style={{ color: GOLD, fontWeight: 700 }}>{money(balanceOf(b))}</span>
      </div>

      <Field label="Deliverables (auto-suggested)">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {b.deliverables.map((d, i) => (
            <span key={i} onClick={() => toggleDeliverable(i)} style={{
              fontSize: 12, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 999,
              padding: "6px 10px", cursor: "pointer", color: TEXT,
            }}>{d} <span style={{ color: MUTED }}>×</span></span>
          ))}
          <span onClick={addDeliverable} style={{ fontSize: 12, color: GOLD, border: `1px dashed ${GOLD}66`, borderRadius: 999, padding: "6px 10px", cursor: "pointer" }}>＋ add</span>
        </div>
      </Field>

      <Field label="Notes"><Textarea rows={2} value={b.notes} onChange={(e) => set("notes", e.target.value)} /></Field>

      <Btn onClick={submit} style={{ width: "100%", padding: 15, fontSize: 16, marginTop: 4 }}>
        {existing ? "Save Changes" : "Save & Add to Calendar"}
      </Btn>
      <div style={{ fontSize: 11, color: MUTED, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
        🔔 Adds calendar reminders the <b style={{ color: TEXT }}>evening before</b> & the <b style={{ color: TEXT }}>morning of</b>.
      </div>
      {existing && (
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Btn variant="dark" style={{ flex: 1 }} onClick={() => pushToCalendar(b)}>🔔 Calendar + Reminders</Btn>
          <Btn variant="danger" style={{ flex: 1 }} onClick={() => {
            if (confirm("Delete this booking? This cannot be undone.")) { deleteBooking(b.id); onClose(); }
          }}>Delete</Btn>
        </div>
      )}
      <div style={{ height: 10 }} />
    </Modal>
  );
}

// ============================ CLIENTS ============================
function Clients({ clients, bookings, setView }) {
  const [q, setQ] = useState("");
  const withStats = clients
    .map((c) => ({ c, s: clientStats(c.id, bookings) }))
    .filter(({ c }) => !q || c.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.s.revenue - a.s.revenue);

  return (
    <div>
      <div style={{ margin: "10px 0 14px" }}>
        <Input placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {withStats.length === 0 ? <Empty icon="◎" text="No clients yet. They're created automatically when you save a booking." /> :
        withStats.map(({ c, s }) => (
          <Card key={c.id} onClick={() => setView({ type: "client", id: c.id })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={c.name} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{s.count} shoot{s.count !== 1 ? "s" : ""} · {c.city || "—"}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: GOLD, fontWeight: 800, fontSize: 15 }}>{money(s.revenue)}</div>
                {s.balance > 0 && <div style={{ fontSize: 11, color: "#e0a030" }}>{money(s.balance)} due</div>}
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
}

function Avatar({ name }) {
  const initials = (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: 42, height: 42, borderRadius: 12, background: GOLD + "22", border: `1px solid ${GOLD}55`, color: GOLD, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{initials}</div>
  );
}

// ============================ CLIENT PROFILE ============================
function ClientProfile({ id, clients, bookings, setClients, setView, deleteBooking, onClose }) {
  const client = clients.find((c) => c.id === id);
  if (!client) return null;
  const s = clientStats(id, bookings);
  const set = (k, v) => setClients((prev) => prev.map((c) => c.id === id ? { ...c, [k]: v } : c));

  function addNote() {
    const t = prompt("CRM note:");
    if (!t) return;
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, notes: [{ id: uid(), text: t, date: Date.now() }, ...(c.notes || [])] } : c));
  }
  function delNote(nid) {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, notes: (c.notes || []).filter((n) => n.id !== nid) } : c));
  }
  function delClient() {
    if (!confirm(`Delete ${client.name} and ALL ${s.count} of their bookings? This cannot be undone.`)) return;
    s.shoots.forEach((b) => deleteBooking(b.id));
    setClients((prev) => prev.filter((c) => c.id !== id));
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={client.name} />
          <div style={{ fontSize: 19, fontWeight: 800 }}>{client.name}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 26, cursor: "pointer" }}>×</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Btn style={{ flex: 1 }} onClick={() => setView({ type: "report", id })}>📄 Report</Btn>
        <Btn variant="dark" style={{ flex: 1 }} onClick={() => setView({ type: "newBooking", initial: { clientId: id, clientName: client.name, email: client.email, phone: client.phone, instagram: client.instagram, location: client.city } })}>＋ Booking</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Stat label="Revenue" value={money(s.revenue)} accent />
        <Stat label="Balance" value={money(s.balance)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Stat label="Hours" value={s.hours} />
        <Stat label="Miles" value={s.miles} />
        <Stat label="Deposits" value={money(s.deposits)} />
      </div>

      <SectionTitle>Contact</SectionTitle>
      <Field label="Email"><Input value={client.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Phone"><Input value={client.phone} onChange={(e) => set("phone", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Instagram"><Input value={client.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Website"><Input value={client.website} onChange={(e) => set("website", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="City"><Input value={client.city} onChange={(e) => set("city", e.target.value)} /></Field></div>
      </div>

      <SectionTitle>Shoot History</SectionTitle>
      {s.shoots.length === 0 ? <div style={{ color: MUTED, fontSize: 13, marginBottom: 14 }}>No shoots yet.</div> :
        [...s.shoots].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((b) => (
          <Card key={b.id} onClick={() => setView({ type: "editBooking", id: b.id })} style={{ padding: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{b.shootType}</div>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>{money(b.totalPrice)}</div>
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{fmtDate(b.date)} · {b.hours || 0}h · {balanceOf(b) > 0 ? money(balanceOf(b)) + " due" : "paid"}</div>
          </Card>
        ))}

      <SectionTitle right={<span onClick={addNote} style={{ color: GOLD, fontSize: 12, cursor: "pointer" }}>＋ Add</span>}>CRM Notes</SectionTitle>
      {(client.notes || []).length === 0 ? <div style={{ color: MUTED, fontSize: 13 }}>No notes yet.</div> :
        (client.notes || []).map((n) => (
          <div key={n.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13 }}>{n.text}</div>
              <button onClick={() => delNote(n.id)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>{new Date(n.date).toLocaleDateString()}</div>
          </div>
        ))}

      <Btn variant="danger" style={{ width: "100%", marginTop: 18 }} onClick={delClient}>Delete Client</Btn>
      <div style={{ height: 10 }} />
    </Modal>
  );
}

// ============================ CLIENT REPORT ============================
function ClientReport({ id, clients, bookings, onClose }) {
  const client = clients.find((c) => c.id === id);
  if (!client) return null;
  const s = clientStats(id, bookings);
  const shoots = [...s.shoots].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Client Report</div>
        <div>
          <Btn variant="ghost" style={{ padding: "8px 12px", marginRight: 8 }} onClick={() => window.print()}>Print</Btn>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 26, cursor: "pointer" }}>×</button>
        </div>
      </div>

      <div id="report" style={{ background: "#fff", color: "#111", borderRadius: 12, padding: 22, fontSize: 13 }}>
        <div style={{ borderBottom: "2px solid #C9A84C", paddingBottom: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>KWELCH<span style={{ color: "#C9A84C" }}>VISUALS</span></div>
          <div style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>CLIENT REPORT · {new Date().toLocaleDateString()}</div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{client.name}</div>
        <div style={{ color: "#555", fontSize: 12, marginBottom: 16 }}>
          {[client.email, client.phone, client.instagram, client.website, client.city].filter(Boolean).join(" · ")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
          {[["Shoots", s.count], ["Revenue", money(s.revenue)], ["Hours", s.hours], ["Miles", s.miles], ["Deposits", money(s.deposits)], ["Balance Due", money(s.balance)]].map(([l, v]) => (
            <div key={l} style={{ background: "#f6f2e7", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{v}</div>
              <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 800, fontSize: 13, borderBottom: "1px solid #ddd", paddingBottom: 4, marginBottom: 8 }}>SHOOT HISTORY</div>
        {shoots.length === 0 ? <div style={{ color: "#888" }}>No shoots.</div> : shoots.map((b) => (
          <div key={b.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>{b.shootType}</span><span>{money(b.totalPrice)}</span>
            </div>
            <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
              {fmtDate(b.date)} · {to12h(b.startTime)}–{to12h(b.endTime)} · {b.hours || 0}h · {b.miles || 0}mi · {b.location || "—"}
            </div>
            <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
              Deposit: {b.depositStatus === "yes" ? "Paid in full" : b.depositStatus === "partial" ? money(depositOf(b)) + " partial" : "None"} · Balance: <b>{money(balanceOf(b))}</b>
            </div>
            {b.deliverables?.length > 0 && (
              <div style={{ color: "#444", fontSize: 11, marginTop: 3 }}>Deliverables: {b.deliverables.join(", ")}</div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 18, paddingTop: 10, borderTop: "2px solid #C9A84C", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15 }}>
          <span>TOTAL BALANCE DUE</span><span>{money(s.balance)}</span>
        </div>
        <div style={{ textAlign: "center", color: "#999", fontSize: 10, marginTop: 16 }}>KWelchVisuals · Fairfield, CA · @kwelchvisuals</div>
      </div>
      <div style={{ height: 10 }} />
    </Modal>
  );
}

// ============================ QUOTES ============================
const emptyQuote = () => ({ id: uid(), client: "", shootType: "", items: [{ label: "", amount: 0 }], notes: "", createdAt: Date.now() });

function Quotes({ quotes, setQuotes }) {
  const [editing, setEditing] = useState(null);
  const total = (qs) => qs.items.reduce((a, i) => a + (Number(i.amount) || 0), 0);

  function del(id) { if (confirm("Delete this quote?")) setQuotes((p) => p.filter((q) => q.id !== id)); }

  if (editing) {
    const q = editing;
    const setItem = (i, k, v) => setEditing((p) => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Quote</div>
          <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: MUTED, fontSize: 26, cursor: "pointer" }}>×</button>
        </div>
        <Field label="Client / Lead"><Input value={q.client} onChange={(e) => setEditing({ ...q, client: e.target.value })} /></Field>
        <Field label="Shoot Type">
          <Select value={q.shootType} onChange={(e) => {
            const items = deliverablesFor(e.target.value).map((d) => ({ label: d, amount: 0 }));
            setEditing({ ...q, shootType: e.target.value, items: items.length ? items : q.items });
          }}>
            <option value="">Select…</option>
            {SHOOT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <SectionTitle right={<span onClick={() => setEditing({ ...q, items: [...q.items, { label: "", amount: 0 }] })} style={{ color: GOLD, fontSize: 12, cursor: "pointer" }}>＋ Line</span>}>Line Items</SectionTitle>
        {q.items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Input placeholder="Item" value={it.label} onChange={(e) => setItem(i, "label", e.target.value)} style={{ flex: 2 }} />
            <Input placeholder="$" type="number" inputMode="decimal" value={it.amount || ""} onChange={(e) => setItem(i, "amount", e.target.value)} style={{ flex: 1 }} />
            <button onClick={() => setEditing({ ...q, items: q.items.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: MUTED, fontSize: 20, cursor: "pointer" }}>×</button>
          </div>
        ))}
        <div style={{ background: CARD2, borderRadius: 10, padding: "12px 14px", margin: "10px 0 14px", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
          <span>Total</span><span style={{ color: GOLD }}>{money(total(q))}</span>
        </div>
        <Field label="Notes"><Textarea rows={2} value={q.notes} onChange={(e) => setEditing({ ...q, notes: e.target.value })} /></Field>
        <Btn style={{ width: "100%" }} onClick={() => {
          setQuotes((p) => p.some((x) => x.id === q.id) ? p.map((x) => x.id === q.id ? q : x) : [q, ...p]);
          setEditing(null);
        }}>Save Quote</Btn>
      </div>
    );
  }

  return (
    <div>
      <Btn style={{ width: "100%", margin: "10px 0 16px" }} onClick={() => setEditing(emptyQuote())}>＋ New Quote</Btn>
      {quotes.length === 0 ? <Empty icon="❖" text="No quotes yet." /> : quotes.map((q) => (
        <Card key={q.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div onClick={() => setEditing(q)} style={{ cursor: "pointer", flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{q.client || "Untitled"}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{q.shootType || "—"} · {q.items.length} items</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: GOLD, fontWeight: 800 }}>{money(total(q))}</div>
              <button onClick={() => del(q.id)} style={{ background: "none", border: "none", color: "#e25555", fontSize: 12, cursor: "pointer" }}>delete</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================ CALENDAR ============================
function CalendarView({ bookings, setView }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(cursor.y, cursor.m, 1);
  const startDay = first.getDay();
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const byDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => { if (b.date) (map[b.date] ||= []).push(b); });
    return map;
  }, [bookings]);
  const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayStr = new Date().toISOString().slice(0, 10);
  const [sel, setSel] = useState(todayStr);

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

  const selBookings = byDate[sel] || [];

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 })} style={navBtn}>‹</button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{monthName}</div>
        <button onClick={() => setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 })} style={navBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, color: MUTED }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const has = byDate[date]?.length;
          const isToday = date === todayStr;
          const isSel = date === sel;
          return (
            <button key={i} onClick={() => setSel(date)} style={{
              aspectRatio: "1", border: isSel ? `1px solid ${GOLD}` : `1px solid ${BORDER}`,
              background: isSel ? GOLD + "22" : isToday ? CARD2 : CARD, borderRadius: 9,
              color: TEXT, cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", position: "relative", fontSize: 13,
            }}>
              <span style={{ fontWeight: isToday ? 800 : 500, color: isToday ? GOLD : TEXT }}>{+date.slice(-2)}</span>
              {has ? <span style={{ position: "absolute", bottom: 5, width: 5, height: 5, borderRadius: 9, background: GOLD }} /> : null}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionTitle>{fmtDate(sel)}</SectionTitle>
        {selBookings.length === 0 ? <div style={{ color: MUTED, fontSize: 13 }}>No shoots this day.</div> :
          selBookings.map((b) => (
            <Card key={b.id} onClick={() => setView({ type: "editBooking", id: b.id })}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700 }}>{b.clientName}</div>
                <div style={{ color: GOLD, fontSize: 13 }}>{to12h(b.startTime)}</div>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{b.shootType} · {b.location || "—"}</div>
            </Card>
          ))}
      </div>
    </div>
  );
}
const navBtn = { background: CARD2, border: `1px solid ${BORDER}`, color: TEXT, width: 38, height: 38, borderRadius: 10, fontSize: 20, cursor: "pointer" };

// ============================ SETTINGS ============================
function Settings({ onClose, bookings, clients, quotes }) {
  const [key, setKey] = useState(loadKey());
  const [home, setHome] = useState(loadHome());
  const [gmap, setGmap] = useState(loadGmapKey());
  const [saved, setSaved] = useState(false);
  const [savedTravel, setSavedTravel] = useState(false);
  const rt0 = loadReminderTimes();
  const hhmm = (s) => s.slice(0, 2) + ":" + s.slice(2);
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem("vb_phone") || "707-310-1618"; } catch { return "707-310-1618"; } });
  const [beforeT, setBeforeT] = useState(hhmm(rt0.before));
  const [morningT, setMorningT] = useState(hhmm(rt0.morning));
  const [savedRem, setSavedRem] = useState(false);

  function exportData() {
    const blob = new Blob([JSON.stringify({ bookings, clients, quotes }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visualbook-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Settings</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 26, cursor: "pointer" }}>×</button>
      </div>

      <SectionTitle>AI Smart Intake</SectionTitle>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
        Paste your Anthropic API key to power auto-fill with Claude (claude-sonnet-4-6). Stored only on this device.
        Without a key, a built-in offline parser is used automatically.
      </div>
      <Field label="Anthropic API Key">
        <Input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" />
      </Field>
      <Btn style={{ width: "100%" }} onClick={() => { saveKey(key.trim()); setSaved(true); setTimeout(() => setSaved(false), 1500); }}>
        {saved ? "✓ Saved" : "Save Key"}
      </Btn>

      <div style={{ height: 20 }} />
      <SectionTitle>Travel Mileage</SectionTitle>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
        Bookings auto-fill <b style={{ color: TEXT }}>round-trip</b> driving miles from your home base.
        Leave the Google key blank to use free driving-distance routing automatically — or add a Google Maps
        API key for Google-exact mileage.
      </div>
      <Field label="Home Base Address">
        <Input value={home} onChange={(e) => setHome(e.target.value)} placeholder={DEFAULT_HOME} />
      </Field>
      <Field label="Google Maps API Key (optional)">
        <Input type="password" value={gmap} onChange={(e) => setGmap(e.target.value)} placeholder="AIza… (leave blank for free auto-calc)" />
      </Field>
      <Btn style={{ width: "100%" }} onClick={() => {
        saveHome(home); saveGmapKey(gmap.trim());
        try { localStorage.removeItem("vb_geocache"); } catch { /* */ }
        setSavedTravel(true); setTimeout(() => setSavedTravel(false), 1500);
      }}>
        {savedTravel ? "✓ Saved" : "Save Travel Settings"}
      </Btn>

      <div style={{ height: 20 }} />
      <SectionTitle>Appointment Reminders</SectionTitle>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
        Every booking adds two phone reminders — the <b style={{ color: TEXT }}>evening before</b> and the
        <b style={{ color: TEXT }}> morning of</b> — straight to your calendar. Tweak the times below.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Day Before"><Input type="time" value={beforeT} onChange={(e) => setBeforeT(e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Morning Of"><Input type="time" value={morningT} onChange={(e) => setMorningT(e.target.value)} /></Field></div>
      </div>
      <Field label="Your Mobile"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="707-310-1618" /></Field>
      <Btn style={{ width: "100%" }} onClick={() => {
        saveReminderTimes(beforeT.replace(":", ""), morningT.replace(":", ""));
        try { localStorage.setItem("vb_phone", phone); } catch { /* */ }
        setSavedRem(true); setTimeout(() => setSavedRem(false), 1500);
      }}>
        {savedRem ? "✓ Saved" : "Save Reminder Settings"}
      </Btn>

      <div style={{ height: 20 }} />
      <SectionTitle>Data</SectionTitle>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 10 }}>
        {bookings.length} bookings · {clients.length} clients · {quotes.length} quotes — all stored locally.
      </div>
      <Btn variant="dark" style={{ width: "100%", marginBottom: 10 }} onClick={exportData}>⤓ Export Backup (JSON)</Btn>
      <Btn variant="danger" style={{ width: "100%" }} onClick={() => {
        if (confirm("ERASE ALL local data (bookings, clients, quotes)? This cannot be undone.")) {
          localStorage.removeItem("vb_bookings"); localStorage.removeItem("vb_clients"); localStorage.removeItem("vb_quotes");
          location.reload();
        }
      }}>Erase All Data</Btn>
      <div style={{ textAlign: "center", color: MUTED, fontSize: 11, marginTop: 20 }}>VisualBook AI · KWelchVisuals</div>
      <div style={{ height: 10 }} />
    </Modal>
  );
}
