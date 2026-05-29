export const config = { runtime: 'edge' };

declare const process: { env: Record<string, string | undefined> };

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PuzzleContext {
  id: string;
  fen: string;
  sideToMove: 'w' | 'b';
  difficulty: number;
  theme: string;
  solutionMoves: string[];
  bestMoveSan: string;
  explanation: string;
  patternToRemember: string;
  howToSpot: string;
  beginnerMistake: string;
  hint1: string;
  hint2: string;
  hint3: string;
}

interface RequestBody {
  puzzle: PuzzleContext;
  messages: ChatMessage[];
  revealed?: boolean;
}

const MODEL = 'claude-haiku-4-5-20251001';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function buildSystemPrompt(p: PuzzleContext, revealed: boolean): string {
  const side = p.sideToMove === 'w' ? 'White' : 'Black';
  const answerPolicy = revealed
    ? 'The player has already solved or revealed this puzzle, so you may discuss the solution freely.'
    : "The player has NOT solved this puzzle yet. Do NOT state the full solution move outright unless they explicitly ask for the answer. Instead, nudge them with the right idea (checks, captures, threats; what is hanging; what is the opponent threatening). If they directly ask 'what is the answer', you may tell them.";

  return [
    'You are a warm, encouraging chess coach for a beginner rated about 400-500 on Chess.com.',
    'You help them answer questions about ONE specific puzzle (described below). Stay on this position.',
    'Speak simply. Avoid jargon, or explain it in plain words. Keep answers short (2-5 sentences).',
    'Always reinforce the core habit: "Checks, captures, threats. What is hanging? What is my opponent threatening?"',
    '',
    'GROUND TRUTH for this puzzle (treat as authoritative — never invent different moves):',
    `- Position (FEN): ${p.fen}`,
    `- Side to move: ${side}`,
    `- Theme: ${p.theme}`,
    `- Approx rating: ${p.difficulty}`,
    `- Correct line (SAN): ${p.solutionMoves.join(' ')}`,
    `- Best move: ${p.bestMoveSan}`,
    `- Why it works: ${p.explanation}`,
    `- Pattern to remember: ${p.patternToRemember}`,
    `- How to spot it: ${p.howToSpot}`,
    `- Common beginner mistake here: ${p.beginnerMistake}`,
    `- Hints (escalating): 1) ${p.hint1} 2) ${p.hint2} 3) ${p.hint3}`,
    '',
    answerPolicy,
    'If asked something unrelated to chess, gently steer back to the puzzle.',
  ].join('\n');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      { error: 'The coach is not configured yet. Set the ANTHROPIC_API_KEY environment variable.' },
      503,
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { puzzle, messages, revealed } = body;
  if (!puzzle || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'Missing puzzle or messages.' }, 400);
  }

  const trimmed = messages.slice(-12).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content).slice(0, 2000),
  }));

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: buildSystemPrompt(puzzle, Boolean(revealed)),
        messages: trimmed,
      }),
    });
  } catch {
    return json({ error: 'Could not reach the coach service. Try again.' }, 502);
  }

  if (!upstream.ok) {
    return json({ error: 'The coach service returned an error. Try again in a moment.' }, 502);
  }

  const data = (await upstream.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const reply =
    data.content
      ?.map((b) => b.text)
      .filter(Boolean)
      .join('\n')
      .trim() ?? '';

  if (!reply) return json({ error: 'The coach had nothing to say. Try rephrasing.' }, 502);

  return json({ reply });
}
