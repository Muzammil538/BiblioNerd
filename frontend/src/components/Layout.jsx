import { Link, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice.js";

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  const linkClass = ({ isActive }) =>
    [
      "text-sm tracking-wide transition-colors",
      isActive
        ? "text-[#1a1a1a] font-medium"
        : "text-[#5c574c] hover:text-[#1a1a1a]",
    ].join(" ");

  const headerClasses = "border-b border-[#e3ddd0] bg-[#fdfbf7]/90 text-[#1a1a1a]";
  const footerClasses = "border-t border-[#e3ddd0] bg-transparent text-[#7a7265]";
  const buttonClasses = "text-sm text-[#5c574c] hover:text-[#1a1a1a]";

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
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-cog-icon lucide-shield-cog"><path d="m10.929 14.467-.383.924"/><path d="M10.929 8.923 10.546 8"/><path d="M13.225 8.923 13.608 8"/><path d="m13.607 15.391-.382-.924"/><path d="m14.849 10.547.923-.383"/><path d="m14.849 12.843.923.383"/><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9.305 10.547-.923-.383"/><path d="m9.305 12.843-.923.383"/><circle cx="12.077" cy="11.695" r="3"/></svg>                      Controls
                    </span>
                  </NavLink>
                )}

                <button
                  type="button"
                  onClick={() => dispatch(logout())}
                  className={`${buttonClasses} rounded-full p-2`}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out-icon lucide-log-out"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
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
