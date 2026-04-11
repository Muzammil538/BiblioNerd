import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../features/auth/authSlice.js";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, token } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      const dest = location.state?.from || "/";
      navigate(dest, { replace: true });
    }
  }, [token, navigate, location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    await dispatch(loginUser({ email, password }));
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl font-light tracking-tight mb-2">Welcome back</h1>
      <p className="text-[#5c574c] text-sm mb-10">
        Sign in to open your library and continue reading.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-[#1a1a1a] py-2.5 text-sm text-[#fdfbf7] hover:bg-black disabled:opacity-60 transition-colors"
        >
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-[#5c574c]">
        New here?{" "}
        <Link to="/register" className="underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
