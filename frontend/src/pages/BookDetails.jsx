import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../services/api.js";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <svg
        key={i}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={i <= rating ? "currentColor" : "none"}
        stroke="currentColor"
        className={`w-5 h-5 ${i <= rating ? "text-yellow-400" : "text-[#d8d0c4]"}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    );
  }
  return <div className="flex gap-1">{stars}</div>;
}

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);
  const [inFavorites, setInFavorites] = useState(false);

  useEffect(() => {
    loadBook();
    if (token) {
      logRecentlyViewed();
      checkFavorites();
    }
  }, [id, token]);

  async function loadBook() {
    setLoading(true);
    try {
      const { data } = await api.get(`/books/${id}`);
      setBook(data.book);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load book details.");
    } finally {
      setLoading(false);
    }
  }

  async function logRecentlyViewed() {
    try {
      await api.post(`/users/recently-viewed/${id}`);
    } catch (e) {
      // ignore
    }
  }

  async function checkFavorites() {
    try {
      const { data } = await api.get("/users/favorites");
      setInFavorites(data.favorites.some(f => f._id === id || f === id));
    } catch (e) {
      // ignore
    }
  }

  async function toggleFavorite() {
    try {
      if (inFavorites) {
        await api.delete(`/users/favorites/${id}`);
        setInFavorites(false);
      } else {
        await api.post(`/users/favorites/${id}`);
        setInFavorites(true);
      }
    } catch (err) {
      // ignore
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!token) return navigate("/login");
    setReviewLoading(true);
    setReviewMsg(null);
    try {
      const { data } = await api.post(`/books/${id}/reviews`, {
        rating: userRating,
        comment: userComment
      });
      setBook(prev => ({ ...prev, reviews: data.reviews }));
      setReviewMsg("Review posted successfully!");
      setUserComment("");
    } catch (err) {
      setReviewMsg(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-5 py-20 text-center text-[#7a7265]">Loading book details…</div>;
  if (error || !book) return <div className="mx-auto max-w-4xl px-5 py-20 text-center text-red-700">{error || "Book not found."}</div>;

  const averageRating = book.reviews && book.reviews.length > 0
    ? (book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length).toFixed(1)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="grid md:grid-cols-[1fr_2fr] gap-12">
        <div>
          <div className="aspect-[3/4] bg-[#ebe6dc] overflow-hidden rounded-lg shadow-sm border border-[#e3ddd0]">
            <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to={`/read/${book._id}`}
              className="w-full text-center rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#fdfbf7] hover:bg-black transition-colors"
            >
              Read Book
            </Link>
            {token && (
              <button
                onClick={toggleFavorite}
                className={`w-full text-center rounded-full border px-6 py-3 text-sm font-medium transition-colors ${
                  inFavorites ? "border-[#1a1a1a] bg-[#1a1a1a] text-[#fdfbf7]" : "border-[#d8d0c4] text-[#5c574c] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                }`}
              >
                {inFavorites ? "In Favorites" : "Add to Favorites"}
              </button>
            )}
            <div className="mt-4 flex items-center justify-between text-sm text-[#7a7265]">
              <span>Access: <strong className="uppercase text-[#5c574c]">{book.accessType || "premium"}</strong></span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#7a7265] mb-2">{book.category}</p>
          <h1 className="text-4xl text-[#1a1a1a] font-light leading-tight">{book.title}</h1>
          <p className="text-xl text-[#5c574c] mt-2">by {book.author}</p>
          
          <div className="flex items-center gap-2 mt-4 text-[#7a7265] text-sm">
            <StarRating rating={Math.round(averageRating)} />
            <span>({book.reviews?.length || 0} reviews)</span>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-[#1a1a1a] mb-2">Description</h2>
            <p className="text-[#5c574c] whitespace-pre-line leading-relaxed text-base">{book.description}</p>
          </div>

          <div className="mt-14 pt-8 border-t border-[#e3ddd0]">
            <h2 className="text-2xl font-light tracking-tight mb-6">Reviews & Ratings</h2>
            
            {token ? (
              <form onSubmit={submitReview} className="mb-10 p-6 bg-white rounded-2xl border border-[#e3ddd0]">
                <h3 className="font-medium text-[#1a1a1a] mb-4">Leave a review</h3>
                {reviewMsg && <p className="mb-4 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded">{reviewMsg}</p>}
                <div className="mb-4 flex items-center gap-2 text-sm text-[#5c574c]">
                  <label>Rating:</label>
                  <select
                    value={userRating}
                    onChange={(e) => setUserRating(e.target.value)}
                    className="border border-[#d8d0c4] rounded px-2 py-1 bg-[#f7f4ee]"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Terrible</option>
                  </select>
                </div>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  rows={4}
                  className="w-full p-3 border border-[#d8d0c4] rounded bg-[#f7f4ee] text-[#1a1a1a] focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-colors"
                ></textarea>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="mt-4 rounded-full bg-[#1a1a1a] px-6 py-2 text-sm text-[#fdfbf7] hover:bg-black transition-colors"
                >
                  {reviewLoading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="mb-10 text-sm text-[#7a7265] border border-[#e3ddd0] p-4 rounded-lg bg-white">
                Please <Link to="/login" className="underline text-[#1a1a1a]">log in</Link> to write a review.
              </div>
            )}

            <div className="space-y-6">
              {!book.reviews || book.reviews.length === 0 ? (
                <p className="text-sm text-[#7a7265]">No reviews yet. Be the first to review this book!</p>
              ) : (
                [...book.reviews].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(review => (
                  <div key={review._id} className="border-b border-[#e3ddd0] pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#ebe6dc] flex items-center justify-center text-[#5c574c] font-medium text-xs">
                          {review.name ? review.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1a1a1a]">{review.name}</p>
                          <p className="text-xs text-[#9a9285]">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-[#5c574c] leading-relaxed mt-3">{review.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
