<x-filament-panels::page>
    <div class="space-y-6">
        <section aria-label="Action variants" class="grid gap-4 md:grid-cols-2">
            <x-filament::section>
                <x-slot name="heading">OrderActionsFixture</x-slot>
                <p class="text-sm text-gray-600 dark:text-gray-300">Native order actions cover primary, success, warning, info, gray, outline, icon-only, disabled, and loading presentations without changing seeded records.</p>
            </x-filament::section>
            <x-filament::section>
                <x-slot name="heading">ProductActionsFixture</x-slot>
                <p class="text-sm text-gray-600 dark:text-gray-300">Native product actions cover primary, danger, success, warning, info, gray, outline, icon-only, disabled, and loading presentations without changing seeded records.</p>
            </x-filament::section>
        </section>
        <x-filament::section aria-label="Named modal fixtures">
            <x-slot name="heading">DeleteProductConfirmationModal and OrderStatusModal</x-slot>
            <p class="text-sm text-gray-600 dark:text-gray-300">The native confirmation and form actions expose representative sizes, headers, descriptions, forms, footers, destructive confirmation, and Livewire loading semantics.</p>
        </x-filament::section>
        <x-filament::section heading="Typography fixtures">
            <p>Body typography is rendered by this native page.</p>
            <p class="fi-section-header-description" data-foundation-muted>Muted text fixture</p>
            <h2>Heading typography is rendered by this native section.</h2>
            <div class="fi-section-header" data-foundation-section-header>
                <h3 class="fi-section-header-heading" data-foundation-heading>Native heading fixture</h3>
            </div>
            <code data-foundation-mono>MONO-FIXTURE-001</code>
        </x-filament::section>
        <x-filament::section heading="Palette fixtures">
            <div class="flex flex-wrap gap-2">
                @foreach (['primary', 'success', 'warning', 'danger', 'info', 'gray'] as $palette)
                    <x-filament::button :color="$palette" :class="'fi-color-'.$palette.' foundation-palette-'.$palette" :aria-label="$palette.' palette fixture'">
                        {{ ucfirst($palette) }} palette
                    </x-filament::button>
                @endforeach
            </div>
            <button type="button" class="fi-btn" data-foundation-disabled disabled>Disabled palette fixture</button>
        </x-filament::section>
    </div>
</x-filament-panels::page>
