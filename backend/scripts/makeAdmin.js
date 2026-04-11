import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("Usage: node scripts/makeAdmin.js user@example.com");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error("User not found for email:", email);
    process.exit(1);
  }
  user.role = "admin";
  await user.save();
  console.log("Updated role to admin for:", email);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
