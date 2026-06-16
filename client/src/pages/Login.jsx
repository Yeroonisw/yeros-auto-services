import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api.js";

export default function Login() {
  const { login, authenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "admin@yerosautoservices.com",
    password: "Admin123!",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      <section className="login-panel">
        <div className="login-copy">
          <div className="brand-mark large">YA</div>
          <p className="eyebrow">Shop management</p>
          <h1>Keep every repair moving.</h1>
          <p>Customers, vehicles and work orders in one focused workspace.</p>
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
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              autoComplete="current-password"
            />
          </label>
          <button className="button primary full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <small className="login-hint">Default access: admin@yerosautoservices.com / Admin123!</small>
        </form>
      </section>
    </div>
  );
}
