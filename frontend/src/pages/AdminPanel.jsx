import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import debounce from "lodash.debounce";
import api from "../services/api.js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");

  // Books State
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState(null);
  const [bookSearch, setBookSearch] = useState("");
  const [bookAccessType, setBookAccessType] = useState("all");

  // User State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  
  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [trendingScore, setTrendingScore] = useState("0");
  const [accessType, setAccessType] = useState("premium");
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "books") {
      debouncedSearch(bookSearch, bookAccessType);
    } else if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "overview") {
      loadAnalytics();
    } else if (activeTab === "transactions") {
      loadTransactions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "books") {
      debouncedSearch(bookSearch, bookAccessType);
    }
    return () => debouncedSearch.cancel();
  }, [bookSearch, bookAccessType]);

  const debouncedSearch = useCallback(
    debounce(async (query, filterAccess) => {
      setBooksLoading(true);
      try {
        const { data } = await api.get(`/books?search=${query}&accessType=${filterAccess}`);
        setBooks(Array.isArray(data.books) ? data.books : []);
      } catch (err) {
        setBooksError(err.response?.data?.message || "Failed to load books");
      } finally {
        setBooksLoading(false);
      }
    }, 300),
    []
  );

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      const { data } = await api.get("/books/analytics");
      setAnalytics(data);
    } catch (err) {
    }
  }

  async function loadTransactions() {
    setTxLoading(true);
    try {
      const { data } = await api.get("/payments/transactions");
      setTransactions(data.transactions || []);
    } catch {
    } finally {
      setTxLoading(false);
    }
  }

  async function toggleBlock(userId, isBlocked) {
    if (!window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) return;
    try {
      await api.put(`/users/${userId}/block`);
      loadUsers(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || "Error blocking/unblocking user.");
    }
  }

  function clearForm() {
    setTitle("");
    setAuthor("");
    setDescription("");
    setCategory("");
    setTrendingScore("0");
    setAccessType("premium");
    setCover(null);
    setPdf(null);
    setMessage(null);
    setError(null);
  }

  async function handleDeleteBook(bookId) {
    if (!window.confirm("Delete this book permanently?")) return;
    try {
      await api.delete(`/books/${bookId}`);
      setMessage("Book deleted.");
      debouncedSearch(bookSearch, bookAccessType);
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!cover || !pdf) {
      setError("Please choose both a cover image and a PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("trendingScore", trendingScore);
    formData.append("accessType", accessType);
    formData.append("cover", cover);
    formData.append("pdf", pdf);

    setLoading(true);
    try {
      await api.post("/books", formData);
      setMessage("Book uploaded successfully.");
      clearForm();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "transactions", label: "Transactions" },
    { key: "books", label: "Books" },
    { key: "upload", label: "Upload book" }
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Admin panel</h1>
          <p className="text-sm text-[#5c574c] mt-2">Manage library content, users, and transactions.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-[#e3ddd0] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setMessage(null);
              setError(null);
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
      </div>

      <div className="mt-10">
        
        {activeTab === "overview" && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Analytics Overview</h2>
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#e3ddd0] p-6 rounded-2xl shadow-sm">
                    <p className="text-sm text-[#7a7265]">Total Users</p>
                    <p className="text-3xl font-light mt-2">{analytics.totalUsers}</p>
                  </div>
                  <div className="bg-white border border-[#e3ddd0] p-6 rounded-2xl shadow-sm">
                    <p className="text-sm text-[#7a7265]">Total Books</p>
                    <p className="text-3xl font-light mt-2">{analytics.totalBooks}</p>
                  </div>
                  <div className="bg-white border border-[#e3ddd0] p-6 rounded-2xl shadow-sm">
                    <p className="text-sm text-indigo-500 font-medium">Active Subs</p>
                    <p className="text-3xl font-light mt-2">{analytics.activeSubscriptions}</p>
                  </div>
                  <div className="bg-white border border-[#e3ddd0] p-6 rounded-2xl shadow-sm bg-emerald-50">
                    <p className="text-sm text-emerald-700 font-medium">Total Revenue</p>
                    <p className="text-3xl font-medium mt-2 text-emerald-800">₹{analytics.totalRevenue}</p>
                  </div>
                </div>

                <div className="bg-white border border-[#e3ddd0] p-6 rounded-2xl shadow-sm mt-8">
                  <h3 className="font-medium text-[#1a1a1a] mb-6">Key Metrics</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "Users", count: analytics.totalUsers },
                        { name: "Books", count: analytics.totalBooks },
                        { name: "Subs", count: analytics.activeSubscriptions }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3ddd0"/>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"#1a1a1a", fontSize: 13}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill:"#7a7265", fontSize: 13}} dx={-10} />
                        <RechartsTooltip cursor={{fill:"#f4efe6"}} contentStyle={{borderRadius:"8px", border:"1px solid #e3ddd0"}} />
                        <Bar dataKey="count" fill="#1a1a1a" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
               <p className="text-sm text-[#7a7265]">Loading analytics...</p>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
            <h2 className="text-xl font-semibold mb-6">User Management</h2>
            {usersLoading ? <p className="text-sm text-[#7a7265]">Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#f7f4ee] text-[#5c574c]">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">User</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Subscription</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3ddd0]">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-4 py-4 border-b border-[#e3ddd0]">
                          <p className="font-medium">{u.name}</p>
                          <p className="text-[11px] text-[#7a7265]">{u.email}</p>
                        </td>
                        <td className="px-4 py-4 border-b border-[#e3ddd0] capitalize">{u.role}</td>
                        <td className="px-4 py-4 border-b border-[#e3ddd0]">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.subscription?.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                            {u.subscription?.isActive ? u.subscription.plan : "None"}
                          </span>
                        </td>
                        <td className="px-4 py-4 border-b border-[#e3ddd0]">
                           {u.isBlocked ? (
                             <span className="text-red-600 font-medium text-xs">Blocked</span>
                           ) : (
                             <span className="text-emerald-600 font-medium text-xs">Active</span>
                           )}
                        </td>
                        <td className="px-4 py-4 border-b border-[#e3ddd0]">
                          {u.role !== "admin" && (
                            <button
                              onClick={() => toggleBlock(u.id, u.isBlocked)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                u.isBlocked 
                                  ? "bg-slate-100 text-slate-800 hover:bg-slate-200" 
                                  : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              {u.isBlocked ? "Unblock" : "Block User"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
            <h2 className="text-xl font-semibold mb-6">Payment Transactions</h2>
            {txLoading ? <p className="text-sm text-[#7a7265]">Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#f7f4ee] text-[#5c574c]">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Order ID</th>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3ddd0]">
                    {transactions.map(t => (
                      <tr key={t._id}>
                        <td className="px-4 py-4 font-mono text-[11px] text-[#5c574c]">{t.orderId}</td>
                        <td className="px-4 py-4">
                          {t.user ? t.user.name : "Unknown"}
                          <br /><span className="text-[11px] text-[#7a7265]">{t.user?.email}</span>
                        </td>
                        <td className="px-4 py-4 capitalize">{t.plan}</td>
                        <td className="px-4 py-4 font-medium">₹{t.amount}</td>
                        <td className="px-4 py-4 text-xs text-[#7a7265]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                            t.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "books" && (
          <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">Books Management</h2>
            
            <div className="mb-6 flex gap-4 md:items-center flex-col md:flex-row">
              <input
                type="text"
                placeholder="Search tightly by title..."
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                className="w-full max-w-xs rounded-full border border-[#d8d0c4] bg-[#f7f4ee] px-4 py-2 text-sm text-[#1a1a1a] focus:outline-none"
              />
              <select
                value={bookAccessType}
                onChange={e => setBookAccessType(e.target.value)}
                className="w-full max-w-xs rounded-full border border-[#d8d0c4] bg-[#f7f4ee] px-4 py-2 text-sm text-[#1a1a1a] focus:outline-none"
              >
                <option value="all">All Access Types</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {booksLoading ? (
              <p className="mt-4 text-sm text-[#7a7265]">Loading books…</p>
            ) : booksError ? (
              <p className="mt-4 text-sm text-red-800">{booksError}</p>
            ) : (
              <div className="mt-6 space-y-4">
                {books.length === 0 ? (
                  <p className="text-sm text-[#7a7265]">No books match filters.</p>
                ) : (
                  books.map((book) => (
                    <div key={book._id} className="rounded-2xl border border-[#e3ddd0] bg-[#f7f4ee] p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                             <h3 className="text-lg font-semibold">{book.title}</h3>
                             <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{book.accessType || "premium"}</span>
                          </div>
                          <p className="text-sm text-[#5c574c]">{book.author}</p>
                          <p className="text-xs text-[#7a7265] mt-1">{book.category}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/book/${book._id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c4] bg-white px-3 py-2 text-sm hover:bg-[#f4efe6] transition-colors"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(book._id)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "upload" && (
          <div className="rounded-2xl border border-[#e3ddd0] bg-white p-8">
            <h2 className="text-2xl font-semibold">Upload a title</h2>
            <p className="mt-2 text-sm text-[#5c574c]">
              Uploaded books are processed to Cloudinary storage.
            </p>
            <form onSubmit={handleSubmitForm} className="mt-10 space-y-6">
              {message && (
                <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {message}
                </p>
              )}
              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Title</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border border-[#d8d0c4] bg-[#f7f4ee] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Author</label>
                  <input
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-md border border-[#d8d0c4] bg-[#f7f4ee] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-[#d8d0c4] bg-[#f7f4ee] px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Category</label>
                  <input
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-[#d8d0c4] bg-[#f7f4ee] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Trending Score</label>
                  <input
                    type="number"
                    value={trendingScore}
                    onChange={(e) => setTrendingScore(e.target.value)}
                    className="w-full rounded-md border border-[#d8d0c4] bg-[#f7f4ee] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Access Type</label>
                  <select
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value)}
                    className="w-full rounded-md border border-[#d8d0c4] bg-[#f7f4ee] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="premium">Premium</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border border-dashed border-[#d8d0c4] rounded bg-gray-50">
                  <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-2 font-medium">Cover image (JPEG/PNG)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setCover(e.target.files?.[0] || null)}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-[#1a1a1a] file:text-white cursor-pointer"
                  />
                </div>
                <div className="p-4 border border-dashed border-[#d8d0c4] rounded bg-gray-50">
                  <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-2 font-medium">Book PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdf(e.target.files?.[0] || null)}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-[#1a1a1a] file:text-white cursor-pointer"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#1a1a1a] py-3 text-sm font-medium text-[#fdfbf7] disabled:opacity-60 transition-colors hover:bg-black mt-4"
              >
                {loading ? "Uploading to Cloudinary..." : "Publish to Catalogue"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
