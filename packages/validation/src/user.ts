import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

/** Cambio de email desde Ajustes: la contraseña actual solo si la cuenta tiene. */
export const updateEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  currentPassword: z.string().optional(),
});

/** Cambio (o creación) de contraseña desde Ajustes. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'The passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
