import Feedback from "../model/feedback.model.js"


export const submitFeedback = async (req, res) => {
    try {

    const { name, email, type, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const feedback = new Feedback({
      name,
      email,
      type,
      message,
    });

    await feedback.save();

    res.status(201).json({ message: "Thanks! We've received your feedback." });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
};