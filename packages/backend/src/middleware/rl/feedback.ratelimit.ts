import rateLimit from "express-rate-limit";

export const feedbackRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2,
  message: {
    error: "Too many feedback submissions from this IP. Please try again later.",
  },
  standardHeaders: true, 
  legacyHeaders: false,
});
