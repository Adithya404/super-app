import { z } from "zod";

const messagePartSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

export const postChatRequestSchema = z.object({
  id: z.string().min(1),
  message: z.object({
    id: z.string().min(1),
    role: z.literal("user"),
    parts: z.array(messagePartSchema).min(1),
  }),
});

export type PostChatRequest = z.infer<typeof postChatRequestSchema>;
