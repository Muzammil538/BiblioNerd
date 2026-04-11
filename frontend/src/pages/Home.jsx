import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBooks,
  fetchTrending,
  fetchCategories,
} from "../features/books/bookSlice.js";

export default function Home() {
  const dispatch = useDispatch();
  const { items, trending, categories, status, error } = useSelector(
    (state) => state.books
  );
  const [category, setCategory] = useState("all");
  const list = Array.isArray(items) ? items : [];
  const trend = Array.isArray(trending) ? trending : [];
  const cats = Array.isArray(categories) ? categories : [];

  useEffect(() => {
    dispatch(fetchTrending());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBooks({ category }));
  }, [dispatch, category]);

  const gridBooks = useMemo(() => list, [list]);

  return (
    <div>
      <section className="reader-paper border-b border-[#e3ddd0]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7a7265] mb-4">
            BiblioNerd Library
          </p>
          <h1 className="max-w-2xl text-4xl md:text-5xl font-light leading-tight tracking-tight text-[#1a1a1a]">
            A calmer way to read. Typography-first, distraction-light.
          </h1>
          <p className="mt-6 max-w-xl text-base text-[#5c574c] leading-relaxed">
            Browse by mood and category. Your subscription unlocks the full
            reader with time-limited secure links to every title.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-light tracking-tight">Trending now</h2>
            <p className="text-sm text-[#7a7265] mt-1">What members are opening most.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trend.map((book) => (
            <article
              key={book._id}
              className="group rounded-lg border border-[#e3ddd0] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <Link to={`/read/${book._id}`} className="block">
                <div className="aspect-[3/4] bg-[#ebe6dc] overflow-hidden">
                  <img
                    src={book.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#7a7265] mt-1">{book.author}</p>
                </div>
              </Link>
            </article>
          ))}
          {trend.length === 0 && (
            <p className="text-sm text-[#7a7265] col-span-full">
              No titles yet. Admins can upload from the Admin panel.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-light tracking-tight">Catalogue</h2>
            <p className="text-sm text-[#7a7265] mt-1">Filter by category.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full px-4 py-1.5 text-xs tracking-wide border transition-colors ${
                category === "all"
                  ? "bg-[#1a1a1a] text-[#fdfbf7] border-[#1a1a1a]"
                  : "border-[#d8d0c4] text-[#5c574c] hover:border-[#1a1a1a]"
              }`}
            >
              All
            </button>
            {cats.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1.5 text-xs tracking-wide border transition-colors ${
                  category === c
                    ? "bg-[#1a1a1a] text-[#fdfbf7] border-[#1a1a1a]"
                    : "border-[#d8d0c4] text-[#5c574c] hover:border-[#1a1a1a]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700 mb-4">{error}</p>
        )}
        {status === "loading" && (
          <p className="text-sm text-[#7a7265]">Loading catalogue…</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridBooks.map((book) => (
            <article
              key={book._id}
              className="flex gap-4 rounded-lg border border-[#e3ddd0] bg-white p-4 hover:border-[#c9c2b4] transition-colors"
            >
              <Link to={`/read/${book._id}`} className="shrink-0 w-24">
                <div className="aspect-[3/4] rounded overflow-hidden bg-[#ebe6dc]">
                  <img
                    src={book.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
              <div className="min-w-0 flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-[#9a9285]">
                  {book.category}
                </span>
                <Link to={`/read/${book._id}`}>
                  <h3 className="text-base font-medium leading-snug mt-1 hover:underline">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-sm text-[#7a7265] mt-1">{book.author}</p>
                <p className="text-xs text-[#9a9285] mt-2 line-clamp-3 leading-relaxed">
                  {book.description}
                </p>
              </div>
            </article>
          ))}
        </div>
        {status === "succeeded" && gridBooks.length === 0 && (
          <p className="text-sm text-[#7a7265]">No books in this category yet.</p>
        )}
      </section>
    </div>
  );
}
