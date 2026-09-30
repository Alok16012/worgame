"use client";

import { useState } from "react";
import { log, nid } from "../../lib/engine";
import { fmtDate, fmtTime, hhmm, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import { Btn, Card, Field, Table, Title, useAdmin } from "../ui";

export function SendNotice() {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [f, setF] = useState({ to: "all" as "all" | "one", user: 0, title: "", msg: "" });

  const send = () => {
    if (!f.title.trim() || !f.msg.trim()) return toast("Title and message are required", "bad");
    const u = s.users.find((x) => x.id === f.user);
    if (f.to === "one" && !u) return toast("Select a user", "bad");
    update((d) => {
      d.notices.push({ id: nid(d), title: f.title.trim(), msg: f.msg.trim(), target: f.to === "one" ? u!.name : "All Users", userId: f.to === "one" ? u!.id : null, date: ymd(), time: hhmm() });
      log(d, "Send Notice", `${f.title.trim()} → ${f.to === "one" ? u!.name : "All Users"}`);
    });
    setF({ ...f, title: "", msg: "" });
    toast("Notice sent", "ok");
  };

  return (
    <>
      <Title t="Send Notice" s="Notices appear on the app home screen and in the notifications list." />
      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="New notice">
          <div className="flex gap-2 mb-3">
            {(["all", "one"] as const).map((t) => (
              <button key={t} onClick={() => setF({ ...f, to: t })} className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${f.to === t ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200"}`}>{t === "all" ? "All Users" : "Selected User"}</button>
            ))}
          </div>
          {f.to === "one" && (
            <Field label="User" className="mb-3">
              <select className="admin-input" value={f.user} onChange={(e) => setF({ ...f, user: Number(e.target.value) })}>
                <option value={0}>-Select User-</option>
                {s.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.mobile}</option>)}
              </select>
            </Field>
          )}
          <Field label="Title"><input className="admin-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Message" className="mt-3"><textarea rows={4} className="admin-input" placeholder="Type your message here..." value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
          <Btn className="mt-4" onClick={send}>Send Notice</Btn>
        </Card>
        <Card title="Recent notices">
          <Table head={["Date", "Notice", "To"]} rows={s.notices.slice().reverse().map((n) => [
            `${fmtDate(n.date)} ${fmtTime(n.time)}`,
            <div key="n" className="whitespace-normal max-w-sm"><b className="text-slate-900">{n.title}</b><div className="text-xs text-slate-500">{n.msg}</div></div>, n.target,
          ])} />
        </Card>
      </div>
    </>
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
      log(d, "Push Notification", `${f.title.trim()} → ${f.to} (${sent})`);
    });
    setF({ ...f, title: "", msg: "" });
    toast(`Push sent to ${sent} devices`, "ok");
  };

  return (
    <>
      <Title t="Push Notification" s="Delivered to phones' notification tray (Firebase Cloud Messaging in production)." />
      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="New push">
          <Field label="Audience"><select className="admin-input" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}><option>All Users</option><option>Active Users</option><option>Inactive Users</option></select></Field>
          <Field label="Title" className="mt-3"><input className="admin-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Message" className="mt-3"><textarea rows={4} className="admin-input" value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
          <Btn className="mt-4" onClick={send}>Send Push</Btn>
        </Card>
        <Card title="History">
          <Table head={["Date", "Push", "Audience", "Delivered"]} rows={s.pushes.slice().reverse().map((p) => [
            `${fmtDate(p.date)} ${fmtTime(p.time)}`,
            <div key="n" className="whitespace-normal max-w-xs"><b className="text-slate-900">{p.title}</b><div className="text-xs text-slate-500">{p.msg}</div></div>, p.target, p.sent,
          ])} />
        </Card>
      </div>
    </>
  );
}
