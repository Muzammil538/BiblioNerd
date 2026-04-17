import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchMe } from "../features/auth/authSlice.js";
import { fetchBooks } from "../features/books/bookSlice.js";
import api from "../services/api.js";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: allBooks, status: booksStatus, error: booksError } = useSelector(
    (state) => state.books
  );
  
  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "books") {
      dispatch(fetchBooks({ category: "all" }));
    } else if (activeTab === "favorites") {
      loadFavorites();
    } else if (activeTab === "recent") {
      loadRecent();
    }
  }, [dispatch, activeTab]);

  async function loadFavorites() {
    setLoadingLocal(true);
    try {
      const { data } = await api.get("/users/favorites");
      setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
    } catch (err) {
      setError("Failed to load favorites");
    } finally {
      setLoadingLocal(false);
    }
  }

  async function loadRecent() {
    setLoadingLocal(true);
    try {
      const { data } = await api.get("/users/recently-viewed");
      setRecent(Array.isArray(data.recentlyViewed) ? data.recentlyViewed : []);
    } catch (err) {
      setError("Failed to load recent books");
    } finally {
      setLoadingLocal(false);
    }
  }

  const sub = user?.subscription;
  const isAdmin = user?.role === "admin";
  const tabs = isAdmin
    ? [
        { key: "profile", label: "Profile" },
        { key: "books", label: "Books" },
        { key: "upload", label: "Upload book" },
      ]
    : [
        { key: "profile", label: "Profile" },
        { key: "favorites", label: "Favorites" },
        { key: "recent", label: "Recently viewed" },
      ];

  async function handleDelete(bookId) {
    if (!window.confirm("Delete this book permanently?")) {
      return;
    }

    setMessage(null);
    setError(null);
    setDeletingId(bookId);

    try {
      await api.delete(`/books/${bookId}`);
      setMessage("Book deleted successfully.");
      dispatch(fetchBooks({ category: "all" }));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete book.");
    } finally {
      setDeletingId(null);
    }
  }

  const renderBookGrid = (listType, books) => {
    if (listType === "books" && booksStatus === "loading") {
      return <p className="text-sm text-[#7a7265]">Loading books…</p>;
    }
    if (loadingLocal) {
      return <p className="text-sm text-[#7a7265]">Loading…</p>;
    }
    if ((listType === "books" && booksError) || error) {
      return <p className="text-sm text-red-800">{booksError || error}</p>;
    }
    if (!books?.length) {
      return <p className="text-sm text-[#7a7265]">No books are available here yet.</p>;
    }
    return (
      <div className="space-y-4">
        {books.map((book) => (
          <div
            key={book._id}
            className="rounded-2xl border border-[#e3ddd0] bg-[#f7f4ee] p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-[#7a7265] uppercase tracking-wider text-[10px]">{book.category}</p>
                <h3 className="text-lg font-medium">{book.title}</h3>
                <p className="text-sm text-[#5c574c]">{book.author}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/book/${book._id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c4] bg-white px-3 py-2 text-sm hover:bg-[#f4efe6] transition-colors"
                >
                  View Details
                </Link>
                {isAdmin && activeTab === "books" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(book._id)}
                    disabled={deletingId === book._id}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
                  >
                    {deletingId === book._id ? "Deleting…" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-3xl font-light tracking-tight">Your membership</h1>
      <p className="text-sm text-[#5c574c] mt-2">
        Signed in as <span className="text-[#1a1a1a]">{user?.email}</span>
      </p>

      <div className="mt-10 rounded-2xl border border-[#e3ddd0] bg-white p-8">
        <nav className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setError(null);
                setMessage(null);
              }}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-[#1a1a1a] text-[#fdfbf7]"
                  : "border border-[#d8d0c4] text-[#5c574c] hover:bg-[#f4efe6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e3ddd0] bg-[#f7f4ee] p-6">
                <h2 className="text-xl font-semibold">Profile</h2>
                <div className="mt-4 space-y-3 text-sm text-[#5c574c]">
                  <div className="flex justify-between">
                    <span>Email</span>
                    <span className="font-medium text-[#1a1a1a]">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Role</span>
                    <span className="font-medium text-[#1a1a1a]">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Joined</span>
                    <span className="font-medium text-[#1a1a1a]">
                      {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
                <h2 className="text-xl font-semibold">Membership</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-[#7a7265]">
                    <span>Plan</span>
                    <span className="font-medium capitalize">{sub?.plan || "none"}</span>
                  </div>
                  <div className="flex justify-between text-[#7a7265]">
                    <span>Active</span>
                    <span className="font-medium">{sub?.isActive ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between text-[#7a7265]">
                    <span>Start</span>
                    <span>{formatDate(sub?.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-[#7a7265]">
                    <span>Renews / ends</span>
                    <span>{formatDate(sub?.endDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "books" && (
            <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
              <h2 className="text-xl font-semibold">All books</h2>
              <div className="mt-6">{renderBookGrid("books", allBooks)}</div>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
              <h2 className="text-xl font-semibold">Favorites / Wishlist</h2>
              <div className="mt-6">{renderBookGrid("favorites", favorites)}</div>
            </div>
          )}

          {activeTab === "recent" && (
            <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
              <h2 className="text-xl font-semibold">Recently viewed books</h2>
              <div className="mt-6">{renderBookGrid("recent", recent)}</div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6 space-y-4">
              <h2 className="text-xl font-semibold">Upload book</h2>
              <p className="text-sm text-[#5c574c]">
                Use the admin panel to add a new title to the library.
              </p>
              <Link
                to="/admin"
                className="inline-flex items-center justify-center rounded-full bg-[#1a1a1a] px-5 py-3 text-sm text-[#fdfbf7] hover:bg-black transition-colors"
              >
                Go to admin page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
