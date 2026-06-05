"use client";
import { useState, useEffect } from "react";

/* Shared access code for the beta. Change this to whatever you want to hand out. */
const ACCESS_CODE = "shufti2026";

/* ---------- data persistence (localStorage; survives refresh on this device) ---------- */
const KEY = "bot_state_v1";
const seedState = () => ({
  employees: [
    { name: "Salima Khan", role: "Head of HR", perm: "Manager", manager: "Bilal Ahmed", resp: "Protect revenue by keeping revenue-critical seats filled and catching disengagement before it becomes attrition." },
    { name: "Omar Farooq", role: "Senior Sales Rep", perm: "Employee", manager: "Salima Khan", resp: "Win new-logo and expansion revenue in regulated, high-risk verticals." },
    { name: "Bilal Ahmed", role: "CEO", perm: "Admin / CEO", manager: "", resp: "Set direction, allocate capital, hold the org accountable to outcomes." },
  ],
  expectations: {
    "Salima Khan": ["Keep time-to-fill for priority roles under 60 days.", "Flag remote attrition risk before resignation."],
    "Omar Farooq": ["Maintain 3x pipeline coverage.", "Cut security-review cycle time on crypto deals."],
    "Bilal Ahmed": ["Reduce top-10 account revenue concentration."],
  },
  teamObjectives: {},
  company: {
    objectives: ["Reduce revenue concentration: top-10 accounts under 50% of ARR.", "Sharpen ICP/UVP and lift win rate by segment."],
    challenges: ["Remote GTM accountability & visibility gaps.", "Revenue concentrated in few large accounts.", "Crowded competitive market."],
  },
  outcomes: [],
  checkins: [],
  photos: {},
  currentUser: "Salima Khan",
  signedIn: false,
});

const initials = (n) => (n || "?").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
const fmtDate = (ts) => { const d = new Date(ts); return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); };
const fmtRange = (f, t) => { const o = { month: "short", day: "numeric" }; if (!f) return "No date set"; const df = new Date(f + "T00:00"); if (!t || f === t) return df.toLocaleDateString(undefined, o); return df.toLocaleDateString(undefined, o) + " – " + new Date(t + "T00:00").toLocaleDateString(undefined, o); };

export default function Page() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("employee");
  const [toast, setToast] = useState("");

  // load once
  useEffect(() => {
    let s;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch {}
    if (!s) s = seedState();
    setState(s);
  }, []);

  // persist
  useEffect(() => { if (state) localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 1900); };
  const me = () => state?.employees.find((e) => e.name === state.currentUser);
  const up = (fn) => setState((prev) => { const n = structuredClone(prev); fn(n); return n; });
  const signOut = () => up((n) => { n.signedIn = false; });

  if (!state) return <div className="wrap"><p style={{ color: "var(--muted)" }}>Loading…</p></div>;

  /* ---------------- SIGN-IN GATE (email + access code) ---------------- */
  if (!state.signedIn) {
    return <SignIn state={state} up={up} flash={flash} />;
  }

  /* ===================== RENDER ===================== */
  const m = me();
  const perm = m?.perm || "Employee";
  const isManager = perm === "Manager";
  const isAdmin = perm === "Admin / CEO";

  // Tabs allowed for this role
  const allowedTabs = isAdmin
    ? [["employee", "My View"], ["team", "Team Objectives"], ["admin", "Setup"], ["dash", "CEO Dashboard"]]
    : isManager
    ? [["employee", "My View"], ["team", "Team Objectives"], ["teamdash", "My Team"]]
    : [["employee", "My View"]];

  // If current tab isn't allowed for this role, snap back to My View
  const activeTab = allowedTabs.some(([k]) => k === tab) ? tab : "employee";

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">
          <div className="logo">S</div>
          <div><h1>Business Outcomes Tracker</h1><p>Shufti · visibility & accountability</p></div>
        </div>
        <div className="whoami">
          <div style={{ textAlign: "right" }}><div className="nm">{m?.name}</div><div className="rl">{m?.role} · {m?.perm}</div></div>
          <div className="avatar">{state.photos[m?.name] ? <img src={state.photos[m.name]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(m?.name)}</div>
          <button className="btn ghost sm" style={{ marginLeft: 4 }} onClick={() => signOut()}>Sign out</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "9px 13px", background: "var(--panel)", border: "1px dashed var(--line)", borderRadius: 10 }}>
        <span style={{ fontSize: 11.5, color: "var(--amber)", fontWeight: 700, letterSpacing: ".05em" }}>BETA PREVIEW</span>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>View the app as:</span>
        <select
          value={perm}
          onChange={(e) => up((n) => { const emp = n.employees.find((x) => x.name === n.currentUser); if (emp) emp.perm = e.target.value; })}
          style={{ width: "auto", padding: "5px 10px", fontSize: 12.5 }}
        >
          <option>Employee</option><option>Manager</option><option>Admin / CEO</option>
        </select>
        <span style={{ fontSize: 11.5, color: "var(--muted)", fontStyle: "italic" }}>— changes which interface you see. In production this is fixed per person and enforced on the server.</span>
      </div>

      <div className="tabs">
        {allowedTabs.map(([k, label]) => (
          <button key={k} className={"tab" + (activeTab === k ? " active" : "")} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {activeTab === "employee" && <EmployeeView {...{ state, up, flash, me }} />}
      {activeTab === "team" && (isManager || isAdmin) && <TeamView {...{ state, up, flash }} />}
      {activeTab === "admin" && isAdmin && <AdminView {...{ state, up, flash }} />}
      {activeTab === "dash" && isAdmin && <DashView {...{ state, up, scope: "all", viewer: m?.name }} />}
      {activeTab === "teamdash" && isManager && <DashView {...{ state, up, scope: "team", viewer: m?.name }} />}


      <div className={"toast" + (toast ? " show" : "")}>{toast}</div>
    </div>
  );
}

/* ===================== SIGN IN (email + access code) ===================== */
function SignIn({ state, up, flash }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [picking, setPicking] = useState(false);
  const [err, setErr] = useState("");

  const submit = () => {
    if (!email.trim() || !email.includes("@")) { setErr("Enter a valid email."); return; }
    if (code.trim() !== ACCESS_CODE) { setErr("Incorrect access code."); return; }
    if (!consent) { setErr("Please accept the privacy notice to continue."); return; }
    setErr("");
    // match email to an existing employee by name-ish, else go to name picker
    setPicking(true);
  };

  const chooseName = (name) => {
    up((n) => { n.currentUser = name; n.signedIn = true; });
    flash("Signed in as " + name.split(" ")[0]);
  };

  const addAndSignIn = () => {
    const name = prompt("Enter your full name:");
    if (!name || !name.trim()) return;
    const nm = name.trim();
    up((n) => {
      if (!n.employees.find((e) => e.name === nm)) n.employees.push({ name: nm, role: "Team Member", perm: "Employee", manager: "", resp: "" });
      n.currentUser = nm; n.signedIn = true;
    });
    flash("Signed in as " + nm.split(" ")[0]);
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "radial-gradient(900px 500px at 50% -10%, rgba(62,168,255,.12), transparent 60%),var(--bg)" }}>
      <div style={{ width: 380, maxWidth: "92vw", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 18, padding: "38px 34px", boxShadow: "0 24px 70px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="logo" style={{ width: 54, height: 54, fontSize: 26, margin: "0 auto 18px" }}>S</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Business Outcomes Tracker</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 26 }}>Sign in to track outcomes and visibility at Shufti.</p>
        </div>

        {!picking ? (
          <>
            <div className="field"><label>Work email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@shufti.com" onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
            <div className="field"><label>Access code</label><input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Shared access code" onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
            <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12, color: "var(--muted)", margin: "4px 0 14px", cursor: "pointer", lineHeight: 1.45 }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: "auto", marginTop: 2, flexShrink: 0 }} />
              <span>I understand this tool records my check-in/out times, location at check-in, and work notes, visible to my manager and leadership.</span>
            </label>
            {err && <div className="hint" style={{ color: "var(--red)", marginBottom: 10 }}>{err}</div>}
            <button className="btn full" onClick={submit}>Continue</button>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 18, textAlign: "center" }}>Beta sign-in. Ask your admin for the access code.</p>
          </>
        ) : (
          <>
            <h3 className="section">Who are you?</h3>
            {state.employees.map((e) => (
              <div key={e.name} className="list-item" style={{ cursor: "pointer" }} onClick={() => chooseName(e.name)}>
                <div className="li-top"><div><div className="li-title">{e.name}</div><div className="li-meta">{e.role} · {e.perm}</div></div></div>
              </div>
            ))}
            <button className="btn ghost full" style={{ marginTop: 6 }} onClick={addAndSignIn}>+ I'm not listed — add me</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ===================== EMPLOYEE VIEW (record-first, no feedback shown) ===================== */
function EmployeeView({ state, up, flash, me }) {
  const m = me();
  const [transcript, setTranscript] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [audio, setAudio] = useState(null);
  const [recState, setRecState] = useState("idle");
  const [recMsg, setRecMsg] = useState("");
  const [recog, setRecog] = useState(null);
  const [mediaRec, setMediaRec] = useState(null);

  const exps = state.expectations[m.name] || [];
  const mine = state.outcomes.filter((o) => o.who === m.name).sort((a, b) => b.ts - a.ts);

  // check-in/out: find today's open check-in (checked in, not yet out) for this user
  const myCheckins = (state.checkins || []).filter((c) => c.who === m.name).sort((a, b) => b.inTs - a.inTs);
  const openCheckin = myCheckins.find((c) => !c.outTs);
  const [ciMsg, setCiMsg] = useState("");
  const [ciNote, setCiNote] = useState("");

  const getLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });

  const doCheckIn = async () => {
    setCiMsg("Getting location…");
    const loc = await getLocation();
    up((n) => {
      (n.checkins = n.checkins || []).push({
        id: "c" + Date.now(), who: n.currentUser,
        inTs: Date.now(), inLoc: loc, outTs: null, outLoc: null, note: "",
      });
    });
    setCiMsg(loc ? "Checked in ✓" : "Checked in ✓ (location not shared)");
    flash("Checked in");
  };

  const doCheckOut = async () => {
    if (!openCheckin) return;
    setCiMsg("Getting location…");
    const loc = await getLocation();
    up((n) => {
      const c = n.checkins.find((x) => x.id === openCheckin.id);
      if (c) { c.outTs = Date.now(); c.outLoc = loc; c.note = ciNote.trim(); }
    });
    setCiNote(""); setCiMsg("Checked out ✓"); flash("Checked out");
  };

  const addPhoto = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { up((n) => { n.photos[n.currentUser] = r.result; }); flash("Photo updated"); };
    r.readAsDataURL(f);
  };

  // Record: capture audio AND live-transcribe via browser Speech Recognition
  const toggleRec = async () => {
    if (recState === "recording") {
      try { mediaRec && mediaRec.state === "recording" && mediaRec.stop(); } catch {}
      try { recog && recog.stop(); } catch {}
      setRecState("idle");
      return;
    }
    // speech-to-text
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    let liveText = transcript ? transcript + " " : "";
    if (SR) {
      const r = new SR();
      r.continuous = true; r.interimResults = true; r.lang = "en-US";
      r.onresult = (e) => {
        let finalChunk = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
        }
        if (finalChunk) { liveText += finalChunk + " "; setTranscript(liveText.trim()); }
      };
      r.onerror = () => {};
      try { r.start(); setRecog(r); } catch {}
    } else {
      setRecMsg("Live transcription isn't supported in this browser — use Chrome for speech-to-text. You can still record audio.");
    }
    // audio capture (so the manager can also listen)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream); const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const fr = new FileReader();
        fr.onload = () => setAudio(fr.result);
        fr.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(); setMediaRec(mr);
      setRecState("recording");
      setRecMsg("");
    } catch {
      // no mic — still allow speech-to-text if it started
      if (SR) { setRecState("recording"); setRecMsg("No mic for audio, but transcription is running. Speak now."); }
      else setRecMsg("Microphone blocked — allow mic access in your browser to record.");
    }
  };

  const saveOutcome = () => {
    if (!transcript.trim()) { flash("Record your outcome first"); return; }
    up((n) => { n.outcomes.push({ id: "o" + Date.now(), who: n.currentUser, text: transcript.trim(), period: fmtRange(from, to), ts: Date.now(), audio, feedback: null }); });
    setTranscript(""); setFrom(""); setTo(""); setAudio(null); setRecMsg(""); flash("Outcome logged");
  };

  const delOutcome = (id) => up((n) => { n.outcomes = n.outcomes.filter((o) => o.id !== id); });

  return (
    <div className="grid side">
      <div>
        <div className="card" style={{ marginBottom: 18 }}>
          <h3 className="section">Signed in as</h3>
          <div style={{ textAlign: "center" }}>
            <div className="avatar" style={{ width: 84, height: 84, margin: "0 auto 10px", fontSize: 26 }}>
              {state.photos[m.name] ? <img src={state.photos[m.name]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(m.name)}
            </div>
            <label className="btn ghost sm" style={{ cursor: "pointer" }}>📷 Add / update photo
              <input type="file" accept="image/*" capture="user" style={{ display: "none" }} onChange={addPhoto} />
            </label>
          </div>
        </div>
        <div className="card">
          <h3 className="section">Your role</h3>
          <div className="display" style={{ fontSize: 18, marginBottom: 4 }}>{m.role}</div>
          <div className="hint">{m.resp}</div>
          <div className="divider" />
          <h3 className="section">Expected of you</h3>
          {exps.length ? exps.map((x, i) => <div key={i} className="list-item"><div className="li-title">{x}</div></div>) : <div className="empty">No expectations set yet.</div>}
          <div className="divider" />
          <h3 className="section">Company objectives</h3>
          {state.company.objectives.map((x, i) => <span key={i} className="chip">{x}</span>)}
          <div className="divider" />
          <h3 className="section">Company-wide challenges</h3>
          {state.company.challenges.map((x, i) => <span key={i} className="chip">{x}</span>)}
        </div>
      </div>

      <div>
        <div className="card" style={{ marginBottom: 18 }}>
          <h2>Check in / out</h2>
          <div className="sub">Records the time and your location. Location asks your browser&apos;s permission and is optional.</div>
          {!openCheckin ? (
            <button className="btn full" onClick={doCheckIn}>● Check in</button>
          ) : (
            <>
              <div className="list-item" style={{ marginBottom: 12 }}>
                <div className="li-title">Checked in at {new Date(openCheckin.inTs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>
                <div className="li-meta">{new Date(openCheckin.inTs).toLocaleDateString()} · {openCheckin.inLoc ? `Location: ${openCheckin.inLoc.lat}, ${openCheckin.inLoc.lng}` : "Location not shared"}</div>
              </div>
              <div className="field">
                <label>What did you work on? (added on check-out)</label>
                <textarea value={ciNote} onChange={(e) => setCiNote(e.target.value)} placeholder="Brief note on what you did this session…" />
              </div>
              <button className="btn full" onClick={doCheckOut}>■ Check out</button>
            </>
          )}
          {ciMsg && <div className="hint" style={{ marginTop: 8 }}>{ciMsg}</div>}
          {myCheckins.filter((c) => c.outTs).length > 0 && (
            <>
              <div className="divider" />
              <h3 className="section">Recent sessions</h3>
              {myCheckins.filter((c) => c.outTs).slice(0, 4).map((c) => (
                <div key={c.id} className="list-item" style={{ marginBottom: 8 }}>
                  <div className="li-title">{new Date(c.inTs).toLocaleDateString()} · {new Date(c.inTs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} → {new Date(c.outTs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>
                  {c.note && <div className="li-meta">{c.note}</div>}
                  <div className="li-meta">{c.inLoc ? `In: ${c.inLoc.lat}, ${c.inLoc.lng}` : "In: location not shared"}</div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <h2>Record an outcome</h2>
          <div className="sub">Hit record and say what you achieved — what actually moved, not activity. We&apos;ll transcribe it.</div>

          <div style={{ textAlign: "center", margin: "8px 0 14px" }}>
            <button
              className={"btn rec" + (recState === "recording" ? " recording" : "")}
              style={{ width: 96, height: 96, borderRadius: "50%", fontSize: 15 }}
              onClick={toggleRec}
            >
              {recState === "recording" ? "■ Stop" : "● Record"}
            </button>
            <div className="hint" style={{ marginTop: 8 }}>{recState === "recording" ? "Listening… speak now" : "Tap to start"}</div>
          </div>

          {recMsg && <div className="hint" style={{ color: "var(--amber)" }}>{recMsg}</div>}

          {(transcript || recState === "recording") && (
            <div className="field">
              <label>Transcript</label>
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Your spoken outcome appears here…" />
              <div className="hint">You can lightly edit the transcript before logging.</div>
            </div>
          )}
          {audio && <audio controls src={audio} />}

          <div className="row" style={{ marginTop: 8 }}>
            <div className="field"><label>Period — from</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="field"><label>to</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
          <div className="row"><button className="btn full" onClick={saveOutcome}>Log outcome</button></div>
        </div>

        <div className="card">
          <h2>Your logged outcomes <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>— newest first</span></h2>
          <div className="sub">What you&apos;ve recorded</div>
          {!mine.length ? <div className="empty">Nothing logged yet. Record your first outcome above.</div> :
            mine.map((o) => (
              <div key={o.id} className="outcome">
                <div className="o-head"><div className="o-date">{fmtDate(o.ts)}</div></div>
                <div className="o-body">{o.text}</div>
                <div className="o-period">{o.period}</div>
                {o.audio && <div className="audio-row"><audio controls src={o.audio} /></div>}
                <button className="del" style={{ float: "right", marginTop: -10 }} onClick={() => delOutcome(o.id)}>🗑</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Feedback({ fb, onRun }) {
  if (!fb) return <button className="btn ghost sm" onClick={onRun}>✨ Run AI feedback</button>;
  if (fb.loading) return <div className="feedback"><div className="fb-label"><span className="spinner" /> Analyzing…</div></div>;
  if (fb.error) return <div className="feedback" style={{ borderColor: "var(--red)" }}><div className="fb-label" style={{ color: "var(--red)" }}>Feedback failed</div><p>{fb.error}</p></div>;
  return (
    <div className="feedback">
      <div className="fb-label">✨ AI Feedback</div>
      <div className="score">Specificity &amp; impact: {fb.score}/10</div>
      <div className="lbl">Critique</div><p>{fb.critique}</p>
      <div className="lbl">Against role expectations</div><p>{fb.alignment}</p>
      <div className="lbl">Suggested next step</div><p>{fb.next_step}</p>
    </div>
  );
}


/* ===================== TEAM VIEW ===================== */
function TeamView({ state, up, flash }) {
  const [who, setWho] = useState("");
  const [txt, setTxt] = useState("");
  const others = state.employees.filter((e) => e.name !== state.currentUser);
  useEffect(() => { if (!who && others[0]) setWho(others[0].name); }, [who, others]);
  const assigned = [];
  Object.entries(state.teamObjectives).forEach(([w, arr]) => arr.forEach((o, i) => assigned.push({ who: w, o, i })));

  const add = () => {
    if (!who || !txt.trim()) { flash("Pick a person and write an objective"); return; }
    up((n) => {
      (n.teamObjectives[who] = n.teamObjectives[who] || []).push(txt.trim());
      (n.expectations[who] = n.expectations[who] || []).push("[From " + n.currentUser + "] " + txt.trim());
    });
    setTxt(""); flash("Objective assigned");
  };
  const del = (w, i) => up((n) => { n.teamObjectives[w].splice(i, 1); });

  return (
    <div className="card" style={{ maxWidth: 680 }}>
      <h2>Set objectives for your team members</h2>
      <div className="sub">Objectives you assign appear in that person&apos;s “Expected of you” list.</div>
      <div className="field"><label>Team member</label><select value={who} onChange={(e) => setWho(e.target.value)}>{others.map((e) => <option key={e.name}>{e.name}</option>)}</select></div>
      <div className="field"><label>Objective you want them to achieve</label><textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="e.g. Cut security-review cycle time on crypto deals from 21 to 12 days this quarter." /></div>
      <button className="btn" onClick={add}>Assign objective</button>
      <div className="divider" />
      <h3 className="section">Objectives you&apos;ve assigned</h3>
      {assigned.length ? assigned.map((a, idx) => (
        <div key={idx} className="list-item"><div className="li-top"><div><div className="li-title">{a.o}</div><div className="li-meta">→ {a.who}</div></div><button className="del" onClick={() => del(a.who, a.i)}>🗑</button></div></div>
      )) : <div className="empty">No objectives assigned yet.</div>}
    </div>
  );
}

/* ===================== ADMIN VIEW ===================== */
function AdminView({ state, up, flash }) {
  const [emp, setEmp] = useState({ name: "", role: "", perm: "Employee", manager: "", resp: "" });
  const [expWho, setExpWho] = useState("");
  const [expText, setExpText] = useState("");
  const [obj, setObj] = useState("");
  const [ch, setCh] = useState("");
  useEffect(() => { if (!expWho && state.employees[0]) setExpWho(state.employees[0].name); }, [expWho, state.employees]);

  const addEmp = () => {
    if (!emp.name.trim() || !emp.role.trim()) { flash("Name and role required"); return; }
    up((n) => { n.employees.push({ ...emp, name: emp.name.trim(), role: emp.role.trim() }); });
    setEmp({ name: "", role: "", perm: "Employee", manager: "", resp: "" }); flash("Person added");
  };
  const delEmp = (i) => up((n) => { const nm = n.employees[i].name; n.employees.splice(i, 1); delete n.expectations[nm]; });
  const setMgr = (i, mgr) => up((n) => { n.employees[i].manager = mgr; });
  const addExp = () => { if (!expWho || !expText.trim()) { flash("Pick a person and write an expectation"); return; } up((n) => { (n.expectations[expWho] = n.expectations[expWho] || []).push(expText.trim()); }); setExpText(""); flash("Expectation added"); };
  const addCompany = (kind, v, clear) => { if (!v.trim()) return; up((n) => { n.company[kind].push(v.trim()); }); clear(""); };
  const delCompany = (kind, i) => up((n) => { n.company[kind].splice(i, 1); });

  const managerOptions = state.employees.filter((e) => e.perm === "Manager" || e.perm === "Admin / CEO");

  return (
    <div className="grid two">
      <div className="card">
        <h2>People & roles</h2>
        <div className="sub">Add employees, assign a role, permission, and who they report to.</div>
        <div className="field"><label>Full name</label><input value={emp.name} onChange={(e) => setEmp({ ...emp, name: e.target.value })} placeholder="Salima Khan" /></div>
        <div className="row">
          <div className="field"><label>Role</label><input value={emp.role} onChange={(e) => setEmp({ ...emp, role: e.target.value })} placeholder="Head of HR" /></div>
          <div className="field"><label>Permission</label><select value={emp.perm} onChange={(e) => setEmp({ ...emp, perm: e.target.value })}><option>Employee</option><option>Manager</option><option>Admin / CEO</option></select></div>
        </div>
        <div className="field"><label>Reports to (manager)</label>
          <select value={emp.manager} onChange={(e) => setEmp({ ...emp, manager: e.target.value })}>
            <option value="">— none —</option>
            {managerOptions.map((mo) => <option key={mo.name}>{mo.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Role responsibilities (what this role is for)</label><textarea value={emp.resp} onChange={(e) => setEmp({ ...emp, resp: e.target.value })} placeholder="Protect revenue by keeping revenue-critical seats filled…" /></div>
        <button className="btn" onClick={addEmp}>Add person</button>
        <div className="divider" />
        <h3 className="section">Team</h3>
        {state.employees.length ? state.employees.map((e, i) => (
          <div key={i} className="list-item"><div className="li-top">
            <div style={{ flex: 1 }}>
              <div className="li-title">{e.name}</div>
              <div className="li-meta">{e.role} · {e.perm}</div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span className="li-meta">Reports to:</span>
                <select value={e.manager || ""} onChange={(ev) => setMgr(i, ev.target.value)} style={{ width: "auto", padding: "3px 8px", fontSize: 12 }}>
                  <option value="">— none —</option>
                  {managerOptions.filter((mo) => mo.name !== e.name).map((mo) => <option key={mo.name}>{mo.name}</option>)}
                </select>
              </div>
            </div>
            <button className="del" onClick={() => delEmp(i)}>🗑</button>
          </div></div>
        )) : <div className="empty">No people yet.</div>}
      </div>

      <div className="card">
        <h2>Expectations</h2>
        <div className="sub">Set expectations per person — these show in their “My View”.</div>
        <div className="field"><label>Person</label><select value={expWho} onChange={(e) => setExpWho(e.target.value)}>{state.employees.map((e) => <option key={e.name}>{e.name}</option>)}</select></div>
        <div className="field"><label>Expectation</label><input value={expText} onChange={(e) => setExpText(e.target.value)} placeholder="Keep time-to-fill for priority roles under 60 days." /></div>
        <button className="btn sm" onClick={addExp}>Add expectation</button>
        <div className="divider" />
        <h2>Company objectives</h2>
        <div className="field"><input value={obj} onChange={(e) => setObj(e.target.value)} placeholder="Top-10 accounts under 50% of ARR." /></div>
        <button className="btn sm" onClick={() => addCompany("objectives", obj, setObj)}>Add objective</button>
        <div style={{ marginTop: 12 }}>{state.company.objectives.map((o, i) => <span key={i} className="chip">{o}<button onClick={() => delCompany("objectives", i)}>×</button></span>)}</div>
        <div className="divider" />
        <h2>Company-wide challenges</h2>
        <div className="field"><input value={ch} onChange={(e) => setCh(e.target.value)} placeholder="Remote GTM accountability gaps." /></div>
        <button className="btn sm" onClick={() => addCompany("challenges", ch, setCh)}>Add challenge</button>
        <div style={{ marginTop: 12 }}>{state.company.challenges.map((o, i) => <span key={i} className="chip">{o}<button onClick={() => delCompany("challenges", i)}>×</button></span>)}</div>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD (CEO = all + AI feedback; Manager = own team) ===================== */
function DashView({ state, up, scope, viewer }) {
  const [open, setOpen] = useState(null);
  const isCEO = scope === "all";

  // scope the people: CEO sees everyone; manager sees direct reports (manager field == viewer)
  const people = isCEO
    ? state.employees
    : state.employees.filter((e) => e.manager === viewer);

  const statusFor = (name) => {
    const mine = state.outcomes.filter((o) => o.who === name).sort((a, b) => b.ts - a.ts);
    if (!mine.length) return "blocked";
    const days = (Date.now() - mine[0].ts) / 86400000;
    if (days > 14) return "risk";
    return "ontrack";
  };

  const runFeedback = async (id) => {
    up((n) => { n.outcomes.find((x) => x.id === id).feedback = { loading: true }; });
    const o = state.outcomes.find((x) => x.id === id);
    const emp = state.employees.find((e) => e.name === o.who);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: o.text, role: emp?.role, rolePurpose: emp?.resp,
          expectations: (state.expectations[o.who] || []).join("; "),
          companyObjectives: state.company.objectives.join("; "), period: o.period,
        }),
      });
      const fb = await res.json();
      up((n) => { n.outcomes.find((x) => x.id === id).feedback = res.ok ? fb : { error: fb.error || "Failed" }; });
    } catch {
      up((n) => { n.outcomes.find((x) => x.id === id).feedback = { error: "Network error" }; });
    }
  };

  let on = 0, risk = 0, blk = 0;
  const rows = people.map((e) => {
    const mine = state.outcomes.filter((o) => o.who === e.name).sort((a, b) => b.ts - a.ts);
    const sessions = (state.checkins || []).filter((c) => c.who === e.name).sort((a, b) => b.inTs - a.inTs);
    const st = statusFor(e.name);
    if (st === "ontrack") on++; else if (st === "risk") risk++; else blk++;
    return { e, mine, sessions, count: mine.length, last: mine[0] ? fmtDate(mine[0].ts) : "—", st };
  });
  const lbl = { ontrack: "On Track", risk: "At Risk", blocked: "Blocked" };

  return (
    <>
      <div className="banner"><span>📊</span><div>
        {isCEO
          ? <>CEO view — everyone. Click a person to see outcomes, check-in/out sessions, and run AI feedback (specificity score, critique, next step). </>
          : <>Manager view — your direct reports only. Click a person to see their outcomes and check-in/out sessions. </>}
        Status: <b>On Track</b> = recent outcome, <b>At Risk</b> = nothing in 14+ days, <b>Blocked</b> = none yet.
      </div></div>
      <div className="stat-cards">
        <div className="stat"><div className="n" style={{ color: "var(--green)" }}>{on}</div><div className="l">On Track</div></div>
        <div className="stat"><div className="n" style={{ color: "var(--amber)" }}>{risk}</div><div className="l">At Risk</div></div>
        <div className="stat"><div className="n" style={{ color: "var(--red)" }}>{blk}</div><div className="l">Blocked</div></div>
      </div>
      <div className="card">
        <h2>{isCEO ? "Per-person roll-up" : "My team"}</h2>
        <div className="sub">{rows.length ? "Click a row to expand." : "No team members assigned to you yet (set the manager field in Setup)."}</div>
        <table>
          <thead><tr><th>Person</th><th>Role</th><th>Outcomes</th><th>Last logged</th><th>Status</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <Row key={i} r={r} lbl={lbl} open={open === r.e.name} onToggle={() => setOpen(open === r.e.name ? null : r.e.name)} runFeedback={runFeedback} showFeedback={isCEO} />
          ))}</tbody>
        </table>
      </div>
    </>
  );
}

function Row({ r, lbl, open, onToggle, runFeedback, showFeedback }) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: "pointer" }}>
        <td>{open ? "▾ " : "▸ "}{r.e.name}</td>
        <td style={{ color: "var(--muted)" }}>{r.e.role}</td>
        <td><span className="num">{r.count}</span></td>
        <td style={{ color: "var(--muted)" }}>{r.last}</td>
        <td><span className={"status " + r.st}>{lbl[r.st]}</span></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} style={{ background: "var(--panel-2)" }}>
            <div style={{ padding: "4px 2px" }}>
              <h3 className="section">Outcomes</h3>
              {!r.mine.length ? <div className="empty" style={{ margin: 8 }}>No outcomes recorded.</div> :
                r.mine.map((o) => (
                  <div key={o.id} className="outcome" style={{ margin: "8px 0" }}>
                    <div className="o-head"><div className="o-date">{fmtDate(o.ts)} · {o.period}</div></div>
                    <div className="o-body">{o.text}</div>
                    {o.audio && <div className="audio-row"><audio controls src={o.audio} /></div>}
                    {showFeedback && <Feedback fb={o.feedback} onRun={() => runFeedback(o.id)} />}
                  </div>
                ))}
              <h3 className="section" style={{ marginTop: 14 }}>Check-in / out sessions</h3>
              {!r.sessions.length ? <div className="empty" style={{ margin: 8 }}>No sessions.</div> :
                r.sessions.slice(0, 8).map((c) => (
                  <div key={c.id} className="list-item" style={{ margin: "6px 0" }}>
                    <div className="li-title">
                      {new Date(c.inTs).toLocaleDateString()} · {new Date(c.inTs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      {c.outTs ? ` → ${new Date(c.outTs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : " · (still checked in)"}
                    </div>
                    {c.note && <div className="li-meta">{c.note}</div>}
                    <div className="li-meta">{c.inLoc ? `In: ${c.inLoc.lat}, ${c.inLoc.lng}` : "In: location not shared"}{c.outLoc ? ` · Out: ${c.outLoc.lat}, ${c.outLoc.lng}` : ""}</div>
                  </div>
                ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
