import { promises as fs } from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), '.data')

function tablePath(name: string): string {
  return path.join(DATA_DIR, `${name}.json`)
}

export async function saveTable<T>(name: string, rows: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(tablePath(name), JSON.stringify(rows, null, 2), 'utf8')
}

export async function loadTable<T>(name: string, seed: T[] = []): Promise<T[]> {
  try {
    const raw = await fs.readFile(tablePath(name), 'utf8')
    return JSON.parse(raw) as T[]
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      if (seed.length) await saveTable(name, seed)
      return [...seed]
    }
    throw err
  }
}

/** Stable, collision-free id for new records. */
export function newId(): string {
  return globalThis.crypto.randomUUID()
}
