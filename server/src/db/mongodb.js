import mongoose from "mongoose";
import { DB_URI, ENABLE_ANALYTICS, NODE_ENV } from "../config/index.js";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    console.log("[MongoDB] Already connected.");
    return;
  }

  if (NODE_ENV === "development") {
    mongoose.set("debug", true);
  }

  if (!ENABLE_ANALYTICS) {
    if (!DB_URI) {
      console.log(
        "[MongoDB] Skipping MongoDB connection."
      );
      return;
    }
  } else {
    if (!DB_URI) {
      throw new Error(
        "[MongoDB]  no DB_URI is provided. Cannot connect to MongoDB."
      );
    }
  }

  mongoose.connection.on("connected", () => {
    console.log("[MongoDB] Connected successfully.");
  });

  mongoose.connection.on("error", (err) => {
    console.log(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("[MongoDB] Disconnected.");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Reconnected.");
  });

  try {
    await mongoose.connect(DB_URI);
  } catch (error) {
    console.error(`[MongoDB] Initial connection error: ${error.message}`);
    throw error;
  }
}

