import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.js";

export const createCheckoutOrder = createAsyncThunk(
  "payments/createCheckoutOrder",
  async ({ plan, customerPhone }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/payments/create-order", {
        plan,
        customerPhone,
      });
      return data;
    } catch (e) {
      return rejectWithValue(
        e.response?.data?.message || "Could not start checkout"
      );
    }
  }
);

export const fetchOrderStatus = createAsyncThunk(
  "payments/fetchOrderStatus",
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/payments/order/${orderId}`);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Order lookup failed");
    }
  }
);

const paymentSlice = createSlice({
  name: "payments",
  initialState: {
    lastSession: null,
    lastOrderId: null,
    orderDetails: null,
    status: "idle",
    error: null,
  },
  reducers: {
    clearPaymentError(state) {
      state.error = null;
    },
    resetCheckout(state) {
      state.lastSession = null;
      state.lastOrderId = null;
      state.orderDetails = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCheckoutOrder.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createCheckoutOrder.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastSession = action.payload.paymentSessionId;
        state.lastOrderId = action.payload.orderId;
      })
      .addCase(createCheckoutOrder.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchOrderStatus.fulfilled, (state, action) => {
        state.orderDetails = action.payload;
      })
      .addCase(fetchOrderStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearPaymentError, resetCheckout } = paymentSlice.actions;
export default paymentSlice.reducer;
