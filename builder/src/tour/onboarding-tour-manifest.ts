import type { OnboardingTourStep } from '@/models/onboarding-tour-step.model'

export const ONBOARDING_TOUR_STEPS: readonly OnboardingTourStep[] = [
  { id: 'welcome', selector: '[data-tour="welcome"]', title: 'Welcome to the Theme Builder', description: 'Adjust your theme and see changes apply to the live preview immediately.' },
  { id: 'editor-navigation', selector: '[data-tour="editor-navigation"]', title: 'Find your way around', description: 'Use Foundations, Components, Branding, Icons, and Inspector to edit the builder.' },
  { id: 'foundations', selector: '[data-tour="foundations"]', title: 'Start with foundations', description: 'Set palette, surfaces, typography, spacing, density, radius, borders, and shadows.' },
  { id: 'inspector', selector: '[data-tour="inspector"]', title: 'Find the Inspector', description: 'Turn on this Inspector button in the top toolbar, then hover or click a preview element to inspect it. Raw-element fallback covers unrecognized elements. Turn Inspector off for normal interaction.' },
  { id: 'live-preview', selector: '[data-tour="live-preview"]', title: 'See the live preview', description: 'This is a real Filament 5.9 preview. Keep Inspector off to navigate and interact normally.' },
  { id: 'themes-exports', selector: '[data-tour="tools"]', title: 'Manage and export themes', description: 'Tools contains theme management and replay. Export provides JSON, CSS, and PHP outputs; Save theme stores your work.' },
  { id: 'finish', selector: '[data-tour="finish"]', title: 'You are ready to build', description: 'Your theme changes are saved in this browser’s local storage. Export your theme to keep a copy outside this browser. A Composer package for using themes in your project is coming soon.' },
]
