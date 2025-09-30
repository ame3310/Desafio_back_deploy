import mongoose from "mongoose";
import app from "./app";
import { env } from "@config/env";  

async function main() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error("Mongo connection error:", err);
    process.exit(1);
  }
}

main();
