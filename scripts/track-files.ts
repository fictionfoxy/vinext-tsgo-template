import { execSync } from 'node:child_process'
import { watch, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'git-tracked-files.yaml')

function update(): void {
  const raw = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  const files = raw.trim().split('\n').filter(Boolean)

  const lines: string[] = [
    `# git-tracked files — auto-updated`,
    `# ${new Date().toISOString()}`,
    `count: ${files.length}`,
    `files:`,
    ...files.map((f) => `  - ${f}`),
    '',
  ]

  writeFileSync(OUT, lines.join('\n'))
  console.log(`[track-files] wrote ${files.length} files → ${OUT}`)
}

update()

let debounce: ReturnType<typeof setTimeout> | null = null

const watcher = watch(resolve(ROOT, '.git/index'), () => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(update, 200)
})

watcher.on('error', (err) => {
  console.error('[track-files] watcher error:', err)
})

process.on('SIGINT', () => {
  watcher.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  watcher.close()
  process.exit(0)
})
