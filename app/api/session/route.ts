import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/session
 * Creates a new chat session id (UUID).
 *
 * Anonymous users are allowed: no auth required.
 */
export async function POST() {
  const sessionId = randomUUID();

  // Persist session metadata (optional but useful for ops/debugging).
  const supabase = supabaseServer();
  const { error } = await supabase.from('chat_sessions').insert({ id: sessionId });
  if (error) {
    // We still return a session id even if the insert fails (resilient boot).
    // In production you might also log this to your observability stack.
    console.warn('Failed to insert chat session', error);
  }

  return NextResponse.json({ sessionId });
}

