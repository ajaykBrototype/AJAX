import { z } from "zod";

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name is too long"),

    email: z
      .string()
      .trim()
      .email("Invalid email address"),

    password: z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(/[A-Z]/, "Must include uppercase letter")
  .regex(/[0-9]/, "Must include a number"),
  
    confirmPassword: z
      .string()
      .min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });