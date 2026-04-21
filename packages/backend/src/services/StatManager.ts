import { Stat } from "../model/stats.model.js";
import logger from "../utils/logger.js";

export class StatManager {
  private buffer = {
    totalFlights: 0,
    totalFilesShared: 0,
    totalMBTransferred: 0,
  };
  private flushInterval: Timer;

  constructor(intervalMs: number = 30000) {
    this.flushInterval = setInterval(() => this.flush(), intervalMs);
  }

  incFlights() {
    this.buffer.totalFlights++;
  }

  incStats(files: number, mb: number) {
    this.buffer.totalFilesShared += files;
    this.buffer.totalMBTransferred += mb;
  }

  async flush() {
    if (this.buffer.totalFlights === 0 && 
        this.buffer.totalFilesShared === 0 && 
        this.buffer.totalMBTransferred === 0) {
      return;
    }

    const update = { ...this.buffer };
    // Clear buffer immediately to prevent double-counting
    this.buffer = { totalFlights: 0, totalFilesShared: 0, totalMBTransferred: 0 };

    try {
      if (process.env.DB_URI) {
        await Stat.updateOne(
          { date: { $gte: new Date().setHours(0, 0, 0, 0) } },
          {
            $inc: {
              totalFlights: update.totalFlights,
              totalFilesShared: update.totalFilesShared,
              totalMBTransferred: update.totalMBTransferred,
            },
          },
          { upsert: true }
        ).exec();
        logger.debug("StatManager", "Stats flushed to DB", update);
      }
    } catch (error) {
      logger.error("StatManager", "Failed to flush stats", { error, update });
      // Restore buffer on failure? (Maybe not for stats to avoid infinite loop)
    }
  }

  stop() {
    clearInterval(this.flushInterval);
    return this.flush();
  }
}
