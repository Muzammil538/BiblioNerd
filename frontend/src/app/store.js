import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import booksReducer from "../features/books/bookSlice.js";
import paymentsReducer from "../features/payments/paymentSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    payments: paymentsReducer,
  },
});
