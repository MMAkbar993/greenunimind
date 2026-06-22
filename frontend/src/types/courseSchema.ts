import { z } from "zod";

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long." })
    .max(100, { message: "Title must not exceed 100 characters." }),

  subTitle: z.string().optional(),

  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long." })
    .max(1000, { message: "Description must not exceed 1000 characters." }),

  categoryId: z
    .string()
    .min(1, { message: "Category is required." }),

  subcategoryId: z
    .string()
    .min(1, { message: "Subcategory is required." }),

  courseLevel: z.enum(["Beginner", "Intermediate", "Advanced"], {
    message: "Invalid course level.",
  }),

  coursePrice: z
    .number()
    .min(0, { message: "Price must be at least 0." })
    .max(10000, { message: "Price must not exceed 10,000." }),

  courseThumbnail: z
    .union([z.instanceof(File), z.string().url(), z.undefined()])
    .refine(
      (file) => {
        if (file instanceof File) {
          return file.size <= 5 * 1024 * 1024;
        }
        return true;
      },
      {
        message: "File must be less than 5MB",
      }
    )
    .optional(),
});
