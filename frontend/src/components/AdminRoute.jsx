import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AdminRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const status = useSelector((state) => state.auth.status);
  const location = useLocation();
  if (!token) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  if (token && !user && status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center text-sm text-[#7a7265]">
        Loading your profile…
      </div>
    );
  }
  if (user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  return children;
}
