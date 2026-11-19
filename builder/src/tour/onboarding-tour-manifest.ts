import type { OnboardingTourStep } from '@/models/onboarding-tour-step.model'

export const ONBOARDING_TOUR_STEPS: readonly OnboardingTourStep[] = [
  { id: 'welcome', selector: '[data-tour="welcome"]', title: 'Welcome to the Theme Builder', description: 'Adjust your theme and see changes apply to the live preview immediately.' },
  { id: 'editor-navigation', selector: '[data-tour="editor-navigation"]', title: 'Find your way around', description: 'Use Foundations, Components, Branding, Icons, and Inspector to edit the builder.' },
  { id: 'foundations', selector: '[data-tour="foundations"]', title: 'Start with foundations', description: 'Set palette, surfaces, typography, spacing, density, radius, borders, and shadows.' },
  { id: 'live-preview', selector: '[data-tour="live-preview"]', title: 'See the live preview', description: 'This is a real Filament 5.9 preview. Navigation is safe while Inspector is off.' },
  { id: 'inspector', selector: '[data-tour="inspector"]', title: 'Inspect preview elements', description: 'Turn on Inspector to hover or click an element, including its raw-element fallback. Turn it off for normal interaction.' },
  { id: 'themes-exports', selector: '[data-tour="tools"]', title: 'Manage and export themes', description: 'Tools contains theme management and replay. Export provides JSON, CSS, and PHP outputs; Save theme stores your work.' },
  { id: 'finish', selector: '[data-tour="finish"]', title: 'You are ready to build', description: 'Edit foundations, inspect the preview, then save or export. Use Tools > Take a tour to replay this guide.' },
]
