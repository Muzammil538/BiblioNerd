import { Link, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice.js";

export default function Layout({ children, theme, onToggleTheme }) {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  const linkClass = ({ isActive }) =>
    [
      "text-sm tracking-wide transition-colors",
      isActive
        ? theme === "dark"
          ? "text-white font-medium"
          : "text-[#1a1a1a] font-medium"
        : theme === "dark"
        ? "text-slate-400 hover:text-white"
        : "text-[#5c574c] hover:text-[#1a1a1a]",
    ].join(" ");

  const headerClasses =
    theme === "dark"
      ? "border-b border-slate-700 bg-slate-950/95 text-slate-100"
      : "border-b border-[#e3ddd0] bg-[#fdfbf7]/90 text-[#1a1a1a]";

  const footerClasses =
    theme === "dark"
      ? "border-t border-slate-700 bg-slate-950 text-slate-300"
      : "border-t border-[#e3ddd0] bg-transparent text-[#7a7265]";

  const buttonClasses =
    theme === "dark"
      ? "text-sm text-slate-300 hover:text-white"
      : "text-sm text-[#5c574c] hover:text-[#1a1a1a]";

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`${headerClasses} backdrop-blur-sm sticky top-0 z-40`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <Link to={token ? "/" : "/login"} className="font-semibold tracking-tight text-xl">
            BiblioNerd
          </Link>
          <nav className="flex flex-wrap items-center gap-5">
            {token ? (
              <>
                <NavLink to="/" className={linkClass} end>
                  Library
                </NavLink>
                <NavLink to="/pricing" className={linkClass}>
                  Plans
                </NavLink>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                {user?.role === "admin" && (
                  <NavLink to="/admin" className={linkClass}>
                    <span className="inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                      Upload Book
                    </span>
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`${buttonClasses} rounded-full p-2 cursor-pointer`}
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M21.752 15.002A9.718 9.718 0 0112.001 22C6.478 22 2 17.522 2 12a9.718 9.718 0 016.998-9.751.75.75 0 01.858.99A7.5 7.5 0 1019.76 15.45a.75.75 0 01.992.852z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(logout())}
                  className={`${buttonClasses} rounded-full p-2`}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out-icon lucide-log-out"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
                </button>
              </>
            ) : (
              <>
                <NavLink to="/pricing" className={linkClass}>
                  Plans
                </NavLink>
                <NavLink
                  to="/login"
                  className="rounded-full border border-[#1a1a1a] px-4 py-2 text-sm hover:bg-[#1a1a1a] hover:text-[#fdfbf7] transition-colors"
                >
                  Login / Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className={`${footerClasses} py-8 text-center text-xs`}>
        BiblioNerd — quiet reading for curious minds.
      </footer>
    </div>
  );
}
