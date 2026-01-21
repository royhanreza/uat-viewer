import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function parseDotEnv(dotenvText) {
  for (const rawLine of dotenvText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // Do not override env vars already set by the shell.
    if (process.env[key] === undefined) process.env[key] = value
  }
}

async function loadEnvFromFile(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8')
    parseDotEnv(text)
  } catch {
    // ignore (file missing)
  }
}

function normalizeSteps(testSteps) {
  if (Array.isArray(testSteps)) return testSteps
  if (typeof testSteps === 'string') {
    return testSteps
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
  }
  return []
}

function stepsToText(testSteps) {
  return normalizeSteps(testSteps).join('\n')
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const root = path.resolve(__dirname, '..')

  await loadEnvFromFile(path.join(root, '.env'))
  await loadEnvFromFile(path.join(root, '.env.local'))

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  const table = process.env.VITE_SUPABASE_TABLE || 'uat'
  const batchSize = Number(process.env.UAT_IMPORT_BATCH_SIZE || 200)
  const stepsAs = (process.env.UAT_TEST_STEPS_AS || 'array').toLowerCase()
  const importMode = (process.env.UAT_IMPORT_MODE || 'insert').toLowerCase() // insert | upsert
  const conflictColumn = process.env.UAT_IMPORT_CONFLICT || 'case_id'

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Missing VITE_SUPABASE_URL and/or API key. ' +
        'Set SUPABASE_SERVICE_ROLE_KEY (recommended for imports) or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY. ' +
        'Create a .env file (copy from env.example) or set env vars in your shell.',
    )
    process.exit(1)
  }

  const jsonPath = path.join(root, 'src', 'data', 'aerplus.json')
  const raw = await fs.readFile(jsonPath, 'utf8')
  const rows = JSON.parse(raw)

  if (!Array.isArray(rows)) {
    throw new Error('Expected aerplus.json to be an array of objects.')
  }

  const transformed = rows.map(r => ({
    ...r,
    test_steps: stepsAs === 'text' ? stepsToText(r.test_steps) : normalizeSteps(r.test_steps),
  }))

  const batches = chunk(transformed, Math.max(1, batchSize))

  console.log(
    `Importing ${transformed.length} rows into "${table}" in batches of ${Math.max(1, batchSize)}...` +
      ` (mode: ${importMode})`,
  )

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    const baseEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}`
    const endpoint =
      importMode === 'upsert'
        ? `${baseEndpoint}?on_conflict=${encodeURIComponent(conflictColumn)}`
        : baseEndpoint

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer:
          importMode === 'upsert'
            ? 'resolution=merge-duplicates,return=minimal'
            : 'return=minimal',
      },
      body: JSON.stringify(batch),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        `Import failed at batch ${i + 1}/${batches.length} (HTTP ${res.status}).\n` +
          `${text}\n\n` +
          `Common causes:\n` +
          `- RLS/policy blocks INSERT/UPSERT for anon key (use SUPABASE_SERVICE_ROLE_KEY or adjust policies)\n` +
          `- Column types don't match (e.g. test_steps)\n` +
          `- If using upsert: "${conflictColumn}" must have UNIQUE/PRIMARY KEY constraint\n`,
      )
    }

    const done = Math.min((i + 1) * Math.max(1, batchSize), transformed.length)
    console.log(`OK ${done}/${transformed.length}`)
  }

  console.log('Done.')
}

main().catch(err => {
  console.error(err?.stack || String(err))
  process.exit(1)
})

