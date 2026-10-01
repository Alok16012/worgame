"use client";

import { useState } from "react";
import { log, nid } from "../../lib/engine";
import { fmtDate, fmtTime, hhmm, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import { Btn, Card, DataTable, Field, Tabs, useAdmin } from "../ui";

export function SendNotice() {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [to, setTo] = useState<"all" | "one">("all");
  const [f, setF] = useState({ user: 0, title: "", msg: "" });

  const send = () => {
    if (!f.title.trim() || !f.msg.trim()) return toast("Title and message are required", "bad");
    const u = s.users.find((x) => x.id === f.user);
    if (to === "one" && !u) return toast("Select a user", "bad");
    update((d) => {
      d.notices.push({ id: nid(d), title: f.title.trim(), msg: f.msg.trim(), target: u && to === "one" ? u.name : "All Users", userId: to === "one" ? u!.id : null, date: ymd(), time: hhmm() });
      log(d, "Send Notice", f.title.trim());
    });
    setF({ ...f, title: "", msg: "" });
    toast("Notice sent", "ok");
  };

  return (
    <div className="grid xl:grid-cols-2 gap-5">
      <Card title="Send Notice">
        <Tabs value={to} onChange={setTo} items={[{ id: "all", label: "All Users" }, { id: "one", label: "Selected User" }]} />
        {to === "one" && (
          <Field label="User" className="mb-3">
            <select className="admin-input" value={f.user} onChange={(e) => setF({ ...f, user: Number(e.target.value) })}>
              <option value={0}>-Select User-</option>{s.users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.mobile})</option>)}
            </select>
          </Field>
        )}
        <Field label="Title"><input className="admin-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Message" className="mt-3"><textarea rows={4} className="admin-input" placeholder="Type your message here..." value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
        <Btn className="mt-4" onClick={send}>Send Notice</Btn>
      </Card>
      <Card title="Recent Notices">
        <DataTable head={["Date", "Notice", "To"]} rows={s.notices.slice().reverse().map((n) => [`${fmtDate(n.date)} ${fmtTime(n.time)}`,
          <div key="n" className="whitespace-normal max-w-sm"><b>{n.title}</b><div className="text-xs text-slate-500">{n.msg}</div></div>, n.target])} />
      </Card>
    </div>
  );
}

export function PushNotification() {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [f, setF] = useState({ to: "All Users", title: "", msg: "" });

  const send = () => {
    if (!f.title.trim() || !f.msg.trim()) return toast("Title and message are required", "bad");
    const sent = f.to === "All Users" ? s.users.length : s.users.filter((u) => u.status === (f.to === "Active Users" ? "active" : "inactive")).length;
    update((d) => {
      d.pushes.push({ id: nid(d), title: f.title.trim(), msg: f.msg.trim(), target: f.to, sent, date: ymd(), time: hhmm() });
      d.notices.push({ id: nid(d), title: f.title.trim(), msg: f.msg.trim(), target: f.to, date: ymd(), time: hhmm() });
      log(d, "Push Notification", f.title.trim());
    });
    setF({ ...f, title: "", msg: "" });
    toast(`Push sent to ${sent} users`, "ok");
  };

  return (
    <div className="grid xl:grid-cols-2 gap-5">
      <Card title="Push Notification">
        <Field label="Send To"><select className="admin-input" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}><option>All Users</option><option>Active Users</option><option>Inactive Users</option></select></Field>
        <Field label="Title" className="mt-3"><input className="admin-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Message" className="mt-3"><textarea rows={4} className="admin-input" value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
        <Btn className="mt-4" onClick={send}>Send</Btn>
      </Card>
      <Card title="History">
        <DataTable head={["Date", "Notification", "To", "Sent"]} rows={s.pushes.slice().reverse().map((p) => [`${fmtDate(p.date)} ${fmtTime(p.time)}`,
          <div key="n" className="whitespace-normal max-w-xs"><b>{p.title}</b><div className="text-xs text-slate-500">{p.msg}</div></div>, p.target, p.sent])} />
      </Card>
    </div>
  );
}
