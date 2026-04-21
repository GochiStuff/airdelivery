import { Request, Response } from "express";
import Feedback from "../model/feedback.model.js";
import { ResponseHandler } from "../utils/ResponseHandler.js";
import { z } from "zod";

const FeedbackSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  type: z.string().optional(),
  message: z.string().min(10),
});

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const result = FeedbackSchema.safeParse(req.body);
    
    if (!result.success) {
      return ResponseHandler.error(res, "Validation failed", result.error.format(), 400);
    }

    const feedback = new Feedback(result.data);
    await feedback.save();

    return ResponseHandler.success(res, null, "Thanks! We've received your feedback.", 201);
  } catch (error) {
    console.error("Feedback submission error:", error);
    return ResponseHandler.error(res, "Something went wrong. Please try again later.");
  }
};
