import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Document, Page, pdfjs } from "react-pdf";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  fetchReaderSession,
  clearReader,
} from "../features/books/bookSlice.js";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default function BookReader() {
  const { bookId } = useParams();
  const dispatch = useDispatch();
  const { reader } = useSelector((state) => state.books);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [docWidth, setDocWidth] = useState(520);

  useEffect(() => {
    function onResize() {
      const w = Math.min(window.innerWidth - 48, 720);
      setDocWidth(Math.max(280, w));
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "PrintScreen") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    dispatch(fetchReaderSession(bookId));
    return () => {
      dispatch(clearReader());
    };
  }, [dispatch, bookId]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    setPageNumber(1);
  }, []);

  if (reader.status === "loading" || reader.status === "idle") {
    return (
      <div className="reader-paper min-h-[70vh] flex items-center justify-center text-sm text-[#7a7265]">
        Preparing your book…
      </div>
    );
  }

  if (reader.status === "failed") {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-sm text-red-800">{reader.error}</p>
        <Link
          to="/pricing"
          className="mt-6 inline-block text-sm underline underline-offset-4"
        >
          View subscription plans
        </Link>
        <div className="mt-4">
          <Link to="/" className="text-sm text-[#5c574c]">
            ← Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="reader-paper no-screenshot min-h-screen border-t border-[#e3ddd0]"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
    >
      <div className="sticky top-[73px] z-30 border-b border-[#e3ddd0] bg-[#fdfbf7]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a9285]">
              Reader
            </p>
            <h1 className="text-lg font-medium leading-tight">{reader.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="rounded-full border border-[#d8d0c4] px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-[#5c574c] tabular-nums">
              {pageNumber}
              {numPages ? ` / ${numPages}` : ""}
            </span>
            <button
              type="button"
              disabled={!numPages || pageNumber >= numPages}
              onClick={() =>
                setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p))
              }
              className="rounded-full border border-[#d8d0c4] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <Link to="/" className="text-xs text-[#7a7265] hover:text-[#1a1a1a]">
            Close
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 flex justify-center">
        <Document
          file={reader.pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <p className="text-sm text-[#7a7265]">Rendering pages…</p>
          }
          error={
            <p className="text-sm text-red-800">
              This signed link may have expired. Return to the library and open
              the title again.
            </p>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={docWidth}
            renderTextLayer
            renderAnnotationLayer
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}
