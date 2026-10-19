export function themeStateRevision(value: unknown): number {
  const serialized = JSON.stringify(value)
  let left = 0x811c9dc5
  let right = 0x9e3779b9
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index)
    left = Math.imul(left ^ code, 0x01000193) >>> 0
    right = Math.imul(right ^ code, 0x85ebca6b) >>> 0
  }
  return (left & 0x1fffff) * 0x1_0000_0000 + right
}
