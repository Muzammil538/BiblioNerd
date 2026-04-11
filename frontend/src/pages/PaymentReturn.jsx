import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrderStatus,
  clearPaymentError,
} from "../features/payments/paymentSlice.js";
import { fetchMe } from "../features/auth/authSlice.js";

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { orderDetails, error } = useSelector((state) => state.payments);
  const [localError, setLocalError] = useState(null);

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    dispatch(clearPaymentError());
    if (!orderId) {
      setLocalError("Missing order reference in the return URL.");
      return;
    }
    dispatch(fetchOrderStatus(orderId)).then((action) => {
      if (fetchOrderStatus.fulfilled.match(action)) {
        dispatch(fetchMe());
      }
    });
  }, [dispatch, orderId]);

  const paid =
    orderDetails?.transaction?.status === "paid" ||
    orderDetails?.provider?.order_status === "PAID";

  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <h1 className="text-2xl font-light tracking-tight">Payment status</h1>
      {(localError || error) && (
        <p className="mt-6 text-sm text-red-700">{localError || error}</p>
      )}
      {!localError && !orderDetails && (
        <p className="mt-6 text-sm text-[#7a7265]">Confirming your payment…</p>
      )}
      {orderDetails && (
        <div className="mt-8 space-y-3 text-left text-sm border border-[#e3ddd0] rounded-lg p-6 bg-white">
          <p>
            <span className="text-[#7a7265]">Order</span>{" "}
            <span className="font-mono text-xs">{orderId}</span>
          </p>
          <p>
            <span className="text-[#7a7265]">Recorded status</span>{" "}
            <span className="font-medium">
              {orderDetails.transaction?.status}
            </span>
          </p>
          {orderDetails.provider?.order_status && (
            <p>
              <span className="text-[#7a7265]">Cashfree status</span>{" "}
              <span className="font-medium">
                {orderDetails.provider.order_status}
              </span>
            </p>
          )}
          {paid && (
            <p className="text-emerald-800 pt-2">
              Your subscription is active. Thank you for supporting BiblioNerd.
            </p>
          )}
        </div>
      )}
      <div className="mt-10 flex flex-col gap-3">
        <Link
          to="/dashboard"
          className="inline-flex justify-center rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm text-[#fdfbf7]"
        >
          View subscription
        </Link>
        <Link to="/" className="text-sm text-[#5c574c] underline underline-offset-4">
          Back to library
        </Link>
      </div>
    </div>
  );
}
