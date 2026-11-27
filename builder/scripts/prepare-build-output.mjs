import { accessSync, constants, existsSync, lstatSync, readdirSync, renameSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export function prepareBuildOutput(outputPath = 'dist') {
  if (!existsSync(outputPath)) return
  const metadata = lstatSync(outputPath)
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) throw new Error(`Build output must be a real directory: ${outputPath}`)
  if (!containsBlockedDirectory(outputPath)) return
  renameSync(outputPath, `${outputPath}.previous-${process.pid}`)
}

function containsBlockedDirectory(path) {
  try { accessSync(path, constants.W_OK) } catch { return true }
  return readdirSync(path, { withFileTypes: true }).some((entry) => {
    const child = `${path}/${entry.name}`
    if (entry.isSymbolicLink()) throw new Error(`Build output contains an unsafe symlink: ${child}`)
    if (!entry.isDirectory()) return false
    const metadata = lstatSync(child)
    if (metadata.isSymbolicLink()) throw new Error(`Build output contains an unsafe symlink: ${child}`)
    return containsBlockedDirectory(child)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && !process.argv.some((argument) => argument === '--outDir' || argument.startsWith('--outDir='))) prepareBuildOutput()
