"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { liveBids, log, nid, setUserStatus } from "../../lib/engine";
import { fmtDate, fmtTime, inr, sum } from "../../lib/format";
import { useStore } from "../../lib/store";
import { MODULES, type User } from "../../lib/types";
import { Badge, Btn, Card, Field, Modal, Stat, Table, Title, useAdmin } from "../ui";

export function Roles() {
  const { state: s, update } = useStore();
  const { toast, confirm } = useAdmin();
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [admin, setAdmin] = useState({ name: "", username: "", role: s.roles[0]?.name ?? "" });

  const addRole = () => {
    if (!name.trim() || !perms.length) return toast("Enter a role name and pick permissions", "bad");
    if (s.roles.some((r) => r.name.toLowerCase() === name.trim().toLowerCase())) return toast("Role already exists", "bad");
    update((d) => { d.roles.push({ id: nid(d), name: name.trim(), perms }); log(d, "Add Role", name.trim()); });
    setName(""); setPerms([]); toast("Role saved", "ok");
  };
  const addAdmin = () => {
    if (!admin.name.trim() || !admin.username.trim()) return toast("Name and username are required", "bad");
    if (s.admins.some((a) => a.username === admin.username.trim())) return toast("Username taken", "bad");
    update((d) => { d.admins.push({ id: nid(d), name: admin.name.trim(), username: admin.username.trim(), role: admin.role, active: true }); log(d, "Add Admin", `${admin.username} (${admin.role})`); });
    setAdmin({ ...admin, name: "", username: "" }); toast("Admin created", "ok");
  };

  return (
    <>
      <Title t="Role Management" s="Control which admin modules each staff member can use." />
      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Add Role" desc="Pick the modules this role can open.">
          <Field label="Role Name"><input className="admin-input" placeholder="e.g. Result Operator" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="text-xs font-semibold text-slate-500 mt-4 mb-2">Permissions</div>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((m) => {
              const on = perms.includes(m);
              return <button key={m} onClick={() => setPerms(on ? perms.filter((p) => p !== m) : [...perms, m])} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${on ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200"}`}>{m}</button>;
            })}
          </div>
          <Btn className="mt-4" onClick={addRole}>Save Role</Btn>
        </Card>
        <Card title="Add Admin User" desc="Staff accounts that can sign in to this panel.">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full Name"><input className="admin-input" value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} /></Field>
            <Field label="Username"><input className="admin-input" value={admin.username} onChange={(e) => setAdmin({ ...admin, username: e.target.value })} /></Field>
          </div>
          <Field label="Role" className="mt-3">
            <select className="admin-input" value={admin.role} onChange={(e) => setAdmin({ ...admin, role: e.target.value })}>{s.roles.map((r) => <option key={r.id}>{r.name}</option>)}</select>
          </Field>
          <Btn className="mt-4" onClick={addAdmin}>Create Admin</Btn>
        </Card>
      </div>
      <Card className="mt-4" title="Roles">
        <Table max={false} head={["Role", "Permissions", "Admins", ""]} rows={s.roles.map((r) => [
          <b key="n" className="text-slate-900">{r.name}</b>,
          <div key="p" className="flex flex-wrap gap-1 whitespace-normal max-w-2xl">{r.perms.map((p) => <Badge key={p} tone="violet">{p}</Badge>)}</div>,
          s.admins.filter((a) => a.role === r.name).length,
          r.name === "Super Admin" ? <span key="l" className="text-xs text-slate-400">locked</span> : <Btn key="d" size="sm" variant="ghost" onClick={async () => {
            if (s.admins.some((a) => a.role === r.name)) return toast("Reassign admins using this role first", "bad");
            if (await confirm({ title: "Delete role", body: <>Delete role <b>{r.name}</b>?</>, ok: "Delete", tone: "red" })) update((d) => { d.roles = d.roles.filter((x) => x.id !== r.id); log(d, "Delete Role", r.name); });
          }}>Delete</Btn>,
        ])} />
      </Card>
      <Card className="mt-4" title="Admin Users">
        <Table max={false} head={["Name", "Username", "Role", "Status", ""]} rows={s.admins.map((a) => [
          a.name, a.username, <Badge key="r" tone="violet">{a.role}</Badge>, a.active ? <Badge key="s" tone="green">Active</Badge> : <Badge key="s" tone="red">Disabled</Badge>,
          a.username === "admin" ? "" : <Btn key="t" size="sm" variant="ghost" onClick={() => update((d) => { const x = d.admins.find((y) => y.id === a.id)!; x.active = !x.active; log(d, "Admin Status", `${x.username} → ${x.active ? "active" : "disabled"}`); })}>{a.active ? "Disable" : "Enable"}</Btn>,
        ])} />
      </Card>
    </>
  );
}

export function UsersPage({ go }: { go: (r: string) => void }) {
  const { state: s, attempt } = useStore();
  const { toast } = useAdmin();
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"" | "active" | "inactive">("");
  const [view, setView] = useState<number | null>(null);
  const list = s.users.filter((u) => (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.mobile.includes(q)) && (!st || u.status === st)).slice().reverse();

  const toggle = (u: User) => {
    const r = attempt((d) => setUserStatus(d, u.id, u.status === "active" ? "inactive" : "active"));
    if (r.ok) toast(`${u.name} ${u.status === "active" ? "blocked" : "unblocked"}`, "ok");
  };

  return (
    <>
      <Title t="User Management" s="All registered players. Blocked users cannot log in or bid." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Stat label="Total Users" value={s.users.length} />
        <Stat label="Active" value={s.users.filter((u) => u.status === "active").length} tone="green" />
        <Stat label="Inactive" value={s.users.filter((u) => u.status !== "active").length} tone="red" />
        <Stat label="KYC Verified" value={s.users.filter((u) => u.kyc).length} />
      </div>
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-56">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="admin-input !pl-9" placeholder="Search name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="admin-input !w-44" value={st} onChange={(e) => setSt(e.target.value as typeof st)}>
            <option value="">All Users</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </div>
        <Table head={["ID", "Name", "Mobile", "Wallet", "Status", "KYC", "Joined On", "Action"]} rows={list.map((u) => [
          `WG${u.id}`, <b key="n" className="text-slate-900">{u.name}</b>, u.mobile, inr(u.balance),
          u.status === "active" ? <Badge key="s" tone="green">Active</Badge> : <Badge key="s" tone="red">Inactive</Badge>,
          u.kyc ? <Badge key="k" tone="green">Verified</Badge> : <Badge key="k" tone="gray">Pending</Badge>, fmtDate(u.joined),
          <div key="a" className="flex gap-1.5">
            <Btn size="sm" onClick={() => setView(u.id)}>View</Btn>
            <Btn size="sm" variant="ghost" onClick={() => toggle(u)}>{u.status === "active" ? "Block" : "Unblock"}</Btn>
            <Btn size="sm" variant="green" onClick={() => go(`fund/${u.id}`)}>+ Fund</Btn>
          </div>,
        ])} />
      </Card>
      {view !== null && <UserDetail id={view} onClose={() => setView(null)} />}
    </>
  );
}

function UserDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { state: s } = useStore();
  const u = s.users.find((x) => x.id === id)!;
  const bids = s.bids.filter((b) => b.userId === id);
  const live = liveBids(s, (b) => b.userId === id);
  const tx = s.txns.filter((x) => x.userId === id).slice().reverse();
  return (
    <Modal wide title={`${u.name} · WG${u.id}`} onClose={onClose}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Wallet" value={inr(u.balance)} />
        <Stat label="Total Bids" value={bids.length} />
        <Stat label="Bid Amount" value={inr(sum(live, (b) => b.amount))} />
        <Stat label="Won" value={inr(sum(live, (b) => b.win ?? 0))} tone="green" />
      </div>
      <p className="text-sm text-slate-500 mt-3">📱 {u.mobile} · UPI {u.upi} · Joined {fmtDate(u.joined)} · {u.status} · KYC {u.kyc ? "verified" : "pending"}</p>
      <div className="font-semibold text-slate-900 mt-4 mb-2">Recent transactions</div>
      <Table head={["Date", "Type", "Amount", "Status", "Note"]} rows={tx.slice(0, 20).map((x) => [
        `${fmtDate(x.date)} ${fmtTime(x.time)}`, <span key="t" className="capitalize">{x.type}</span>,
        <b key="a" className={x.dir === "cr" ? "text-emerald-600" : "text-rose-600"}>{x.dir === "cr" ? "+" : "−"}{inr(x.amount)}</b>, x.status, x.note ?? x.mode ?? "",
      ])} />
    </Modal>
  );
}
