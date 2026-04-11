import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { load } from "@cashfreepayments/cashfree-js";
import { createCheckoutOrder, clearPaymentError } from "../features/payments/paymentSlice.js";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "₹299",
    cadence: "per month",
    blurb: "Full library access, billed monthly in INR.",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "₹2,499",
    cadence: "per year",
    blurb: "Best value for committed readers — about two months free.",
  },
];

export default function Payment() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const { status, error } = useSelector((state) => state.payments);
  const [phone, setPhone] = useState(user?.phone || "");
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

  async function startCheckout(plan) {
    setCheckoutError(null);
    dispatch(clearPaymentError());
    if (!token) {
      setCheckoutError("Please sign in to subscribe.");
      return;
    }
    const action = await dispatch(
      createCheckoutOrder({
        plan,
        customerPhone: phone.replace(/\D/g, "").slice(-10) || undefined,
      })
    );
    if (createCheckoutOrder.rejected.match(action)) {
      return;
    }
    const sessionId = action.payload.paymentSessionId;
    const orderId = action.payload.orderId;
    const mode =
      import.meta.env.VITE_CASHFREE_MODE === "production"
        ? "production"
        : "sandbox";
    try {
      const cashfree = await load({ mode });
      if (!cashfree || typeof cashfree.checkout !== "function") {
        setCheckoutError("Cashfree.js failed to load in this browser.");
        return;
      }
      const returnUrl = `${window.location.origin}/payment/return?order_id={order_id}`;
      const result = await cashfree.checkout({
        paymentSessionId: sessionId,
        returnUrl,
      });
      if (result?.error) {
        setCheckoutError(result.error.message || "Checkout could not start.");
      }
    } catch (e) {
      setCheckoutError(e.message || "Checkout error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="text-3xl md:text-4xl font-light tracking-tight text-center">
        Choose your membership
      </h1>
      <p className="text-center text-sm text-[#5c574c] mt-3 max-w-xl mx-auto">
        Sandbox checkout uses Cashfree test credentials. Amounts are charged in{" "}
        <span className="font-medium">INR</span>.
      </p>

      <div className="mt-10 max-w-md mx-auto">
        <label htmlFor="pay-phone" className="block text-xs uppercase tracking-wider text-[#7a7265] mb-1">
          Mobile for Cashfree (10 digits, optional)
        </label>
        <input
          id="pay-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9999999999"
          className="w-full rounded-md border border-[#d8d0c4] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
        />
      </div>

      {(error || checkoutError) && (
        <p className="mt-6 text-center text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 max-w-lg mx-auto">
          {error || checkoutError}
        </p>
      )}

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-[#e3ddd0] bg-white p-8 flex flex-col shadow-sm"
          >
            <h2 className="text-xl font-medium">{plan.name}</h2>
            <p className="mt-4 text-4xl font-light tracking-tight">{plan.price}</p>
            <p className="text-xs uppercase tracking-wider text-[#9a9285] mt-1">
              {plan.cadence}
            </p>
            <p className="mt-6 text-sm text-[#5c574c] leading-relaxed flex-1">
              {plan.blurb}
            </p>
            <button
              type="button"
              disabled={status === "loading"}
              onClick={() => startCheckout(plan.id)}
              className="mt-8 w-full rounded-full bg-[#1a1a1a] py-3 text-sm text-[#fdfbf7] hover:bg-black disabled:opacity-60 transition-colors"
            >
              {status === "loading" ? "Starting…" : "Pay with Cashfree"}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
