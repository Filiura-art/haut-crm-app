"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X, Search, Download, LayoutGrid, List, Linkedin, ChevronDown, Trash2, Pencil } from "lucide-react";

const T = {
  bg: "#1B1A18", panel: "#232220", panelAlt: "#2A2926", line: "#3A3835",
  ivory: "#F3EFE6", ivoryDim: "#B8B3A8", ivoryFaint: "#79766D",
  brass: "#BB9457", brassSoft: "rgba(187,148,87,0.16)",
  sage: "#8A9A82", rose: "#B8706B",
};

const STAGES = [
  { id: "inquiry", label: "Price Inquiry" },
  { id: "concept", label: "Concept Presented" },
  { id: "won_first", label: "Won — First Sale" },
  { id: "won_repeat", label: "Won — Repeat Sale" },
  { id: "lost_inquiry", label: "Lost — After Inquiry" },
  { id: "lost_concept", label: "Lost — After Concept" },
];

const INDUSTRIES = ["Beauty & Fashion", "Luxury", "Consumer Electronics", "Automotive", "Hospitality", "Retail", "Real Estate", "Other"];
const CONTACT_TYPES = ["Brand", "Agency"];
const LEAD_SOURCES = ["Sahal", "Google Ads", "Cold Outreach — Email", "Cold Outreach — LinkedIn", "Referral", "Other"];
const CLIENT_HISTORY = ["Not Purchased Yet", "First Sale", "Repeat Client"];
const PRODUCT_INTEREST = ["Full CGI", "FOOH", "AI", "3D / Other"];
const OCCASIONS = ["Product Launch", "Event / Activation", "Holiday / Seasonal", "Other"];
const LINKEDIN_STATUS = ["Not Found", "Found — Not Connected", "Connection Sent", "Connected"];

const STAGE_COLOR = {
  inquiry: T.ivoryDim, concept: T.brass, won_first: T.sage, won_repeat: T.sage,
  lost_inquiry: T.rose, lost_concept: T.rose,
};

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyContact = () => ({
  id: uid(), name: "", email: "", phone: "", company: "",
  contactType: "Brand", industry: "Beauty & Fashion", leadSource: "Google Ads",
  stage: "inquiry", clientHistory: "Not Purchased Yet", productInterest: "Full CGI",
  occasion: "Product Launch", linkedinUrl: "", linkedinStatus: "Not Found", notes: "",
});

export default function App() {
  const [contacts, setContacts] = useState(null);
  const [view, setView] = useState("table");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ industry: "", contactType: "", leadSource: "", productInterest: "" });
  const [editing, setEditing] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [syncState, setSyncState] = useState("loading"); // loading | ready | error | saving
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setSyncState("loading");
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContacts(data.contacts);
      setSyncState("ready");
    } catch (e) {
      setErrorMsg(e.message);
      setSyncState("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c) => {
      if (query) {
        const q = query.toLowerCase();
        if (!`${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q)) return false;
      }
      if (filters.industry && c.industry !== filters.industry) return false;
      if (filters.contactType && c.contactType !== filters.contactType) return false;
      if (filters.leadSource && c.leadSource !== filters.leadSource) return false;
      if (filters.productInterest && c.productInterest !== filters.productInterest) return false;
      return true;
    });
  }, [contacts, query, filters]);

  const grouped = useMemo(() => {
    const g = {};
    STAGES.forEach((s) => (g[s.id] = []));
    filtered.forEach((c) => g[c.stage]?.push(c));
    return g;
  }, [filtered]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const saveContact = useCallback(async (c) => {
    setSyncState("saving");
    const exists = contacts.some((p) => p.id === c.id);
    try {
      const res = await fetch("/api/contacts", {
        method: exists ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContacts((prev) => exists ? prev.map((p) => (p.id === c.id ? c : p)) : [c, ...prev]);
      setSyncState("ready");
      setEditing(null);
    } catch (e) {
      setErrorMsg(e.message);
      setSyncState("error");
    }
  }, [contacts]);

  const deleteContact = useCallback(async (id) => {
    setSyncState("saving");
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContacts((prev) => prev.filter((p) => p.id !== id));
      setSyncState("ready");
    } catch (e) {
      setErrorMsg(e.message);
      setSyncState("error");
    }
  }, []);

  const moveStage = useCallback((id, stage) => {
    const c = contacts.find((p) => p.id === id);
    if (c) saveContact({ ...c, stage });
  }, [contacts, saveContact]);

  const exportCSV = useCallback(() => {
    const cols = ["name","email","phone","company","contactType","industry","leadSource","stage","clientHistory","productInterest","occasion","linkedinUrl","linkedinStatus"];
    const rows = [cols.join(",")].concat(filtered.map((c) => cols.map((k) => `"${String(c[k] ?? "").replace(/"/g,'""')}"`).join(",")));
    const csvContent = rows.join("\n");
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "haut-crm-export.csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open("data:text/csv;charset=utf-8," + encodeURIComponent(csvContent), "_blank");
    }
  }, [filtered]);

  if (syncState === "loading" && contacts === null) {
    return <div style={{ background: T.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.ivoryFaint, fontFamily: "Georgia, serif" }}>Loading ledger…</div>;
  }

  if (syncState === "error" && contacts === null) {
    return (
      <div style={{ background: T.bg, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.rose, fontFamily: "Georgia, serif", padding: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 12 }}>Couldn't connect to the sheet.</div>
        <div style={{ color: T.ivoryFaint, fontSize: 13, fontFamily: "Arial, sans-serif", marginBottom: 16 }}>{errorMsg}</div>
        <button className="htBtn" style={{ background: T.brass, color: T.bg }} onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ivory, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .htSelect, .htInput { background: ${T.panelAlt}; border: 1px solid ${T.line}; color: ${T.ivory}; border-radius: 6px; padding: 8px 10px; font-size: 13px; font-family: inherit; outline: none; width: 100%; }
        .htSelect:focus, .htInput:focus { border-color: ${T.brass}; }
        .htBtn { display: inline-flex; align-items: center; gap: 6px; border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer; border: 1px solid transparent; font-family: inherit; }
        .htBtn:hover { opacity: 0.85; }
        .htRow:hover { background: ${T.panelAlt}; }
        .kanbanCard:hover { border-color: ${T.brass}; }
        @media (max-width: 720px) { .hideMobile { display: none !important; } }
      `}</style>

      <header style={{ borderBottom: `1px solid ${T.line}`, padding: "22px 28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: T.brass, textTransform: "uppercase", marginBottom: 4 }}>Haut CGI</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, margin: 0 }}>Client Ledger</h1>
          </div>
          <div style={{ fontSize: 12, color: syncState === "error" ? T.rose : T.ivoryFaint }}>
            {syncState === "saving" ? "Saving to sheet…" : syncState === "error" ? `Sync error: ${errorMsg}` : "Synced with Google Sheet"} · {contacts?.length || 0} contacts
          </div>
        </div>
      </header>

      <div style={{ padding: "16px 28px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
          <Search size={14} color={T.ivoryFaint} style={{ position: "absolute", left: 10, top: 10 }} />
          <input className="htInput" style={{ paddingLeft: 30 }} placeholder="Search name, email, company…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className="htBtn" style={{ background: showFilters || activeFilterCount ? T.brassSoft : T.panelAlt, color: T.ivory, border: `1px solid ${T.line}` }} onClick={() => setShowFilters((v) => !v)}>
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""} <ChevronDown size={13} />
        </button>
        <div style={{ display: "flex", border: `1px solid ${T.line}`, borderRadius: 6, overflow: "hidden" }}>
          <button className="htBtn" style={{ background: view === "table" ? T.brassSoft : "transparent", color: T.ivory, borderRadius: 0 }} onClick={() => setView("table")}><List size={14} /> Table</button>
          <button className="htBtn" style={{ background: view === "kanban" ? T.brassSoft : "transparent", color: T.ivory, borderRadius: 0 }} onClick={() => setView("kanban")}><LayoutGrid size={14} /> Pipeline</button>
        </div>
        <div style={{ flex: 1 }} />
        <button className="htBtn" style={{ background: T.panelAlt, color: T.ivory, border: `1px solid ${T.line}` }} onClick={exportCSV}><Download size={14} /> <span className="hideMobile">Export CSV</span></button>
        <button className="htBtn" style={{ background: T.brass, color: T.bg, fontWeight: 600 }} onClick={() => setEditing(emptyContact())}><Plus size={14} /> Add contact</button>
      </div>

      {showFilters && (
        <div style={{ padding: "14px 28px", display: "flex", gap: 12, flexWrap: "wrap", background: T.panel, borderBottom: `1px solid ${T.line}` }}>
          <FilterSelect label="Industry" value={filters.industry} options={INDUSTRIES} onChange={(v) => setFilters((f) => ({ ...f, industry: v }))} />
          <FilterSelect label="Contact type" value={filters.contactType} options={CONTACT_TYPES} onChange={(v) => setFilters((f) => ({ ...f, contactType: v }))} />
          <FilterSelect label="Lead source" value={filters.leadSource} options={LEAD_SOURCES} onChange={(v) => setFilters((f) => ({ ...f, leadSource: v }))} />
          <FilterSelect label="Product interest" value={filters.productInterest} options={PRODUCT_INTEREST} onChange={(v) => setFilters((f) => ({ ...f, productInterest: v }))} />
          {activeFilterCount > 0 && <button className="htBtn" style={{ background: "transparent", color: T.rose, alignSelf: "flex-end" }} onClick={() => setFilters({ industry: "", contactType: "", leadSource: "", productInterest: "" })}>Clear all</button>}
        </div>
      )}

      <div style={{ padding: "20px 28px 60px" }}>
        {filtered.length === 0 ? (
          <EmptyState onAdd={() => setEditing(emptyContact())} />
        ) : view === "table" ? (
          <TableView contacts={filtered} onEdit={setEditing} onDelete={deleteContact} />
        ) : (
          <KanbanView grouped={grouped} onEdit={setEditing} onMove={moveStage} />
        )}
      </div>

      {editing && <ContactModal contact={editing} onClose={() => setEditing(null)} onSave={saveContact} onDelete={(id) => deleteContact(id).then(() => setEditing(null))} />}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ fontSize: 11, color: T.ivoryFaint, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <select className="htSelect" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function StageBadge({ stage }) {
  const s = STAGES.find((x) => x.id === stage);
  const color = STAGE_COLOR[stage];
  return <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, border: `1px solid ${color}55`, color, background: `${color}18`, whiteSpace: "nowrap" }}>{s?.label}</span>;
}

function TableView({ contacts, onEdit, onDelete }) {
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${T.line}`, borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: T.panel, textAlign: "left" }}>
            {["Name","Company","Type","Industry","Source","Stage","History","LinkedIn",""].map((h) => (
              <th key={h} style={{ padding: "10px 14px", color: T.ivoryFaint, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.line}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id} className="htRow" style={{ borderBottom: `1px solid ${T.line}`, cursor: "pointer" }} onClick={() => onEdit(c)}>
              <td style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 600 }}>{c.name || "—"}</div>
                <div style={{ color: T.ivoryFaint, fontSize: 12 }}>{c.email}</div>
                {c.phone && <div style={{ color: T.ivoryFaint, fontSize: 12 }}>{c.phone}</div>}
              </td>
              <td style={{ padding: "12px 14px" }}>{c.company}</td>
              <td style={{ padding: "12px 14px" }}>{c.contactType}</td>
              <td style={{ padding: "12px 14px" }}>{c.industry}</td>
              <td style={{ padding: "12px 14px" }}>{c.leadSource}</td>
              <td style={{ padding: "12px 14px" }}><StageBadge stage={c.stage} /></td>
              <td style={{ padding: "12px 14px", color: T.ivoryDim }}>{c.clientHistory}</td>
              <td style={{ padding: "12px 14px" }}>
                {c.linkedinStatus === "Connected" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: T.sage, fontSize: 12 }}><Linkedin size={13} /> Connected</span> : <span style={{ color: T.ivoryFaint, fontSize: 12 }}>{c.linkedinStatus}</span>}
              </td>
              <td style={{ padding: "12px 14px" }}>
                <button className="htBtn" style={{ background: "transparent", color: T.rose, padding: "4px 6px" }} onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({ grouped, onEdit, onMove }) {
  const [dragId, setDragId] = useState(null);
  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10 }}>
      {STAGES.map((stage) => (
        <div key={stage.id} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) onMove(dragId, stage.id); setDragId(null); }}
          style={{ minWidth: 240, flex: "0 0 240px", background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px 10px", borderBottom: `1px solid ${T.line}`, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: STAGE_COLOR[stage.id] }}>{stage.label}</span>
            <span style={{ fontSize: 11, color: T.ivoryFaint }}>{grouped[stage.id].length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 40 }}>
            {grouped[stage.id].map((c) => (
              <div key={c.id} className="kanbanCard" draggable onDragStart={() => setDragId(c.id)} onClick={() => onEdit(c)}
                style={{ background: T.panelAlt, border: `1px solid ${T.line}`, borderRadius: 6, padding: "10px 12px", cursor: "grab" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name || "Untitled"}</div>
                <div style={{ fontSize: 12, color: T.ivoryFaint, marginTop: 2 }}>{c.company}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <MiniTag text={c.industry} /><MiniTag text={c.contactType} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniTag({ text }) {
  return <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: T.brassSoft, color: T.brass }}>{text}</span>;
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: "center", padding: "70px 20px", border: `1px dashed ${T.line}`, borderRadius: 8 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: T.ivoryDim, marginBottom: 8 }}>No contacts match this view</div>
      <div style={{ fontSize: 13, color: T.ivoryFaint, marginBottom: 18 }}>Adjust your filters, or add the first contact.</div>
      <button className="htBtn" style={{ background: T.brass, color: T.bg, fontWeight: 600 }} onClick={onAdd}><Plus size={14} /> Add contact</button>
    </div>
  );
}

function Field({ label, children }) {
  return <div><div style={{ fontSize: 11, color: T.ivoryFaint, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>{children}</div>;
}

function ContactModal({ contact, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(contact);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isNew = !contact.name && !contact.email;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10, width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 20, margin: 0 }}>{isNew ? "New contact" : form.name || "Edit contact"}</h2>
          <button className="htBtn" style={{ background: "transparent", color: T.ivoryFaint, padding: 4 }} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Name"><input className="htInput" value={form.name} onChange={set("name")} /></Field>
          <Field label="Company"><input className="htInput" value={form.company} onChange={set("company")} /></Field>
          <Field label="Email"><input className="htInput" value={form.email} onChange={set("email")} /></Field>
          <Field label="Phone / WhatsApp"><input className="htInput" value={form.phone} onChange={set("phone")} placeholder="+971 50 123 4567" /></Field>
          <Field label="Contact type"><select className="htSelect" value={form.contactType} onChange={set("contactType")}>{CONTACT_TYPES.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Industry"><select className="htSelect" value={form.industry} onChange={set("industry")}>{INDUSTRIES.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Lead source"><select className="htSelect" value={form.leadSource} onChange={set("leadSource")}>{LEAD_SOURCES.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Pipeline stage"><select className="htSelect" value={form.stage} onChange={set("stage")}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
          <Field label="Client history"><select className="htSelect" value={form.clientHistory} onChange={set("clientHistory")}>{CLIENT_HISTORY.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Product interest"><select className="htSelect" value={form.productInterest} onChange={set("productInterest")}>{PRODUCT_INTEREST.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Occasion"><select className="htSelect" value={form.occasion} onChange={set("occasion")}>{OCCASIONS.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <div />
          <Field label="LinkedIn URL"><input className="htInput" value={form.linkedinUrl} onChange={set("linkedinUrl")} placeholder="linkedin.com/in/…" /></Field>
          <Field label="LinkedIn status"><select className="htSelect" value={form.linkedinStatus} onChange={set("linkedinStatus")}>{LINKEDIN_STATUS.map((o) => <option key={o}>{o}</option>)}</select></Field>
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
