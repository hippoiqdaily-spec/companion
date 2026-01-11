import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/messages?sessionId=...
 * Returns all messages for a session (for page refresh / reload).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  const parsed = z.string().uuid().safeParse(sessionId);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, session_id, role, content, created_at')
    .eq('session_id', parsed.data)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

