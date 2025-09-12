import mongoose from "mongoose";

const statSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalFlights: { type: Number, default: 0 },
  totalFilesShared: { type: Number, default: 0 },
  totalMBTransferred: { type: Number, default: 0 }, 
});

export const Stat = mongoose.model("Stat", statSchema);
