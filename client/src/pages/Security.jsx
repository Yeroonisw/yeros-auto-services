import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, Download, KeyRound, ShieldCheck, Smartphone, UserPlus, Users } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

export default function Security() {
  const [users, setUsers] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loginActivity, setLoginActivity] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [twoFactor, setTwoFactor] = useState({ secret: "", code: "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const defaultPermissions = ["dashboard", "customers", "vehicles", "appointments", "work_orders", "estimates", "inventory", "reminders", "inspections", "finance", "technicians"];
  const permissionLabels = { dashboard: "Dashboard", customers: "Customers", vehicles: "Vehicles", appointments: "Calendar", work_orders: "Work orders", estimates: "Estimates", inventory: "Inventory", reminders: "Reminders", inspections: "Inspections", finance: "Finance", technicians: "Mechanics" };
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "technician", permissions: defaultPermissions });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try {
      const [userResponse, auditResponse, loginResponse, statusResponse] = await Promise.all([api.get("/security/users"), api.get("/security/audit"), api.get("/security/login-activity"), api.get("/security/system-status")]);
      setUsers(userResponse.data); setAudit(auditResponse.data); setLoginActivity(loginResponse.data); setSystemStatus(statusResponse.data);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  useEffect(() => { load(); }, []);
  async function changePassword(event) {
    event.preventDefault();
    if (password.newPassword !== password.confirm) return setError("New passwords do not match.");
    try {
      const { data } = await api.post("/security/change-password", password);
      setMessage(data.message); setPassword({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  async function createUser(event) {
    event.preventDefault();
    try {
      await api.post("/security/users", newUser);
      setNewUser({ name: "", email: "", password: "", role: "technician", permissions: defaultPermissions });
      setMessage("Team account created successfully.");
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  async function downloadBackup() {
    try {
      const response = await api.get("/security/backup", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `yeros-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded successfully.");
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  async function setupTwoFactor() { try { const { data } = await api.post("/security/2fa/setup"); setTwoFactor({ secret: data.secret, code: "" }); } catch (requestError) { setError(errorMessage(requestError)); } }
  async function enableTwoFactor(event) { event.preventDefault(); try { const { data } = await api.post("/security/2fa/enable", { code: twoFactor.code }); setMessage(data.message); setTwoFactor({ secret: "", code: "" }); } catch (requestError) { setError(errorMessage(requestError)); } }

  return <div className="page business-module security-page">
    <Alert message={error} onClose={() => setError("")} />
    {message && <div className="success-banner"><ShieldCheck />{message}</div>}
    <header className="module-hero"><div><span className="eyebrow">Access & recovery</span><h1>Security center</h1><p>Protect access, review users and see who changed business records.</p></div><span className="hero-count"><ShieldCheck />Protected</span></header>
    <section className="security-grid">
      <article className="solid-panel password-panel"><header><KeyRound /><div><h2>Change password</h2><p>Use at least eight characters and avoid reused passwords.</p></div></header>
        <form onSubmit={changePassword}><label>Current password<input type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} required /></label><label>New password<input type="password" minLength="8" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} required /></label><label>Confirm new password<input type="password" minLength="8" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} required /></label><button className="button primary">Update password</button></form>
      </article>
      <article className="solid-panel"><header><Users /><div><h2>Authorized users</h2><p>Roles and access status for the team.</p></div></header>
        {users ? <div className="security-users">{users.map((user) => <div key={user._id}><span>{user.name?.[0]}</span><div><strong>{user.name}</strong><small>{user.email}</small></div><b>{user.role}</b><i className={user.active === false ? "off" : ""}>{user.active === false ? "Disabled" : "Active"}</i></div>)}</div> : <Loading />}
        <form className="new-user-form" onSubmit={createUser}><strong><UserPlus /> Add team member</strong><input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" required /><input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" required /><input type="password" minLength="8" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Temporary password" required /><select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}><option value="technician">Technician</option><option value="manager">Manager</option><option value="admin">Administrator</option></select><fieldset><legend>Module permissions</legend>{Object.entries(permissionLabels).map(([value, label]) => <label key={value}><input type="checkbox" checked={newUser.permissions.includes(value)} onChange={(event) => setNewUser({ ...newUser, permissions: event.target.checked ? [...newUser.permissions, value] : newUser.permissions.filter((permission) => permission !== value) })} />{label}</label>)}</fieldset><button className="button primary">Create user</button></form>
      </article>
    </section>
    <section className="security-grid security-advanced">
      <article className="solid-panel"><header><Smartphone /><div><h2>Two-factor authentication</h2><p>Add a rotating authenticator code to your password.</p></div></header>{twoFactor.secret ? <form className="two-factor-setup" onSubmit={enableTwoFactor}><span>Enter this key in Google Authenticator, Microsoft Authenticator or Authy:</span><code>{twoFactor.secret}</code><label>Current 6-digit code<input inputMode="numeric" maxLength="6" value={twoFactor.code} onChange={(e) => setTwoFactor({ ...twoFactor, code: e.target.value.replace(/\D/g, "") })} required /></label><button className="button primary">Verify and enable</button></form> : <button className="button primary" onClick={setupTwoFactor}><ShieldCheck />Set up two-factor authentication</button>}</article>
      <article className="solid-panel"><header><AlertTriangle /><div><h2>Sign-in monitoring</h2><p>Failed access attempts during the last 30 days.</p></div></header><strong className="login-risk-number">{loginActivity?.failedLast30Days || 0}</strong><span className="login-risk-label">failed attempts detected</span><div className="login-attempts">{loginActivity?.items?.slice(0, 8).map((item) => <div key={item._id}><i className={item.success ? "success" : "failed"} /><div><strong>{item.email}</strong><small>{item.reason} · {new Date(item.createdAt).toLocaleString()}</small></div></div>)}</div></article>
    </section>
    <section className="solid-panel integration-health"><header><ShieldCheck /><div><h2>Protection & automation status</h2><p>Server-side services that require protected provider credentials.</p></div></header><div>{systemStatus && Object.entries({ recovery: "Emergency recovery", messaging: "Automatic messaging", payments: "Online payment links", backups: "External daily backups", twoFactorAvailable: "Authenticator security" }).map(([key, label]) => <article className={systemStatus[key] ? "ready" : "setup"} key={key}><i /><span>{label}</span><strong>{systemStatus[key] ? "Ready" : "Needs provider setup"}</strong></article>)}</div></section>
    <section className="solid-panel audit-panel"><header><Clock3 /><div><h2>Recent activity</h2><p>Permanent trail of record and access changes.</p></div><button className="button secondary audit-backup" onClick={downloadBackup}><Download />Download backup</button></header>
      {audit ? <div className="audit-list">{audit.items.map((item) => <article key={item._id}><span>{item.userName?.[0] || "S"}</span><div><strong>{item.summary || item.action}</strong><small>{item.userName || "System"} · {item.entityType}</small></div><time>{new Date(item.createdAt).toLocaleString()}</time></article>)}</div> : <Loading />}
    </section>
  </div>;
}
