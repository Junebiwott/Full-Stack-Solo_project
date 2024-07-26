import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

// Middleware to make sure only admin is allowed
export const adminOnly = TryCatch(async (req: Request, _res: Response, next: NextFunction) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("Please log in first", 401));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Invalid ID provided", 401));
  if (user.role !== "admin")
    return next(new ErrorHandler("You do not have admin privileges", 403));

  next();
});
