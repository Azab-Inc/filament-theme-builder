import { describe, expect, it } from 'vitest'
import { ONBOARDING_TOUR_STEPS } from '@/tour/onboarding-tour-manifest'
import {
  ONBOARDING_TOUR_STORAGE_KEY,
  readOnboardingTourCompletion,
  writeOnboardingTourCompletion,
} from '@/utils/onboarding-tour-storage'

describe('onboarding tour completion storage', () => {
  it('keeps the seven-step manifest ordered and anchored', () => {
    expect(ONBOARDING_TOUR_STEPS.map(({ id }) => id)).toEqual([
      'welcome', 'editor-navigation', 'foundations', 'inspector', 'live-preview', 'themes-exports', 'finish',
    ])
    expect(ONBOARDING_TOUR_STEPS.every(({ selector, title, description }) => selector.startsWith('[data-tour=') && title && description)).toBe(true)
  })

  it('shows where Inspector is before discussing preview navigation', () => {
    const inspector = ONBOARDING_TOUR_STEPS[3]!
    expect(inspector.selector).toBe('[data-tour="inspector"]')
    expect(inspector.description).toContain('top toolbar')
  })

  it('explains local theme retention and the upcoming Composer package at the finish', () => {
    const finish = ONBOARDING_TOUR_STEPS[6]!
    expect(finish.description).toContain('theme changes')
    expect(finish.description).toContain("this browser’s local storage")
    expect(finish.description).toContain('Export')
    expect(finish.description).toContain('Composer package')
    expect(finish.description).toContain('coming soon')
  })

  it('accepts only the current version and ignores malformed values', () => {
    localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, '{"schemaVersion":1,"completedAt":"2026-11-19T00:00:00.000Z"}')
    expect(readOnboardingTourCompletion()).toBe(true)

    localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, '{"schemaVersion":0}')
    expect(readOnboardingTourCompletion()).toBe(false)
    localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, 'not-json')
    expect(readOnboardingTourCompletion()).toBe(false)
    localStorage.setItem(ONBOARDING_TOUR_STORAGE_KEY, '{"schemaVersion":1,"completedAt":"not-a-date"}')
    expect(readOnboardingTourCompletion()).toBe(false)
  })

  it('fails safely when the default localStorage getter throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => { throw new Error('blocked') } })
    try {
      expect(readOnboardingTourCompletion()).toBe(false)
      expect(() => writeOnboardingTourCompletion()).not.toThrow()
    } finally {
      if (descriptor) Object.defineProperty(window, 'localStorage', descriptor)
    }
  })

  it('writes isolated completion without touching theme storage', () => {
    localStorage.setItem('ftb-theme-state', 'theme-fixture')
    writeOnboardingTourCompletion()
    expect(readOnboardingTourCompletion()).toBe(true)
    expect(localStorage.getItem('ftb-theme-state')).toBe('theme-fixture')
  })
})
