import { z } from "zod";

export const registerSchema = z.object({
  name: z.object({
    firstName: z
      .string({ required_error: "First name is required" })
      .min(2, "At least 2 characters"),
    middleName: z.string().optional(),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(2, "At least 2 characters"),
  }),
  email: z.string({ required_error: "Email is required" }).email(),
  password: z
    .string({ invalid_type_error: "Password must be a valid string." })
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(20, { message: "Password must not exceed 20 characters." })
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]+$/,
      {
        message:
          "Password must include at least one letter, one number, and one special character.",
      }
    ),
  photoUrl: z
    .union([z.instanceof(File), z.undefined()])
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
      message: "File must be less than 5MB",
    }),
  gender: z.enum(["male", "female", "other"])
});


export const loginSchema = z.object({
  email: z.string({ required_error: "Email is required" }).email(),
  password: z
    .string({
      invalid_type_error: "Password must be a valid string.",
    })
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(20, { message: "Password must not exceed 20 characters." })
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]+$/,
      {
        message:
          "Password must include at least one letter, one number, and one special character.",
      }
    ),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(2, "At least 2 character required!").optional(),
  email: z.string().email().optional(),
});

export const stripeAccountSchema = z.object({
  stripeAccountId: z.string({ required_error: "Stripe Account ID is required" }),
  stripeEmail: z.string({ required_error: "Stripe Email is required" }).email("Invalid email format"),
});
