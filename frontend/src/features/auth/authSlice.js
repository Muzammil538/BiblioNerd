import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

const tokenFromStorage = localStorage.getItem("token");

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password, phone }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Login failed");
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/auth/me");
      return data.user;
    } catch (e) {
      const status = e.response?.status;
      return rejectWithValue({
        message: e.response?.data?.message || e.message || "Could not load profile",
        status,
      });
    }
  },
  {
    condition: (_, { getState }) => Boolean(getState().auth.token),
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: tokenFromStorage,
    user: null,
    status: "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("token");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        const payload = action.payload;
        const status =
          payload && typeof payload === "object" ? payload.status : undefined;
        const message =
          payload && typeof payload === "object" ? payload.message : payload;
        state.status = "idle";
        state.error = message || "Session check failed";
        if (status === 401 || status === 403) {
          state.token = null;
          state.user = null;
          localStorage.removeItem("token");
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
