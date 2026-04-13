
import z from "zod";

export const adminLoginSchema=z.object({
    email:z.string().trim().min(1,"email is required"),
      password: z
    .string()
    .min(6, "Password is required")

})