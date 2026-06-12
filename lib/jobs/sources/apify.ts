
const APIFY_API_BASE = 'https://api.apify.com/v2'

export interface ApifyRunOptions {

  actorId: string
  input: Record<string, unknown>
  timeoutMs?: number
}

export function hasApifyToken(): boolean {
  return Boolean(process.env.APIFY_TOKEN)
}
export async function runApifyActor<T>({
  actorId,
  input,
  timeoutMs = 280_000,
}: ApifyRunOptions): Promise<T[]> {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error('APIFY_TOKEN is not set')
  const endpoint = `${APIFY_API_BASE}/acts/${actorId}/run-sync-get-dataset-items`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Apify actor ${actorId} responded ${res.status} ${res.statusText} ${detail}`.trim(),
    )
  }

  return (await res.json()) as T[]
}
