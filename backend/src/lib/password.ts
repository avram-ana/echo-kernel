import { z } from "zod";

/** Strong password rules for registration, reset, and change. */
export const strongPasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const newPasswordBodySchema = z
  .object({
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const r = strongPasswordSchema.safeParse(data.newPassword);
    if (!r.success) {
      for (const issue of r.error.issues) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message, path: ["newPassword"] });
      }
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const r = strongPasswordSchema.safeParse(data.newPassword);
    if (!r.success) {
      for (const issue of r.error.issues) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message, path: ["newPassword"] });
      }
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
    }
  });
