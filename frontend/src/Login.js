import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthForm.css";
import ServiceUnavailable from "./ServiceUnavailable";
import { login, BackendUnavailableError } from "./api";
import { saveAuthData } from "./auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setBackendDown(false);

    try {
      const data = await login(email, password);
      saveAuthData(data.access_token, email, data.user_id);
      navigate("/chat");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendDown(true);
      } else if (err.status === 401) {
        setError("Invalid email or password");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setBackendDown(false);
    setError("");
  };

  if (backendDown) {
    return <ServiceUnavailable onRetry={handleRetry} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
