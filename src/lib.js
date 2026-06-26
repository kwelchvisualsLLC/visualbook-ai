// VisualBook AI — data, parsing, and helpers
// Keith Welch Jr / KWelchVisuals

export const GOLD = "#C9A84C";
export const BG = "#0a0a0a";
export const CARD = "#141414";
export const CARD2 = "#1c1c1c";
export const BORDER = "#2a2a2a";
export const TEXT = "#ffffff";
export const MUTED = "#888888";

// ---------- localStorage ----------
const KEYS = {
  bookings: "vb_bookings",
  clients: "vb_clients",
  quotes: "vb_quotes",
  apikey: "vb_apikey",
};

// Home base used for round-trip travel mileage
export const DEFAULT_HOME = "2780 North Texas St, Fairfield, CA 94533";
export function loadHome() {
  try { return localStorage.getItem("vb_home") || DEFAULT_HOME; } catch { return DEFAULT_HOME; }
}
export function saveHome(v) {
  try { (v && v.trim()) ? localStorage.setItem("vb_home", v.trim()) : localStorage.removeItem("vb_home"); } catch { /* */ }
}
export function loadGmapKey() {
  try { return localStorage.getItem("vb_gmapkey") || ""; } catch { return ""; }
}
export function saveGmapKey(v) {
  try { (v && v.trim()) ? localStorage.setItem("vb_gmapkey", v.trim()) : localStorage.removeItem("vb_gmapkey"); } catch { /* */ }
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(KEYS[key] || key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key, val) {
  try {
    localStorage.setItem(KEYS[key] || key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}
export function loadKey() {
  try { return localStorage.getItem(KEYS.apikey) || ""; } catch { return ""; }
}
export function saveKey(v) {
  try { v ? localStorage.setItem(KEYS.apikey, v) : localStorage.removeItem(KEYS.apikey); } catch { /* */ }
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- shoot types + auto deliverables ----------
export const SHOOT_TYPES = [
  "Wedding",
  "Corporate Event",
  "School/District",
  "Government/Municipal",
  "Music Video",
  "Brand/Commercial",
  "Real Estate",
  "Portrait/Headshots",
  "Sports",
  "Birthday/Party",
  "Visibility Vault Retainer",
  "Other",
];

export const DELIVERABLES = {
  Wedding: ["Cinematic highlight film (3–5 min)", "Full ceremony edit", "Edited photo gallery (300+)", "Drone aerials", "Social teaser reel"],
  "Corporate Event": ["Event recap video (60–90s)", "Edited photo gallery", "Speaker/keynote clips", "Vertical social cutdowns"],
  "School/District": ["Event coverage video", "Edited photo gallery", "30–60s promo reel", "Social-ready vertical clips"],
  "Government/Municipal": ["Event documentation video", "PSA / promo video", "Edited photo archive", "Social cutdowns"],
  "Music Video": ["Cinematic music video", "Behind-the-scenes clip", "Vertical social cuts (3)", "Color-graded master"],
  "Brand/Commercial": ["Brand film (30–60s)", "Product / lifestyle photos", "Social ad cutdowns (3)", "Raw selects"],
  "Real Estate": ["HDR property photos (25–40)", "Cinematic walkthrough video", "Drone aerials", "Vertical listing reel"],
  "Portrait/Headshots": ["Retouched headshots (5–10)", "Full edited gallery", "Social crop versions"],
  Sports: ["Game/action photo gallery", "Highlight hype reel", "Vertical social clips"],
  "Birthday/Party": ["Event recap video", "Edited photo gallery", "Social clips (2–3)"],
  "Visibility Vault Retainer": ["Monthly content shoot", "20+ edited photos", "4 reels / shorts", "Posting-ready captioned assets"],
  Other: ["Edited photo gallery", "Edited highlight video"],
};

export function deliverablesFor(type) {
  return (DELIVERABLES[type] || DELIVERABLES.Other).slice();
}

// ---------- money / format helpers ----------
export const money = (n) =>
  "$" + (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
export function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function to12h(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

// balance due for a booking
export function balanceOf(b) {
  const total = Number(b.totalPrice) || 0;
  const dep = b.depositStatus === "yes" ? total : Number(b.depositAmount) || 0;
  return Math.max(0, total - dep);
}
export function depositOf(b) {
  const total = Number(b.totalPrice) || 0;
  if (b.depositStatus === "yes") return total;
  if (b.depositStatus === "partial") return Number(b.depositAmount) || 0;
  return 0;
}

// ---------- client aggregation ----------
export function clientStats(clientId, bookings) {
  const list = bookings.filter((b) => b.clientId === clientId);
  let revenue = 0, hours = 0, miles = 0, deposits = 0, balance = 0;
  for (const b of list) {
    revenue += Number(b.totalPrice) || 0;
    hours += Number(b.hours) || 0;
    miles += Number(b.miles) || 0;
    deposits += depositOf(b);
    balance += balanceOf(b);
  }
  return { shoots: list, count: list.length, revenue, hours, miles, deposits, balance };
}

// ===================================================================
// AI SMART INTAKE
// ===================================================================

const FIELDS_SPEC = `Return ONLY a JSON object (no markdown, no prose) with these keys:
{
 "clientName": string, "email": string, "phone": string, "instagram": string,
 "shootType": one of ["Wedding","Corporate Event","School/District","Government/Municipal","Music Video","Brand/Commercial","Real Estate","Portrait/Headshots","Sports","Birthday/Party","Visibility Vault Retainer","Other"],
 "date": "YYYY-MM-DD", "startTime": "HH:MM" 24h, "endTime": "HH:MM" 24h,
 "hours": number, "miles": number, "location": string,
 "totalPrice": number, "depositStatus": one of ["yes","no","partial"], "depositAmount": number
}
Use "" or 0 for anything not stated. Infer endTime from startTime+hours if only one is given. Today's date is ${new Date().toISOString().slice(0,10)}.`;

async function callClaude(apiKey, content, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error("API " + res.status + ": " + t.slice(0, 200));
  }
  const data = await res.json();
  const raw = (data.content || []).map((c) => c.text || "").join("");
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in response");
  return normalize(JSON.parse(m[0]));
}

// Call the real Claude API on free-text (browser-direct). Returns parsed fields or throws.
export async function aiParse(text, apiKey) {
  return callClaude(apiKey, text,
    "You are a booking-intake parser for a photography/videography business. " + FIELDS_SPEC);
}

// Call Claude vision on a screenshot (DM, text, email, note). Returns parsed fields or throws.
export async function aiParseImage(base64, mediaType, apiKey) {
  return callClaude(apiKey, [
    { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
    { type: "text", text: "This is a screenshot of a booking conversation or request. Extract the photography/videography booking details." },
  ], "You extract photography/videography booking details from a screenshot. " + FIELDS_SPEC);
}

// File -> base64 (no data: prefix)
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// On-device OCR fallback (no API key) via lazy-loaded Tesseract.js from CDN. Returns text.
export async function ocrImage(file) {
  const mod = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js");
  const T = mod.default || mod;
  const { data } = await T.recognize(file, "eng");
  return (data && data.text) || "";
}

// ---------- Offline heuristic parser ----------
const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const TYPE_HINTS = [
  [/\bwedding|bride|groom|ceremony|reception\b/i, "Wedding"],
  [/\bcorporate|conference|keynote|company event\b/i, "Corporate Event"],
  [/\bschool|district|graduation|classroom|campus\b/i, "School/District"],
  [/\bgovernment|municipal|city of|council|mayor|civic\b/i, "Government/Municipal"],
  [/\bmusic video|music vid|rapper|artist|song|track\b/i, "Music Video"],
  [/\bbrand|commercial|product shoot|ad campaign|promo\b/i, "Brand/Commercial"],
  [/\breal estate|property|listing|home tour|house tour\b/i, "Real Estate"],
  [/\bheadshot|portrait|profile pic|linkedin photo\b/i, "Portrait/Headshots"],
  [/\bsports|game|match|tournament|athlete\b/i, "Sports"],
  [/\bbirthday|party|quincea|sweet 16|anniversary\b/i, "Birthday/Party"],
  [/\bretainer|visibility vault|monthly content\b/i, "Visibility Vault Retainer"],
];

function parseTime(str) {
  // returns "HH:MM" 24h or null
  const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return null;
}

function addHours(time, hrs) {
  if (!time || !hrs) return "";
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m + Math.round(hrs * 60);
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function localParse(text) {
  const t = " " + text + " ";
  const out = {
    clientName: "", email: "", phone: "", instagram: "", shootType: "",
    date: "", startTime: "", endTime: "", hours: 0, miles: 0, location: "",
    totalPrice: 0, depositStatus: "no", depositAmount: 0,
  };

  // email
  const email = t.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (email) out.email = email[0];
  // instagram — must be at a word boundary, not inside an email
  const ig = t.match(/(?:^|[\s,;(])@([A-Za-z0-9_.]{2,})/);
  if (ig) out.instagram = "@" + ig[1].replace(/\.+$/, "");
  // phone
  const phone = t.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phone) out.phone = phone[0].trim();

  // price — biggest $ amount, or "for X" dollars
  const prices = [...t.matchAll(/\$\s?([\d,]+(?:\.\d{1,2})?)/g)].map((m) =>
    parseFloat(m[1].replace(/,/g, ""))
  );
  // deposit detection
  const depMatch = t.match(/(\$?\s?[\d,]+)\s*(?:deposit|down|paid|retainer paid)/i) ||
                   t.match(/deposit\s*(?:of|is|:)?\s*\$?\s?([\d,]+)/i);
  let depositVal = 0;
  if (depMatch) {
    const num = (depMatch[1] || depMatch[2] || "").replace(/[$\s,]/g, "");
    depositVal = parseFloat(num) || 0;
  }
  if (prices.length) {
    out.totalPrice = Math.max(...prices);
    if (depositVal && depositVal < out.totalPrice) {
      out.depositAmount = depositVal;
      out.depositStatus = "partial";
    }
  }
  if (/deposit\s*paid|paid in full|fully paid|paid up front/i.test(t)) {
    if (/in full|fully paid/i.test(t)) out.depositStatus = "yes";
    else if (!out.depositAmount) out.depositStatus = "partial";
  }
  if (/no deposit|deposit not paid|unpaid|nothing paid/i.test(t)) out.depositStatus = "no";

  // hours
  const hrs = t.match(/([\d.]+)\s*(?:hours?|hrs?|hr)\b/i);
  if (hrs) out.hours = parseFloat(hrs[1]);
  // miles
  const mi = t.match(/([\d.]+)\s*(?:miles?|mi)\b/i);
  if (mi) out.miles = parseFloat(mi[1]);

  // time range "2pm to 6pm" / "2-6pm" / "from 2pm"
  const range = t.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|–|until|til)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (range) {
    let a = range[1].trim();
    const b = range[2].trim();
    // if first has no am/pm, borrow from second
    if (!/am|pm/i.test(a)) {
      const ap = b.match(/am|pm/i)[0];
      a = a + ap;
    }
    out.startTime = parseTime(a) || "";
    out.endTime = parseTime(b) || "";
  } else {
    const single = t.match(/(?:at|@|from|starts?(?: at)?)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i) ||
                   t.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    if (single) out.startTime = parseTime(single[1]) || "";
  }
  // derive hours from range or end from hours
  if (out.startTime && out.endTime && !out.hours) {
    const [sh, sm] = out.startTime.split(":").map(Number);
    const [eh, em] = out.endTime.split(":").map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff < 0) diff += 1440;
    out.hours = Math.round((diff / 60) * 10) / 10;
  } else if (out.startTime && out.hours && !out.endTime) {
    out.endTime = addHours(out.startTime, out.hours);
  }

  // date — "July 12" / "Jul 12 2025" / "12 July"
  const md = t.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/);
  const dm = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:,?\s*(\d{4}))?/);
  const numeric = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  let dt = null;
  if (md && MONTHS[md[1].toLowerCase()] !== undefined) {
    dt = { mo: MONTHS[md[1].toLowerCase()], day: +md[2], yr: md[3] ? +md[3] : null };
  } else if (dm && MONTHS[dm[2].toLowerCase()] !== undefined) {
    dt = { mo: MONTHS[dm[2].toLowerCase()], day: +dm[1], yr: dm[3] ? +dm[3] : null };
  } else if (numeric) {
    let yr = numeric[3] ? +numeric[3] : null;
    if (yr && yr < 100) yr += 2000;
    dt = { mo: +numeric[1] - 1, day: +numeric[2], yr };
  }
  if (dt) {
    const now = new Date();
    let yr = dt.yr;
    if (!yr) {
      yr = now.getFullYear();
      // if the date already passed this year, assume next year
      const cand = new Date(yr, dt.mo, dt.day);
      if (cand < new Date(now.getFullYear(), now.getMonth(), now.getDate())) yr += 1;
    }
    if (dt.mo >= 0 && dt.mo <= 11 && dt.day >= 1 && dt.day <= 31) {
      out.date = `${yr}-${String(dt.mo + 1).padStart(2, "0")}-${String(dt.day).padStart(2, "0")}`;
    }
  }

  // shoot type
  for (const [re, type] of TYPE_HINTS) {
    if (re.test(t)) { out.shootType = type; break; }
  }
  if (!out.shootType) out.shootType = "Other";

  // location — "in Oakland", "at <place>", or a comma-delimited place chunk
  let loc = "";
  const inMatch = text.match(/\b(?:in|at|located in|location[:\s]+)\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/);
  if (inMatch) loc = inMatch[1].trim();
  if (!loc) {
    // look for a Title-Case city-like token among comma segments
    for (const seg of text.split(/[,;]/)) {
      const s = seg.trim();
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(s) && s.length <= 28 && s !== out.clientName) {
        if (!/wedding|video|shoot|photo/i.test(s)) { loc = s; break; }
      }
    }
  }
  out.location = loc;

  // client name — "for Jay" / "client Jay" / "with Jay" (stop at common boundary words)
  const nameMatch = text.match(/\b(?:for|client|with|booking)\s+([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,2})/);
  if (nameMatch) {
    let nm = nameMatch[1].trim();
    // strip trailing words that are clearly not names
    nm = nm.replace(/\s+(On|At|In|For|The|This|Next|Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday).*$/i, "").trim();
    out.clientName = nm;
  }
  if (loc && out.clientName && loc === out.clientName) out.location = "";

  return normalize(out);
}

function normalize(o) {
  const valid = SHOOT_TYPES;
  let st = o.shootType || "";
  if (st && !valid.includes(st)) {
    const hit = valid.find((v) => v.toLowerCase() === String(st).toLowerCase());
    st = hit || "Other";
  }
  const dep = ["yes", "no", "partial"].includes(o.depositStatus) ? o.depositStatus : "no";
  return {
    clientName: o.clientName || "",
    email: o.email || "",
    phone: o.phone || "",
    instagram: o.instagram || "",
    shootType: st || "Other",
    date: o.date || "",
    startTime: o.startTime || "",
    endTime: o.endTime || "",
    hours: Number(o.hours) || 0,
    miles: Number(o.miles) || 0,
    location: o.location || "",
    totalPrice: Number(o.totalPrice) || 0,
    depositStatus: dep,
    depositAmount: Number(o.depositAmount) || 0,
  };
}

// ---------- Google Calendar push ----------
function icsStamp(date, time, fallbackHour) {
  // returns YYYYMMDDTHHMMSS (local, floating)
  const d = (date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  const t = (time || fallbackHour).replace(":", "") + "00";
  return d + "T" + t;
}

export function calendarLink(b) {
  const title = `${b.shootType || "Shoot"} — ${b.clientName || "Client"}`;
  const start = icsStamp(b.date, b.startTime, "10:00");
  const end = icsStamp(b.date, b.endTime || addHours(b.startTime || "10:00", b.hours || 2), "12:00");
  const details = [
    `Client: ${b.clientName || "—"}`,
    b.phone && `Phone: ${b.phone}`,
    b.email && `Email: ${b.email}`,
    `Total: ${money(b.totalPrice)}`,
    `Deposit: ${b.depositStatus} ${b.depositAmount ? money(b.depositAmount) : ""}`,
    `Balance due: ${money(balanceOf(b))}`,
    b.hours && `Hours: ${b.hours}`,
    b.miles && `Miles: ${b.miles}`,
    b.deliverables && b.deliverables.length && `Deliverables:\n- ${b.deliverables.join("\n- ")}`,
  ].filter(Boolean).join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details,
    location: b.location || "",
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

// shift a YYYY-MM-DD string by N days, return YYYYMMDD
function shiftDateStamp(dateStr, deltaDays) {
  const d = new Date((dateStr || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// Reminder defaults: evening before (6pm) and morning of (7:30am)
export function loadReminderTimes() {
  try {
    const r = JSON.parse(localStorage.getItem("vb_reminders") || "null");
    if (r && r.before && r.morning) return r;
  } catch { /* */ }
  return { before: "1800", morning: "0730" };
}
export function saveReminderTimes(before, morning) {
  try { localStorage.setItem("vb_reminders", JSON.stringify({ before, morning })); } catch { /* */ }
}

export function icsFile(b) {
  const start = icsStamp(b.date, b.startTime, "10:00");
  const end = icsStamp(b.date, b.endTime || addHours(b.startTime || "10:00", b.hours || 2), "12:00");
  const esc = (s) => String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const summary = `${b.shootType} — ${b.clientName}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VisualBook AI//KWelchVisuals//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    "UID:" + (b.id || uid()) + "@visualbook",
    "DTSTAMP:" + stamp,
    "DTSTART:" + start, "DTEND:" + end,
    "SUMMARY:" + esc(summary),
    "LOCATION:" + esc(b.location),
    "DESCRIPTION:" + esc(
      `Client: ${b.clientName}\n${b.phone || ""} ${b.email || ""}\n` +
      `Total ${money(b.totalPrice)} • Balance due ${money(balanceOf(b))}\n` +
      (b.deliverables?.length ? `Deliverables:\n- ${b.deliverables.join("\n- ")}` : "")
    ),
  ];

  // Two reminders when a date is set: evening before + morning of
  if (b.date) {
    const rt = loadReminderTimes();
    const beforeTrig = shiftDateStamp(b.date, -1) + "T" + rt.before + "00";
    const morningTrig = b.date.replace(/-/g, "") + "T" + rt.morning + "00";
    lines.push(
      "BEGIN:VALARM", "ACTION:DISPLAY",
      "DESCRIPTION:" + esc("Tomorrow: " + summary + (b.location ? " @ " + b.location : "")),
      "TRIGGER;VALUE=DATE-TIME:" + beforeTrig, "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY",
      "DESCRIPTION:" + esc("Today: " + summary + (b.startTime ? " at " + to12h(b.startTime) : "")),
      "TRIGGER;VALUE=DATE-TIME:" + morningTrig, "END:VALARM",
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

// Download/open the .ics so it can be added to the phone's calendar WITH reminders.
export function downloadIcs(b) {
  try {
    const blob = new Blob([icsFile(b)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(b.shootType || "shoot")}-${(b.clientName || "client")}.ics`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    return true;
  } catch { return false; }
}

// ===================================================================
// AUTO TRAVEL MILES (round trip from home base)
// ===================================================================
const M_PER_MILE = 1609.344;

function geoCache() {
  try { return JSON.parse(localStorage.getItem("vb_geocache") || "{}"); } catch { return {}; }
}
function geoCacheSet(addr, coord) {
  try {
    const c = geoCache();
    c[addr.toLowerCase().trim()] = coord;
    localStorage.setItem("vb_geocache", JSON.stringify(c));
  } catch { /* */ }
}

// Geocode an address -> {lat, lon} using free OpenStreetMap Nominatim (CORS-enabled), cached.
async function geocode(address) {
  const key = address.toLowerCase().trim();
  const cached = geoCache()[key];
  if (cached) return cached;
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" +
    encodeURIComponent(address);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Geocode failed (" + res.status + ")");
  const data = await res.json();
  if (!data.length) throw new Error("Address not found");
  const coord = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  geoCacheSet(address, coord);
  return coord;
}

// One-way driving distance (miles) via free OSRM routing (CORS-enabled).
async function osrmMiles(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing failed (" + res.status + ")");
  const data = await res.json();
  if (!data.routes || !data.routes.length) throw new Error("No route found");
  return data.routes[0].distance / M_PER_MILE;
}

// Google Maps JS loader + Distance Matrix (used only when a Google key is provided).
let gmapsPromise = null;
function loadGoogleMaps(key) {
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  if (gmapsPromise) return gmapsPromise;
  gmapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key);
    s.async = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => reject(new Error("Google Maps failed to load (check key)"));
    document.head.appendChild(s);
  });
  return gmapsPromise;
}
async function googleOneWayMiles(from, to, key) {
  const g = await loadGoogleMaps(key);
  return new Promise((resolve, reject) => {
    new g.maps.DistanceMatrixService().getDistanceMatrix(
      { origins: [from], destinations: [to], travelMode: g.maps.TravelMode.DRIVING, unitSystem: g.maps.UnitSystem.IMPERIAL },
      (resp, status) => {
        if (status !== "OK") return reject(new Error("Google: " + status));
        const el = resp?.rows?.[0]?.elements?.[0];
        if (!el || el.status !== "OK") return reject(new Error("Google: " + (el?.status || "no result")));
        resolve(el.distance.value / M_PER_MILE);
      }
    );
  });
}

// Public: round-trip driving miles from home base to a destination.
// Returns { miles, source, oneWay }. Uses Google if a key is set, else free OSRM.
export async function roundTripMiles(destination, opts = {}) {
  const dest = (destination || "").trim();
  if (!dest) throw new Error("No location set");
  const home = opts.home || loadHome();
  const gkey = opts.gmapKey != null ? opts.gmapKey : loadGmapKey();

  let oneWay, source;
  if (gkey) {
    oneWay = await googleOneWayMiles(home, dest, gkey);
    source = "Google Maps";
  } else {
    const [a, b] = await Promise.all([geocode(home), geocode(dest)]);
    oneWay = await osrmMiles(a, b);
    source = "driving distance";
  }
  const miles = Math.round(oneWay * 2);
  return { miles, oneWay: Math.round(oneWay * 10) / 10, source };
}

// Fire calendar push: download .ics (carries day-before + morning-of reminders),
// fire sendPrompt if present (Claude env), and open the Google Calendar event.
export function pushToCalendar(b, { ics = true, google = true } = {}) {
  const link = calendarLink(b);
  try {
    if (typeof window !== "undefined" && typeof window.sendPrompt === "function") {
      window.sendPrompt(
        `Add this to my Google Calendar with reminders the day before and the morning of: ` +
        `"${b.shootType} — ${b.clientName}" on ${fmtDate(b.date)} ` +
        `from ${to12h(b.startTime)} to ${to12h(b.endTime)} at ${b.location}. ` +
        `Total ${money(b.totalPrice)}, balance due ${money(balanceOf(b))}.`
      );
    }
  } catch { /* ignore */ }
  // The .ics carries the two reminders — add it to the phone calendar.
  if (ics) downloadIcs(b);
  if (google) { try { window.open(link, "_blank"); } catch { /* ignore */ } }
  return link;
}
