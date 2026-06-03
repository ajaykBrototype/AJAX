import { z } from "zod";

export const signupSchema = z
  .object({
   name: z
  .string()
  .trim()
  .min(3, "Name must be at least 3 characters")
  .regex(
    /^[A-Za-z]+(?: [A-Za-z]+)*$/,
    "Name must contain only letters and single spaces"
  ),

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


      referralCode: z
      .string()
      .optional()


  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });