import { describe, expect, it } from 'vitest'
import type { OperationResultStatusDto } from '@/dtos/theme-relay.dto'

describe('operation result status DTO', () => {
  it('requires version, operation identity, kind, and exact lifecycle status', () => {
    const status: OperationResultStatusDto = {
      version: 1,
      operationId: 'a'.repeat(64),
      kind: 'import',
      status: 'approved',
      recordId: 'theme_42',
    }
    expect(Object.keys(status)).toEqual(['version', 'operationId', 'kind', 'status', 'recordId'])
  })
})
