'use client';

import { useChat, type Message } from '@ai-sdk/react';
import { useEffect, useMemo, useRef, useState } from 'react';

type DbMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

const SESSION_STORAGE_KEY = 'ai-companion:session-id';

export function Chat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // `useChat` handles streaming UI updates for assistant messages.
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } =
    useChat({
      api: '/api/chat',
      /**
       * Our backend contract is intentionally simple:
       *   { sessionId, message }
       *
       * `useChat` normally sends a richer payload (messages, id, etc),
       * so we adapt it here to match the required shape.
       */
      experimental_prepareRequestBody: ({ messages }) => {
        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content;
        return {
          sessionId,
          message: lastUserMessage ?? ''
        };
      }
    });

  const isReady = useMemo(() => Boolean(sessionId) && !isBooting, [sessionId, isBooting]);

  // Create (or restore) a session_id with no auth required.
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const existing = localStorage.getItem(SESSION_STORAGE_KEY);
        if (existing) {
          setSessionId(existing);
          return;
        }

        const res = await fetch('/api/session', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to create session');

        const data: { sessionId: string } = await res.json();
        localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
        if (!cancelled) setSessionId(data.sessionId);
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load existing messages for this session (so refresh works).
  useEffect(() => {
    let cancelled = false;
    if (!sessionId) return;
    const sid = sessionId;

    async function loadHistory() {
      const res = await fetch(`/api/messages?sessionId=${encodeURIComponent(sid)}`);
      if (!res.ok) return;

      const data: { messages: DbMessage[] } = await res.json();
      if (cancelled) return;

      const asAiMessages: Message[] = data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content
      }));
      setMessages(asAiMessages);
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [sessionId, setMessages]);

  // Auto-scroll to the bottom as new tokens stream in.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <div className="messages" aria-live="polite">
        {messages.length === 0 ? (
          <div className="muted">
            Say hi! This is a minimal chat UI with streaming responses.
          </div>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          if (!isReady) return;
          handleSubmit(e);
        }}
      >
        <input
          className="input"
          value={input}
          onChange={handleInputChange}
          placeholder={isReady ? 'Type a message…' : 'Starting session…'}
          disabled={!isReady || isLoading}
          aria-label="Message"
        />
        <button className="button" type="submit" disabled={!isReady || isLoading || !input.trim()}>
          Send
        </button>
      </form>

      <div className="muted" style={{ marginTop: 10 }}>
        <div>
          <strong>session_id</strong>: {sessionId ?? '…'}
        </div>
      </div>
    </>
  );
}

