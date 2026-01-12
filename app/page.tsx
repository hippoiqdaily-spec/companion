import { Chat } from '../components/Chat';

export default function Page() {
  return (
    <main className="card">
      <div className="header">
        <div>
          <div style={{ fontSize: 18, fontWeight: 650 }}>AI Companion</div>
          <div className="muted">Anonymous chat · Messages stored in Supabase</div>
        </div>
      </div>

      <Chat />
    </main>
  );
}

