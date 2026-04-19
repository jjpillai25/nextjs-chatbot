import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthForm.css";
import ServiceUnavailable from "./ServiceUnavailable";
import { signUp, BackendUnavailableError } from "./api";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const navigate = useNavigate();

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordMismatchError = password && confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setBackendDown(false);

    try {
      await signUp(email, password);
      navigate("/login");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendDown(true);
      } else if (err.status === 400) {
        setError("User already exists");
      } else {
        setError(err.message || "Signup failed. Please try again.");
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
        <h1>Sign Up</h1>
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
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
            {passwordMismatchError && (
              <span className="inline-error">Passwords do not match</span>
            )}
          </div>
          <button type="submit" disabled={loading || !passwordsMatch}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
