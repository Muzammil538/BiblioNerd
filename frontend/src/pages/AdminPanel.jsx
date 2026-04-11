import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("upload");
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [trendingScore, setTrendingScore] = useState("0");
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "books") {
      loadBooks();
    }
  }, [activeTab]);

  async function loadBooks() {
    setBooksLoading(true);
    setBooksError(null);
    try {
      const { data } = await api.get("/books");
      setBooks(Array.isArray(data.books) ? data.books : []);
    } catch (err) {
      setBooksError(err.response?.data?.message || "Failed to load books");
    } finally {
      setBooksLoading(false);
    }
  }

  function clearForm() {
    setTitle("");
    setAuthor("");
    setDescription("");
    setCategory("");
    setTrendingScore("0");
    setCover(null);
    setPdf(null);
    setMessage(null);
    setError(null);
  }

  async function handleDelete(bookId) {
    if (!window.confirm("Delete this book permanently?")) {
      return;
    }

    try {
      await api.delete(`/books/${bookId}`);
      setMessage("Book deleted.");
      loadBooks();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  }

  async function handleSubmit(e) {
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
    formData.append("cover", cover);
    formData.append("pdf", pdf);

    setLoading(true);
    try {
      await api.post("/books", formData);
      setMessage("Book uploaded successfully.");
      clearForm();
      if (activeTab === "books") {
        loadBooks();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Admin panel</h1>
          <p className="text-sm text-[#5c574c] mt-2">Manage library content and upload new titles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              clearForm();
            }}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              activeTab === "upload"
                ? "bg-[#1a1a1a] text-[#fdfbf7]"
                : "border border-[#d8d0c4] text-[#5c574c] hover:bg-[#f4efe6]"
            }`}
          >
            Upload book
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("books");
              setMessage(null);
              setError(null);
            }}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              activeTab === "books"
                ? "bg-[#1a1a1a] text-[#fdfbf7]"
                : "border border-[#d8d0c4] text-[#5c574c] hover:bg-[#f4efe6]"
            }`}
          >
            Books
          </button>
        </div>
      </div>

      {activeTab === "books" ? (
        <div className="mt-10 space-y-6">
          <div className="rounded-2xl border border-[#e3ddd0] bg-white p-6">
            <h2 className="text-xl font-semibold">Books list</h2>
            {booksLoading ? (
              <p className="mt-4 text-sm text-[#7a7265]">Loading books…</p>
            ) : booksError ? (
              <p className="mt-4 text-sm text-red-800">{booksError}</p>
            ) : (
              <div className="mt-6 space-y-4">
                {books.length === 0 ? (
                  <p className="text-sm text-[#7a7265]">No books available.</p>
                ) : (
                  books.map((book) => (
                    <div key={book._id} className="rounded-2xl border border-[#e3ddd0] bg-[#f7f4ee] p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{book.title}</h3>
                          <p className="text-sm text-[#5c574c]">{book.author}</p>
                          <p className="text-xs text-[#7a7265] mt-1">{book.category}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/read/${book._id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c4] bg-white px-3 py-2 text-sm hover:bg-[#f4efe6]"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path d="M12 6.5c-4.633 0-8.33 2.815-9.5 6.5 1.17 3.685 4.867 6.5 9.5 6.5s8.33-2.815 9.5-6.5c-1.17-3.685-4.867-6.5-9.5-6.5zm0 11a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-1.5a3 3 0 100-6 3 3 0 000 6z" />
                            </svg>
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(book._id)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path d="M9.75 4.5a.75.75 0 00-1.5 0V5.25H5.25a.75.75 0 100 1.5h.75v12A2.25 2.25 0 008.25 21h7.5a2.25 2.25 0 002.25-2.25v-12h.75a.75.75 0 000-1.5h-3v-.75a.75.75 0 00-1.5 0V5.25h-4.5V4.5zM9 6.75h6v-.75h-6v.75zm-.75 3.75a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5zm4.5 0a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5z" />
                            </svg>
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

        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-[#e3ddd0] bg-white p-8">
          <h2 className="text-2xl font-semibold">Upload a title</h2>
          <p className="mt-2 text-sm text-[#5c574c]">
            PDFs and covers are stored on Cloudinary. Only administrators can access this form.
          </p>
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
                  className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Author</label>
                <input
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Category</label>
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Fiction, Essays, Classics…"
                  className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Trending score</label>
                <input
                  type="number"
                  value={trendingScore}
                  onChange={(e) => setTrendingScore(e.target.value)}
                  className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Cover image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">Book PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdf(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1a1a1a] py-2.5 text-sm text-[#fdfbf7] disabled:opacity-60"
            >
              {loading ? "Uploading…" : "Publish to catalogue"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
