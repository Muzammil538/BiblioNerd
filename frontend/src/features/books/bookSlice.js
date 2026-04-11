import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

export const fetchBooks = createAsyncThunk(
  "books/fetchBooks",
  async ({ category = "all", search = "" } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (category && category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      const qs = params.toString();
      const { data } = await api.get(`/books${qs ? `?${qs}` : ""}`);
      return data.books;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Could not load books");
    }
  }
);

export const fetchTrending = createAsyncThunk(
  "books/fetchTrending",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/books/trending");
      return data.books;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Could not load trending");
    }
  }
);

export const fetchCategories = createAsyncThunk(
  "books/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/books/book-categories");
      return data.categories;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Could not load categories");
    }
  }
);

export const fetchReaderSession = createAsyncThunk(
  "books/fetchReaderSession",
  async (bookId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/books/${bookId}/read`);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Unable to open reader");
    }
  }
);

const bookSlice = createSlice({
  name: "books",
  initialState: {
    items: [],
    trending: [],
    categories: [],
    reader: { pdfUrl: null, title: "", expiresAt: null, status: "idle", error: null },
    status: "idle",
    error: null,
  },
  reducers: {
    clearReader(state) {
      state.reader = {
        pdfUrl: null,
        title: "",
        expiresAt: null,
        status: "idle",
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.items = [];
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTrending.rejected, (state) => {
        state.trending = [];
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.categories = [];
      })
      .addCase(fetchReaderSession.pending, (state) => {
        state.reader.status = "loading";
        state.reader.error = null;
      })
      .addCase(fetchReaderSession.fulfilled, (state, action) => {
        state.reader.status = "succeeded";
        state.reader.pdfUrl = action.payload.pdfUrl;
        state.reader.title = action.payload.title;
        state.reader.expiresAt = action.payload.expiresAt;
      })
      .addCase(fetchReaderSession.rejected, (state, action) => {
        state.reader.status = "failed";
        state.reader.error = action.payload;
      });
  },
});

export const { clearReader } = bookSlice.actions;
export default bookSlice.reducer;
