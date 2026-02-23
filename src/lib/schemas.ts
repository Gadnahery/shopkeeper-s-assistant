import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  buying_price: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  stock: z.coerce.number().min(0),
});

export const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});
