import type { ResolveRequest, ThemeScope } from '@/models/theme.model'

export type BuilderScopeRequest = ResolveRequest & { scope: ThemeScope }
