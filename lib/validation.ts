import { z } from 'zod';

export const CreateChatSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(8000)
});

