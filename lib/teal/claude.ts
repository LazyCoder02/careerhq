/**
 * Tiny Claude (Anthropic Messages API) client used by Teal's coach.
 *
 * Calls the REST endpoint directly with fetch — no SDK to bundle into this
 * Next setup. Server-only: the API key never leaves the server.
 *
 * Env:
 *   ANTHROPIC_API_KEY  required to enable AI coaching; absent => callers fall back
 *   TEAL_MODEL         optional model id; defaults to claude-sonnet-4-6
 *                      (4.6-generation dateless ids are pinned snapshots, so this
 *                       is production-stable — see docs.claude.com models overview)
 *
 * Docs: https://docs.claude.com/en/api/messages
 */

const API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_VERSION = '2023-06-01'

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export interface ClaudeRequest {
  system: string
  prompt: string
  maxTokens?: number
  /** 0..1; lower = more deterministic. Coaching wants some structure, so default low. */
  temperature?: number
}

/** Send one user turn with a system prompt; returns the concatenated text output. */
export async function callClaude({
  system,
  prompt,
  maxTokens = 2000,
  temperature = 0.4,
}: ClaudeRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: process.env.TEAL_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(55_000),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`)
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> }
  return (data.content ?? [])
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('')
    .trim()
}

/**
 * Parse a JSON object out of a model response, tolerating ```json fences or
 * surrounding prose. Throws if no valid JSON object is found.
 */
export function parseJsonFromModel<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object in model output')
  return JSON.parse(candidate.slice(start, end + 1)) as T
}
