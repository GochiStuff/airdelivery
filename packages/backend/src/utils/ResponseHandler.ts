import { Response } from "express";

export class ResponseHandler {
  static success(res: Response, data: any, message: string = "Success", status: number = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message: string = "Something went wrong", error: any = null, status: number = 500) {
    return res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
}
