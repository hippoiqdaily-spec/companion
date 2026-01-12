import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { supabaseServer } from '../../../lib/supabase/server';
import { CreateChatSchema } from '../../../lib/validation';
import { getEnv } from '../../../lib/env';

export const runtime = 'nodejs';

/**
 * POST /api/chat
 * Body: { sessionId, message }
 *
 * - Stores the user message in Supabase
 * - Streams the assistant response from OpenAI (Vercel AI SDK)
 * - Stores the final assistant message in Supabase when streaming finishes
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CreateChatSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sessionId, message } = parsed.data;
  const supabase = supabaseServer();

  // Load recent history to give the model context.
  // Keep it small to reduce latency/cost.
  const { data: history, error: historyError } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(24);

  if (historyError) {
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 });
  }

  // Store the user message immediately.
  const { error: insertUserError } = await supabase.from('chat_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: message
  });

  if (insertUserError) {
    return NextResponse.json({ error: 'Failed to store user message' }, { status: 500 });
  }

  const systemPrompt =
    'You are an AI companion. Be helpful, friendly, concise, and ask clarifying questions when needed.';

  const env = getEnv();

  // Create a typed OpenAI provider instance with your API key.
  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  const model = openai(env.OPENAI_MODEL ?? 'gpt-4o-mini');

  const result = streamText({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ],
    onFinish: async ({ text }) => {
      // Store the assistant message once we have the full final text.
      // This happens after streaming completes.
      const { error } = await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: text
      });
      if (error) console.warn('Failed to store assistant message', error);
    }
  });

  // Vercel AI SDK response helper for Next.js (App Router).
  return result.toDataStreamResponse();
}

