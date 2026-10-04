"use client";

import { useState } from "react";
import { Ban, Eye, EyeOff, MessageCircle, Pencil, Phone, Plus } from "lucide-react";
import { findGame, isCredited, log, manualFund, nid, registerUser, revertBids, updateUser } from "../../lib/engine";
import { fmtDate, fmtTime, inr, sum } from "../../lib/format";
import { useStore } from "../../lib/store";
import { MODULES, type Bid, type User } from "../../lib/types";
import { bidTypeLabel, fmtStamp, sessionLabel } from "../common";
import { Badge, BidBadge, Btn, Card, DataTable, Field, Modal, Tabs, YesNo, useAdmin } from "../ui";
import { EditBidModal } from "../EditBid";

const wa = (m: string) => `https://wa.me/91${m}`;

export function UsersPage({ go }: { go: (r: string) => void }) {
  const { state: s, attempt, update } = useStore();
  const { toast } = useAdmin();
  const [noBet, setNoBet] = useState(false);
  const [create, setCreate] = useState<null | { name: string; mobile: string; password: string }>(null);
  const list = s.users.filter((u) => !noBet || !u.betting).slice().reverse();

  const save = () => {
    if (!create) return;
    const r = attempt((d) => {
      const id = registerUser(d, create.name, create.mobile, create.password);
      const u = d.users.find((x) => x.id === id)!;
      u.loggedIn = false;
      u.lastLogin = null;
      log(d, "Create User", `${u.name} ${u.mobile}`);
      return id;
    });
    if (!r.ok) return toast(r.error, "bad");
    toast("User created", "ok");
    setCreate(null);
  };

  return (
    <Card title={noBet ? "Users Cannot Bet" : "Users"} right={
      <div className="flex gap-2">
        <Btn variant={noBet ? "ghost" : "red"} onClick={() => setNoBet(!noBet)}><Ban size={15} /> {noBet ? "All Users" : "Users Cannot Bet"}</Btn>
        <Btn variant="dark" onClick={() => setCreate({ name: "", mobile: "", password: "" })}><Plus size={15} /> Create</Btn>
      </div>
    }>
      <DataTable key={String(noBet)}
        head={["Sr No", "Name", "Mobile", "Status", "Betting", "Wallet Balance", "Created At", "Action"]}
        rows={list.map((u, i) => [
          i + 1,
          <button key="n" className="text-left hover:text-[#0d6efd] whitespace-normal max-w-44" onClick={() => go(`users/${u.id}`)}>{u.name}</button>,
          <a key="m" href={wa(u.mobile)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1"><MessageCircle size={13} className="text-emerald-500" />{u.mobile}</a>,
          <span key="s" className={u.status === "active" ? "text-emerald-600" : "text-rose-600"}>{u.status === "active" ? "Active" : "Inactive"}</span>,
          <YesNo key="b" on={u.betting} onChange={() => update((d) => updateUser(d, u.id, { betting: !u.betting }, `Betting ${u.betting ? "off" : "on"}`))} />,
          u.balance.toFixed(2),
          fmtStamp(u.joined),
          <button key="e" onClick={() => go(`users/${u.id}`)} className="p-1.5 text-slate-600 hover:text-[#0d6efd]" aria-label="Edit"><Pencil size={15} /></button>,
        ])}
        text={list.map((u) => `${u.name} ${u.mobile}`)} />
      {create && (
        <Modal title="Create User" onClose={() => setCreate(null)} footer={<><Btn variant="ghost" onClick={() => setCreate(null)}>Close</Btn><Btn onClick={save}>Submit</Btn></>}>
          <div className="space-y-3">
            <Field label="Full Name"><input className="admin-input" value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} /></Field>
            <Field label="Mobile"><input className="admin-input" inputMode="numeric" maxLength={10} value={create.mobile} onChange={(e) => setCreate({ ...create, mobile: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Password"><input className="admin-input" value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export function UserDetail({ id, go }: { id: number; go: (r: string) => void }) {
  const { state: s, attempt, update } = useStore();
  const { toast, confirm } = useAdmin();
  const [fund, setFund] = useState<null | { dir: "cr" | "dr"; amount: string }>(null);
  const [edit, setEdit] = useState<User | null>(null);
  const [tab, setTab] = useState<"all" | "cr" | "dr">("all");
  const [editing, setEditing] = useState<Bid | null>(null);
  const [showPw, setShowPw] = useState(true); // admin reads it out when a user forgets their password
  const u = s.users.find((x) => x.id === id);
  if (!u) return <Card><p>User not found. <button className="text-[#0d6efd]" onClick={() => go("users")}>Back to users</button></p></Card>;

  const tx = s.txns.filter((x) => x.userId === id);
  const deposits = tx.filter((x) => x.type === "deposit").reverse();
  const approvedDeposits = deposits.filter(isCredited);
  const withdraws = tx.filter((x) => x.type === "withdraw").reverse();
  const bids = s.bids.filter((b) => b.userId === id).reverse();
  const wallet = tx.filter((x) => tab === "all" || x.dir === tab).reverse();
  const live = bids.filter((b) => b.status !== "reverted");
  const set = (patch: Partial<User>, action: string) => update((d) => updateUser(d, id, patch, action));

  const submitFund = () => {
    if (!fund) return;
    const r = attempt((d) => manualFund(d, id, fund.dir, Number(fund.amount)));
    if (!r.ok) return toast(r.error, "bad");
    toast(fund.dir === "cr" ? "Amount added" : "Amount withdrawn", "ok");
    setFund(null);
  };

  const deleteBid = async (bidId: number) => {
    const b = s.bids.find((x) => x.id === bidId)!;
    if (!(await confirm({ title: "Delete Bid", body: <>Delete this {bidTypeLabel(b)} bid of {inr(b.amount)}? The amount is refunded to the wallet.</>, ok: "Delete", tone: "red" }))) return;
    const r = attempt((d) => revertBids(d, b.gameId, b.date, b.id));
    if (r.ok) toast("Bid deleted and refunded", "ok"); else toast(r.error, "bad");
  };

  const info = (k: string, v: React.ReactNode) => <div className="flex gap-2 text-[13px] py-1"><span className="text-slate-500 w-32 shrink-0">{k}:</span><span className="text-slate-800 break-all">{v || "—"}</span></div>;

  return (
    <>
      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        <Card className="!bg-[#dcd9f5]">
          <div className="text-center">
            <div className="text-sm text-slate-600">{u.name}</div>
            <a href={`tel:${u.mobile}`} className="inline-flex items-center gap-1 font-semibold text-slate-800">{u.mobile} <Phone size={14} /></a>
            <a href={wa(u.mobile)} target="_blank" rel="noreferrer" className="block w-fit mx-auto mt-1"><MessageCircle className="text-emerald-500" size={22} /></a>
          </div>
          <div className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between items-center">Active: <YesNo on={u.status === "active"} onChange={() => set({ status: u.status === "active" ? "inactive" : "active", loggedIn: false }, "User Status")} /></div>
            <div className="flex justify-between items-center">Betting: <YesNo on={u.betting} onChange={() => set({ betting: !u.betting }, "User Betting")} /></div>
            <div className="flex justify-between items-center">Logout Status: {u.loggedIn ? <Btn size="sm" variant="green" onClick={() => set({ loggedIn: false }, "Force Logout")}>Logout Now</Btn> : <Badge tone="gray">Logged out</Badge>}</div>
            <div className="text-center pt-1">Security Password
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-800 tracking-wider">{showPw ? u.password : u.password.replace(/./g, "•")}</span>
                <button onClick={() => setShowPw(!showPw)} className="text-slate-500 hover:text-slate-800" aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 text-center mt-4 bg-white/60 rounded-lg py-3">
            <div><div className="font-semibold">{u.balance.toFixed(0)}</div><div className="text-[11px] text-slate-500">Available Balance</div></div>
            <div><div className="font-semibold">{sum(withdraws.filter((w) => w.status === "pending"), (w) => w.amount)}</div><div className="text-[11px] text-slate-500">Withdraw</div></div>
          </div>
          <div className="flex justify-between mt-4">
            <Btn variant="green" onClick={() => setFund({ dir: "cr", amount: "" })}>Add Money</Btn>
            <Btn variant="red" onClick={() => setFund({ dir: "dr", amount: "" })}>Withdraw</Btn>
          </div>
        </Card>

        <Card title="Personal Information" right={<Btn size="sm" variant="ghost" onClick={() => setEdit({ ...u })}><Pencil size={13} /> Edit</Btn>}>
          <div className="grid md:grid-cols-2 gap-x-6">
            <div>{info("Full Name", u.name)}{info("Mobile", u.mobile)}{info("Creation Date", fmtStamp(u.joined))}</div>
            <div>{info("Email", u.email)}{info("Password", u.password)}{info("Last Login", u.lastLogin ? fmtStamp(u.lastLogin) : "N/A")}</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#28a745]">Total Deposit: {sum(approvedDeposits, (x) => x.amount)}</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#dc3545]">Total Withdraw: {sum(withdraws.filter((w) => w.status === "approved"), (x) => x.amount)}</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#0d6efd]">Total Bid: {sum(live, (b) => b.amount)}</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#fd7e14]">Total Winning: {sum(live, (b) => b.win ?? 0)}</span>
          </div>
        </Card>
      </div>

      <Card className="mt-5" title="Payment Information">
        <div className="grid md:grid-cols-3 gap-x-6">
          <div>{info("Bank Name", u.bank.bank)}{info("A/c Holder Name", u.bank.holder)}{info("PhonePe No", u.phonepe)}</div>
          <div>{info("Branch Address", u.bank.address)}{info("A/c Number", u.bank.account)}{info("Google Pay No", u.gpay)}</div>
          <div>{info("IFSC Code", u.bank.ifsc)}{info("Paytm No", u.paytm)}{info("UPI ID", u.upi)}</div>
        </div>
      </Card>

      <Card className="mt-5" title="Add Fund Request">
        <DataTable head={["Sr No", "Request Amount", "Transaction", "UPI App", "Date", "Time", "Action"]}
          rows={deposits.map((x, i) => [i + 1, x.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), <span key="c" className="text-emerald-600">Credit</span>, x.mode, fmtDate(x.date), fmtTime(x.time), x.status === "pending" ? <Btn key="a" size="sm" variant="amber" onClick={() => go("fund")}>Pending</Btn> : x.status === "success" ? <Btn key="a" size="sm" variant="amber" onClick={() => go("autodeposit")}>To Check</Btn> : <Badge key="a" tone={x.status === "rejected" ? "red" : "green"}>{x.status === "rejected" ? "Rejected" : "Approved"}</Badge>])}
          text={deposits.map((x) => `${x.amount} ${x.date}`)} />
      </Card>

      <Card className="mt-5" title="Withdraw Request">
        <DataTable head={["Sr No", "Request Amount", "Pay To", "Date", "Time", "Action"]}
          rows={withdraws.map((x, i) => [i + 1, x.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), x.payTo, fmtDate(x.date), fmtTime(x.time),
            x.status === "pending" ? <Btn key="p" size="sm" variant="amber" onClick={() => go("withdraw")}>Pending</Btn> : <Badge key="s" tone={x.status === "approved" ? "green" : "red"}>{x.status === "approved" ? "Approved" : "Rejected · Refunded"}</Badge>])}
          text={withdraws.map((x) => `${x.amount} ${x.date}`)} />
      </Card>

      <Card className="mt-5" title="Bid History">
        <DataTable head={["Sr No", "Game Name", "Bid Date", "Bid Time", "Game Type", "Session", "Value", "Amount", "Status", "Action"]}
          rows={bids.map((b, i) => [i + 1, findGame(s, b.gameId)?.name, fmtDate(b.date), fmtTime(b.time), bidTypeLabel(b), sessionLabel(b), b.value, b.amount.toFixed(2),
            <BidBadge key="s" s={b.status} />, b.status === "pending" ? <div key="d" className="flex gap-1.5"><Btn size="sm" variant="ghost" onClick={() => setEditing(b)}><Pencil size={12} /> Edit</Btn><Btn size="sm" variant="ghost" className="!text-rose-600 !border-rose-300" onClick={() => deleteBid(b.id)}>Delete</Btn></div> : b.win ? <span key="w" className="text-emerald-600 font-semibold">+{b.win}</span> : ""])}
          text={bids.map((b) => `${findGame(s, b.gameId)?.name} ${b.value} ${b.type}`)} />
      </Card>

      <Card className="mt-5" title="Wallet Transaction">
        <Tabs value={tab} onChange={setTab} items={[{ id: "all", label: "All" }, { id: "cr", label: "Credit" }, { id: "dr", label: "Debit" }]} />
        <DataTable key={tab} head={["Sr No", "Amount", "Remark", "Type", "Date", "Time"]}
          rows={wallet.map((x, i) => [i + 1, x.amount, <span key="r" className="whitespace-normal">{x.remark}</span>, x.dir === "cr" ? "In" : "Out", fmtDate(x.date), fmtTime(x.time)])}
          text={wallet.map((x) => x.remark)} />
      </Card>

      {editing && <EditBidModal bid={editing} onClose={() => setEditing(null)} />}
      {fund && (
        <Modal title="Fund Manage" onClose={() => setFund(null)} footer={<><Btn variant="ghost" onClick={() => setFund(null)}>Close</Btn><Btn onClick={submitFund}>Submit</Btn></>}>
          <div className="text-sm text-slate-600 mb-3">{fund.dir === "cr" ? "Add money to" : "Withdraw money from"} <b>{u.name}</b> (balance {inr(u.balance)})</div>
          <Field label="Amount"><input autoFocus className="admin-input" inputMode="numeric" placeholder="Enter Amount" value={fund.amount} onChange={(e) => setFund({ ...fund, amount: e.target.value.replace(/\D/g, "") })} /></Field>
        </Modal>
      )}
      {edit && (
        <Modal wide title="Edit User" onClose={() => setEdit(null)} footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Close</Btn><Btn onClick={() => {
          if (!edit.name.trim() || !/^\d{10}$/.test(edit.mobile)) return toast("Name and a 10-digit mobile are required", "bad");
          if (s.users.some((x) => x.mobile === edit.mobile && x.id !== id)) return toast("Mobile already used by another user", "bad");
          set({ name: edit.name.trim(), mobile: edit.mobile, email: edit.email, password: edit.password, bank: edit.bank, paytm: edit.paytm, phonepe: edit.phonepe, gpay: edit.gpay, upi: edit.upi }, "Edit User");
          setEdit(null); toast("User updated", "ok");
        }}>Update</Btn></>}>
          <div className="grid md:grid-cols-3 gap-3">
            {([["Full Name", "name"], ["Mobile", "mobile"], ["Email", "email"], ["Password", "password"], ["Paytm No", "paytm"], ["PhonePe No", "phonepe"], ["Google Pay No", "gpay"], ["UPI ID", "upi"]] as const).map(([l, k]) => (
              <Field key={k} label={l}><input className="admin-input" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></Field>
            ))}
            {([["A/c Holder Name", "holder"], ["Bank Name", "bank"], ["A/c Number", "account"], ["IFSC Code", "ifsc"], ["Branch Address", "address"]] as const).map(([l, k]) => (
              <Field key={k} label={l}><input className="admin-input" value={edit.bank[k]} onChange={(e) => setEdit({ ...edit, bank: { ...edit.bank, [k]: e.target.value } })} /></Field>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

export function Roles() {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [admin, setAdmin] = useState({ name: "", username: "", password: "", role: "" });

  const addRole = () => {
    if (!name.trim() || !perms.length) return toast("Enter a role name and pick permissions", "bad");
    update((d) => { d.roles.push({ id: nid(d), name: name.trim(), perms }); log(d, "Add Role", name.trim()); });
    setName(""); setPerms([]); toast("Role saved", "ok");
  };
  const addAdmin = () => {
    if (!admin.name.trim() || !admin.username.trim()) return toast("Name and username are required", "bad");
    if (s.admins.some((a) => a.username.toLowerCase() === admin.username.trim().toLowerCase())) return toast("Username already taken", "bad");
    const pwd = admin.password.trim() || "admin@777";
    update((d) => {
      d.admins.push({
        id: nid(d),
        name: admin.name.trim(),
        username: admin.username.trim(),
        password: pwd,
        role: admin.role || s.roles[0]?.name || "Super Admin",
        active: true,
      });
      log(d, "Add Admin", admin.username);
    });
    setAdmin({ name: "", username: "", password: "", role: "" });
    toast("Sub admin created", "ok");
  };

  return (
    <>
      <div className="grid xl:grid-cols-2 gap-5">
        <Card title="Add Role">
          <Field label="Role Name"><input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Result Operator" /></Field>
          <div className="text-[13px] text-slate-600 mt-4 mb-2">Permissions</div>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((m) => {
              const on = perms.includes(m);
              return <label key={m} className="flex items-center gap-1.5 text-sm border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer"><input type="checkbox" checked={on} onChange={() => setPerms(on ? perms.filter((p) => p !== m) : [...perms, m])} />{m}</label>;
            })}
          </div>
          <Btn className="mt-4" onClick={addRole}>Submit</Btn>
        </Card>
        <Card title="Add Sub Admin">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name"><input className="admin-input" value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} placeholder="Full name" /></Field>
            <Field label="Username"><input className="admin-input" value={admin.username} onChange={(e) => setAdmin({ ...admin, username: e.target.value })} placeholder="username" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Field label="Password"><input type="password" className="admin-input" value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} placeholder="Default: admin@777" /></Field>
            <Field label="Role"><select className="admin-input" value={admin.role} onChange={(e) => setAdmin({ ...admin, role: e.target.value })}>{s.roles.map((r) => <option key={r.id}>{r.name}</option>)}</select></Field>
          </div>
          <Btn className="mt-4" onClick={addAdmin}>Submit</Btn>
        </Card>
      </div>
      <Card className="mt-5" title="Roles">
        <DataTable head={["Sr No", "Role", "Permissions", "Admins"]} rows={s.roles.map((r, i) => [i + 1, <b key="n">{r.name}</b>,
          <div key="p" className="flex flex-wrap gap-1 whitespace-normal max-w-2xl">{r.perms.map((p) => <Badge key={p} tone="blue">{p}</Badge>)}</div>, s.admins.filter((a) => a.role === r.name).length])} />
      </Card>
      <Card className="mt-5" title="Sub Admins">
        <DataTable head={["Sr No", "Name", "Username", "Role", "Password", "Active"]} rows={s.admins.map((a, i) => [
          i + 1,
          a.name,
          a.username,
          a.role,
          <button
            key="p"
            onClick={() => {
              const newPwd = window.prompt(`Enter new password for ${a.username}:`, a.password || "admin@777");
              if (newPwd && newPwd.trim().length >= 4) {
                update((d) => {
                  const x = d.admins.find((y) => y.id === a.id)!;
                  x.password = newPwd.trim();
                  log(d, "Change Password", a.username);
                });
                toast(`Password updated for ${a.username}`, "ok");
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Change Password
          </button>,
          a.username === "admin" ? <Badge key="s" tone="green">Yes</Badge> : <YesNo key="s" on={a.active} onChange={() => update((d) => { const x = d.admins.find((y) => y.id === a.id)!; x.active = !x.active; })} />
        ])} />
      </Card>
    </>
  );
}
