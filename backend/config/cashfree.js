import { Cashfree, CFEnvironment } from "cashfree-pg";

let client = null;

export function getCashfreeClient() {
  if (!client) {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error(
        "CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET are required for payments"
      );
    }
    const env =
      process.env.CASHFREE_ENV === "production"
        ? CFEnvironment.PRODUCTION
        : CFEnvironment.SANDBOX;
    client = new Cashfree(env, clientId, clientSecret);
  }
  return client;
}
