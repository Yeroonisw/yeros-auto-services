import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api.js";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login, authenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (authenticated) return <Navigate to="/dashboard" replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Link className="login-back" to="/"><ArrowLeft /> Back to website</Link>
      <section className="login-panel login-v2">
        <div className="login-copy">
          <img src="/yeros-auto-logo.png" alt="Yeros Auto Services LLC" />
          <div className="login-copy-content">
            <p className="eyebrow">Service operations</p>
            <h1>Run every repair from one place.</h1>
            <p>Customers, appointments, diagnostics, estimates and work orders in a focused workspace built for Yeros.</p>
            <div className="login-benefits"><span><ShieldCheck /> Secure admin access</span><span><LockKeyhole /> Protected business records</span></div>
          </div>
        </div>
        <form className="login-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">Admin portal</p>
            <h2>Welcome back</h2>
            <p className="muted">Sign in to manage Yeros Auto Services.</p>
          </div>
          {error && <div className="form-error">{error}</div>}
          <label>
            Email
            <span className="login-input-wrap"><Mail /><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="email" placeholder="you@yerosautoservices.com" /></span>
          </label>
          <label>
            Password
            <span className="login-input-wrap"><LockKeyhole /><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required autoComplete="current-password" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></span>
          </label>
          <button className="button primary full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <small className="login-hint"><ShieldCheck /> Authorized personnel only. Your session is protected.</small>
        </form>
      </section>
    </div>
  );
}
