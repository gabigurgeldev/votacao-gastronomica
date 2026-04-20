import { z } from "zod";
import { isValidCPF, sanitizeCPF, sanitizePhone } from "./cpf";

export const scoreSchema = z.coerce
  .number()
  .int("A nota deve ser um número inteiro.")
  .min(5, "Nota mínima é 5.")
  .max(10, "Nota máxima é 10.");

export const voterRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido."),
  phone: z
    .string()
    .trim()
    .transform(sanitizePhone)
    .refine((v) => v.length >= 10 && v.length <= 11, {
      message: "Telefone deve ter DDD + número (10 ou 11 dígitos).",
    }),
  cpf: z
    .string()
    .trim()
    .transform(sanitizeCPF)
    .refine(isValidCPF, { message: "CPF inválido." }),
});

export type VoterRegistrationInput = z.infer<typeof voterRegistrationSchema>;

export const publicVoteSchema = z.object({
  dishId: z.string().uuid("Prato inválido."),
  scores: z
    .array(
      z.object({
        categoryId: z.string().uuid(),
        score: scoreSchema,
      }),
    )
    .min(1, "Avalie pelo menos uma categoria."),
  voter: voterRegistrationSchema,
});

export type PublicVoteInput = z.infer<typeof publicVoteSchema>;

export const juryVoteSchema = z.object({
  dishId: z.string().uuid(),
  scores: z
    .array(
      z.object({
        categoryId: z.string().uuid(),
        score: scoreSchema,
      }),
    )
    .min(1),
});

export type JuryVoteInput = z.infer<typeof juryVoteSchema>;

export const dishFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do prato.").max(120),
  description: z.string().trim().max(800).optional().nullable(),
  display_order: z.coerce.number().int().min(0).default(0),
  active: z.coerce.boolean().default(true),
  image_url: z.string().url().optional().nullable(),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(80),
  description: z.string().trim().max(400).optional().nullable(),
  display_order: z.coerce.number().int().min(0).default(0),
  active: z.coerce.boolean().default(true),
});

export const juryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres.")
    .max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(6, "Informe sua senha."),
});
