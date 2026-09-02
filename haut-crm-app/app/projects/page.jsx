"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, X, Search, ChevronDown, Trash2, Pencil, ArrowLeft } from "lucide-react";

const T = {
  bg: "#1B1A18", panel: "#232220", panelAlt: "#2A2926", line: "#3A3835",
  ivory: "#F3EFE6", ivoryDim: "#B8B3A8", ivoryFaint: "#79766D",
  brass: "#BB9457", brassSoft: "rgba(187,148,87,0.16)",
  sage: "#8A9A82", sageSoft: "rgba(138,154,130,0.16)",
  rose: "#B8706B", roseSoft: "rgba(184,112,107,0.16)",
  amber: "#C9A227", amberSoft: "rgba(201,162,39,0.16)",
};

const STAGES = [
  { id: "tender", label: "Tender" },
  { id: "preproduction", label: "Pre-Production" },
  { id: "production", label: "Production" },
  { id: "postproduction", label: "Post-Production" },
  { id: "delivered", label: "Delivered" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const PROJECT_TYPES = ["Full CGI", "FOOH", "Mixed Reality", "AI", "3D / Other"];
const CURRENCIES = ["AED", "USD", "EUR"];
const BALL_SIDES = ["Our Side", "Client Side"];
const YESNO = { agreement: ["Not Signed", "Signed"], lpo: ["Not Received", "Received"], payment: ["Not Paid", "Paid"] };

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyProject = () => ({
  id: uid(), projectName: "", clientId: "", clientName: "", contactPerson: "",
  projectType: "Full CGI", saleType: "", projectPrice: "", currency: "AED", priceAED: "",
  deadline: "", stage: "tender",
  ballSide: "Our Side", nextAction: "", actionDate: "",
  agreementStatus: "Not Signed", agreementDate: "",
  lpoStatus: "Not Received", lpoDate: "",
  depositStatus: "Not Paid", depositDate: "", depositAmount: "",
  finalPaymentStatus: "Not Paid", finalPaymentDate: "", finalPaymentAmount: "",
  notes: "",
});

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / 86400000);
}

function deadlineColor(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return T.ivoryFaint;
  if (d < 0) return T.rose;
  if (d <= 3) return T.amber;
  return T.sage;
}

function outstandingAmount(p) {
  const total = parseFloat(p.priceAED || p.projectPrice) || 0;
  let paid = 0;
  if (p.depositStatus === "Paid") paid += parseFloat(p.depositAmount) || 0;
  if (p.finalPaymentStatus === "Paid") paid += parseFloat(p.finalPaymentAmount) || 0;
  return total - paid;
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div style={{ background: T.bg, height: "100vh" }} />}>
      <ProjectsPageInner />
    </Suspense>
  );
}

function ProjectsPageInner() {
  const [projects, setProjects] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [syncState, setSyncState] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setSyncState("loading");
    try {
      const [pRes, cRes] = await Promise.all([fetch("/api/projects"), fetch("/api/contacts")]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pData.error) throw new Error(pData.error);
      setProjects(pData.projects);
      setContacts(cData.contacts || []);
      setSyncState("ready");
    } catch (e) {
      setErrorMsg(e.message);
      setSyncState("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const clientId = searchParams.get("clientId");
    const clientName = searchParams.get("clientName");
    const contactPerson = searchParams.get("contactPerson");
    if (clientId) {
      setEditing({
        ...emptyProject(),
        clientId,
        clientName: clientName || "",
        contactPerson: contactPerson || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const saveProject = useCallback(async (p) => {
    setSyncState("saving");
    const exists = projects.some((x) => x.id === p.id);
    try {
      const res = await fetch("/api/projects", {
        method: exists ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProjects((prev) => exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]);
      setSyncState("ready");
      setEditing(null);
    } catch (e) {
      setErrorMsg(e.message);
      setSyncState("error");
    }
  }, [projects]);

  const deleteProjectRow = useCallback(async (id) => {
    setSyncState("saving");
    try {
      await fetch("/api/projects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setProjects((prev) => prev.filter((x) => x.id !== id));
      setSyncState("ready");
    } catch (e) {
      setErrorMsg(e.message);
      setSyncState("error");
    }
  }, []);

  const moveStage = useCallback((id, stage) => {
    const p = projects.find((x) => x.id === id);
    if (p) saveProject({ ...p, stage });
  }, [projects, saveProject]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return `${p.projectName} ${p.clientName} ${p.contactPerson}`.toLowerCase().includes(q);
    });
  }, [projects, query]);

  const grouped = useMemo(() => {
    const g = {}; STAGES.forEach((s) => (g[s.id] = []));
    filtered.forEach((p) => g[p.stage]?.push(p));
    return g;
  }, [filtered]);

  const outstandingSummary = useMemo(() => {
    const inProduction = ["preproduction", "production", "postproduction"];
    const buckets = { inProduction: 0, delivered: 0, completed: 0 };
    filtered.forEach((p) => {
      if (p.stage === "tender" || p.stage === "cancelled") return;
      const o = outstandingAmount(p);
      if (o <= 0) return;
      if (inProduction.includes(p.stage)) buckets.inProduction += o;
      else if (p.stage === "delivered") buckets.delivered += o;
      else if (p.stage === "completed") buckets.completed += o;
    });
    const total = buckets.inProduction + buckets.delivered + buckets.completed;
    return { ...buckets, total };
  }, [filtered]);

  if (syncState === "loading" && projects === null) {
    return <div style={{ background: T.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.ivoryFaint, fontFamily: "var(--font-syne), sans-serif" }}>Loading projects…</div>;
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ivory, fontFamily: "var(--font-syne), sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .htSelect, .htInput { background: ${T.panelAlt}; border: 1px solid ${T.line}; color: ${T.ivory}; border-radius: 6px; padding: 8px 10px; font-size: 13px; font-family: inherit; outline: none; width: 100%; }
        .htSelect:focus, .htInput:focus { border-color: ${T.brass}; }
        .htBtn { display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer; border: 1px solid transparent; font-family: inherit; }
        .htBtn:hover { opacity: 0.85; }
        .projCard:hover { border-color: ${T.brass}; }
      `}</style>

      <header style={{ borderBottom: `1px solid ${T.line}`, padding: "22px 28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.ivoryFaint, fontSize: 12, textDecoration: "none", marginBottom: 8 }}><ArrowLeft size={13} /> Contacts</Link>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: T.brass, textTransform: "uppercase", marginBottom: 4 }}>Haut CGI</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Projects</h1>
          </div>
          <div style={{ fontSize: 12, color: syncState === "error" ? T.rose : T.ivoryFaint }}>
            {syncState === "saving" ? "Saving…" : syncState === "error" ? `Error: ${errorMsg}` : "Synced"} · {projects?.length || 0} projects
          </div>
        </div>
      </header>

      <div style={{ padding: "16px 28px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
          <Search size={14} color={T.ivoryFaint} style={{ position: "absolute", left: 10, top: 10 }} />
          <input className="htInput" style={{ paddingLeft: 30 }} placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div style={{ flex: 1 }} />
        <button className="htBtn" style={{ background: T.brass, color: T.bg, fontWeight: 600 }} onClick={() => setEditing(emptyProject())}><Plus size={14} /> New project</button>
      </div>

      {outstandingSummary.total > 0 && (
        <div style={{ padding: "14px 28px", display: "flex", gap: 12, flexWrap: "wrap", borderBottom: `1px solid ${T.line}` }}>
          <SummaryCard label="Total Outstanding" value={outstandingSummary.total} highlight />
          {outstandingSummary.inProduction > 0 && <SummaryCard label="In Production" value={outstandingSummary.inProduction} />}
          {outstandingSummary.delivered > 0 && <SummaryCard label="Delivered" value={outstandingSummary.delivered} />}
          {outstandingSummary.completed > 0 && <SummaryCard label="Completed" value={outstandingSummary.completed} />}
        </div>
      )}

      <div style={{ padding: "20px 28px 60px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px", border: `1px dashed ${T.line}`, borderRadius: 8 }}>
            <div style={{ fontSize: 18, color: T.ivoryDim, marginBottom: 8 }}>No projects match this view</div>
            <button className="htBtn" style={{ background: T.brass, color: T.bg, fontWeight: 600 }} onClick={() => setEditing(emptyProject())}><Plus size={14} /> New project</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10 }}>
            {STAGES.map((stage) => (
              <div key={stage.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); if (id) moveStage(id, stage.id); }}
                style={{ minWidth: 280, flex: "0 0 280px", background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px 10px", borderBottom: `1px solid ${T.line}`, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.brass }}>{stage.label}</span>
                  <span style={{ fontSize: 11, color: T.ivoryFaint }}>{grouped[stage.id].length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 40 }}>
                  {grouped[stage.id].map((p) => {
                    const outstanding = outstandingAmount(p);
                    const dColor = deadlineColor(p.deadline);
                    return (
                      <div key={p.id} className="projCard" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)} onClick={() => setEditing(p)}
                        style={{ background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 6, padding: "10px 12px", cursor: "grab" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.projectName || "Untitled"}</div>
                        <div style={{ fontSize: 12, color: T.ivoryFaint, marginTop: 2 }}>{p.clientName}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: p.ballSide === "Our Side" ? T.sageSoft : T.roseSoft, color: p.ballSide === "Our Side" ? T.sage : T.rose }}>{p.ballSide}</span>
                          {p.deadline && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${dColor}22`, color: dColor }}>Due {p.deadline}</span>}
                          {outstanding > 0 && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: T.amberSoft, color: T.amber }}>AED {outstanding.toLocaleString()} due</span>}
                        </div>
                        {p.nextAction && <div style={{ fontSize: 11, color: T.ivoryDim, marginTop: 6, fontStyle: "italic" }}>→ {p.nextAction}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <ProjectModal project={editing} contacts={contacts} onClose={() => setEditing(null)} onSave={saveProject} onDelete={(id) => deleteProjectRow(id).then(() => setEditing(null))} />}
    </div>
  );
}

function SummaryCard({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? T.brassSoft : T.panelAlt,
      border: `1px solid ${highlight ? T.brass + "55" : T.line}`,
      borderRadius: 8, padding: "10px 16px", minWidth: 150,
    }}>
      <div style={{ fontSize: 10, color: highlight ? T.brass : T.ivoryFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: highlight ? T.brass : T.ivory }}>AED {value.toLocaleString()}</div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><div style={{ fontSize: 11, color: T.ivoryFaint, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>{children}</div>;
}

function SectionTitle({ children }) {
  return <div style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 700, color: T.brass, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 10, marginBottom: -4, borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>{children}</div>;
}

function ProjectModal({ project, contacts, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(project);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isNew = !project.projectName;

  const selectClient = (contactId) => {
    const c = contacts.find((x) => x.id === contactId);
    if (!c) return;
    setForm((f) => ({
      ...f, clientId: c.id, clientName: c.company || c.name, contactPerson: c.name,
      saleType: c.clientHistory || f.saleType,
    }));
  };

  const outstanding = outstandingAmount(form);

  const [calSaving, setCalSaving] = useState(false);
  const [calMsg, setCalMsg] = useState("");

  const addToCalendar = async () => {
    if (!form.actionDate || !form.nextAction.trim()) {
      setCalMsg("Fill in Action date and Next action first.");
      return;
    }
    setCalSaving(true);
    setCalMsg("");
    try {
      const dateTime = `${form.actionDate}T09:00`;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${form.projectName || "Project"} — ${form.nextAction.trim()}`,
          dateTime,
          leads: [{ name: form.projectName, email: form.contactPerson, phone: "", company: form.clientName }],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCalMsg("Added to Google Calendar ✓");
    } catch (e) {
      setCalMsg("Error: " + e.message);
    } finally {
      setCalSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10, width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>{isNew ? "New project" : form.projectName || "Edit project"}</h2>
          <button className="htBtn" style={{ background: "transparent", color: T.ivoryFaint, padding: 4 }} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Project name"><input className="htInput" value={form.projectName} onChange={set("projectName")} /></Field></div>

          <Field label="Client">
            <select className="htSelect" value={form.clientId} onChange={(e) => selectClient(e.target.value)}>
              <option value="">— Select existing lead —</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name || c.email} {c.company ? `(${c.company})` : ""}</option>)}
            </select>
          </Field>
          <Field label="Contact person"><input className="htInput" value={form.contactPerson} onChange={set("contactPerson")} /></Field>

          <Field label="Project type"><select className="htSelect" value={form.projectType} onChange={set("projectType")}>{PROJECT_TYPES.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Sale type (from lead)"><input className="htInput" value={form.saleType} onChange={set("saleType")} placeholder="e.g. First Sale, Repeat Client" /></Field>

          <Field label="Deadline"><input type="date" className="htInput" value={form.deadline} onChange={set("deadline")} /></Field>
          <Field label="Project stage"><select className="htSelect" value={form.stage} onChange={set("stage")}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
          <div />

          <SectionTitle>Ball / Next Action</SectionTitle>
          <Field label="Ball on"><select className="htSelect" value={form.ballSide} onChange={set("ballSide")}>{BALL_SIDES.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Action date"><input type="date" className="htInput" value={form.actionDate} onChange={set("actionDate")} /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Waiting for / next action"><input className="htInput" value={form.nextAction} onChange={set("nextAction")} placeholder="e.g. Waiting for concept approval" /></Field></div>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="htBtn" style={{ background: T.brassSoft, color: T.brass, border: `1px solid ${T.brass}55` }} onClick={addToCalendar} disabled={calSaving}>
              <Plus size={13} /> {calSaving ? "Adding…" : "Add to Google Calendar"}
            </button>
            {calMsg && <span style={{ fontSize: 12, color: calMsg.startsWith("Error") ? T.rose : T.sage }}>{calMsg}</span>}
          </div>

          <SectionTitle>Pricing</SectionTitle>
          <Field label="Project price"><input className="htInput" value={form.projectPrice} onChange={set("projectPrice")} placeholder="0" /></Field>
          <Field label="Currency"><select className="htSelect" value={form.currency} onChange={set("currency")}>{CURRENCIES.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Price in AED (final, for reporting)"><input className="htInput" value={form.priceAED} onChange={set("priceAED")} placeholder="Leave blank if currency is already AED" /></Field></div>

          <SectionTitle>Documents & Payment</SectionTitle>
          <Field label="Agreement"><select className="htSelect" value={form.agreementStatus} onChange={set("agreementStatus")}>{YESNO.agreement.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Agreement date"><input type="date" className="htInput" value={form.agreementDate} onChange={set("agreementDate")} /></Field>

          <Field label="LPO / PO"><select className="htSelect" value={form.lpoStatus} onChange={set("lpoStatus")}>{YESNO.lpo.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="LPO date"><input type="date" className="htInput" value={form.lpoDate} onChange={set("lpoDate")} /></Field>

          <Field label="Deposit / Advance"><select className="htSelect" value={form.depositStatus} onChange={set("depositStatus")}>{YESNO.payment.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Deposit date"><input type="date" className="htInput" value={form.depositDate} onChange={set("depositDate")} /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Deposit amount (AED)"><input className="htInput" value={form.depositAmount} onChange={set("depositAmount")} placeholder="0" /></Field></div>

          <Field label="Final payment"><select className="htSelect" value={form.finalPaymentStatus} onChange={set("finalPaymentStatus")}>{YESNO.payment.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Final payment date"><input type="date" className="htInput" value={form.finalPaymentDate} onChange={set("finalPaymentDate")} /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Final payment amount (AED)"><input className="htInput" value={form.finalPaymentAmount} onChange={set("finalPaymentAmount")} placeholder="0" /></Field></div>

          <div style={{ gridColumn: "1 / -1", background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 6, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: T.ivoryFaint }}>Outstanding</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: outstanding > 0 ? T.amber : T.sage }}>AED {outstanding.toLocaleString()}</span>
          </div>

          <div style={{ gridColumn: "1 / -1" }}><Field label="Notes"><textarea className="htInput" rows={3} style={{ resize: "vertical", fontFamily: "inherit" }} value={form.notes} onChange={set("notes")} /></Field></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
          {!isNew ? <button className="htBtn" style={{ background: "transparent", color: T.rose }} onClick={() => onDelete(form.id)}><Trash2 size={14} /> Delete</button> : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="htBtn" style={{ background: T.panelAlt, color: T.ivory, border: `1px solid ${T.line}` }} onClick={onClose}>Cancel</button>
            <button className="htBtn" style={{ background: T.brass, color: T.bg, fontWeight: 600 }} onClick={() => onSave(form)}><Pencil size={13} /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
