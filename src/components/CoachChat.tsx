import { useEffect, useRef, useState } from 'react';
import type { Puzzle } from '../types/puzzle';

interface CoachChatProps {
  puzzle: Puzzle;
  revealed: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'Why is this the best move?',
  'What should I be looking for here?',
  'What am I missing?',
];

function puzzleContext(p: Puzzle) {
  return {
    id: p.id,
    fen: p.fen,
    sideToMove: p.sideToMove,
    difficulty: p.difficulty,
    theme: p.theme,
    solutionMoves: p.solutionMoves,
    bestMoveSan: p.bestMoveSan,
    explanation: p.explanation,
    patternToRemember: p.patternToRemember,
    howToSpot: p.howToSpot,
    beginnerMistake: p.beginnerMistake,
    hint1: p.hint1,
    hint2: p.hint2,
    hint3: p.hint3,
  };
}

export function CoachChat({ puzzle, revealed }: CoachChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Fresh conversation whenever the puzzle changes.
  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput('');
  }, [puzzle.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          puzzle: puzzleContext(puzzle),
          messages: nextMessages,
          revealed,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { reply?: string; error?: string }
        | null;
      if (!res.ok || !data?.reply) {
        setError(data?.error ?? 'The coach is unavailable right now.');
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply as string }]);
    } catch {
      setError('Could not reach the coach. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <section className="panel coach-chat">
      <button
        type="button"
        className="coach-chat-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>
          <span className="coach-chat-dot" aria-hidden="true">
            ♟
          </span>
          Ask the coach about this puzzle
        </span>
        <span className="coach-chat-toggle">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="coach-chat-body">
          <div className="coach-chat-log" ref={scrollRef}>
            {messages.length === 0 && !loading && (
              <div className="coach-chat-empty">
                <p>Stuck or curious? Ask anything about the position.</p>
                <div className="coach-chat-starters">
                  {STARTERS.map((s) => (
                    <button key={s} type="button" className="chip" onClick={() => void send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`coach-msg ${m.role}`}>
                {m.content}
              </div>
            ))}

            {loading && <div className="coach-msg assistant pending">Thinking…</div>}
            {error && <div className="coach-chat-error">{error}</div>}
          </div>

          <form className="coach-chat-input" onSubmit={onSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this puzzle…"
              disabled={loading}
              aria-label="Ask the coach a question"
            />
            <button type="submit" className="btn primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

export default CoachChat;
