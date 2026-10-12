<x-filament-panels::page>
    <div class="space-y-6" data-showcase-state-controls>
        <x-filament::section aria-label="State controls">
            <x-slot name="heading">ShowcaseStateControls</x-slot>
            <p class="text-sm text-gray-600 dark:text-gray-300">
                Presentation-only request state. It uses seeded fixtures without persisting a selection or changing demo records.
            </p>
            <nav aria-label="State controls" class="mt-4 flex flex-wrap gap-2">
                @foreach ($this->allowedStates() as $availableState)
                    @if ($availableState === 'default')
                        <a href="{{ \App\Filament\Pages\Showcase\ShowcaseStateControls::getUrl() }}" @class(['fi-btn', 'fi-color-primary' => $this->isState('default')])>{{ $availableState }}</a>
                    @else
                        <a href="{{ \App\Filament\Pages\Showcase\ShowcaseStateControls::getUrl(['state' => $availableState]) }}" @class(['fi-btn', 'fi-color-primary' => $this->isState($availableState)])>{{ $availableState }}</a>
                    @endif
                @endforeach
                <a href="{{ \App\Filament\Pages\Showcase\ShowcaseStateControls::getUrl() }}" class="fi-btn" data-reset-state>Reset state</a>
            </nav>
        </x-filament::section>

        <div data-showcase-state="{{ $state }}" data-inspector-component="showcase.state" data-inspector-state="{{ $state }}" data-semantic-breadcrumb="Showcase / Forced states / {{ $state }}" class="space-y-6">
            <x-filament::section aria-label="Forced state preview">
                <x-slot name="heading">{{ $state }}</x-slot>
                <p class="text-sm text-gray-600 dark:text-gray-300" data-state-inheritance="inherited">
                    State-level values inherit from the component theme value until an explicit state override is selected.
                </p>
                <div data-state-inheritance="state-level" class="mt-3 rounded-lg border border-dashed border-gray-300 p-3 text-sm dark:border-gray-600">
                    Explicit state override preview: <strong>{{ $state }}</strong>
                </div>
            </x-filament::section>

            @if ($state === 'FormValidationState')
                <x-filament::section aria-label="FormValidationState" data-surface="FormValidationState">
                    <x-slot name="heading">FormValidationState</x-slot>
                    <label class="fi-fo-field-label" for="state-email">Email address</label>
                    <input id="state-email" class="fi-input fi-invalid mt-2 w-full" value="invalid fixture" aria-invalid="true" aria-describedby="state-email-error">
                    <p id="state-email-error" class="fi-fo-field-error-message mt-2" role="alert">Enter a valid email address.</p>
                </x-filament::section>
            @elseif ($state === 'FormFocusState')
                <x-filament::section aria-label="FormFocusState" data-surface="FormFocusState">
                    <x-slot name="heading">FormFocusState</x-slot>
                    <label class="fi-fo-field-label" for="state-focus">Focused fixture input</label>
                    <input id="state-focus" class="fi-input mt-2 w-full" autofocus value="Focus is deterministic">
                </x-filament::section>
            @elseif ($state === 'TableEmptyState')
                <x-filament::section aria-label="TableEmptyState" data-surface="TableEmptyState">
                    <x-slot name="heading">TableEmptyState</x-slot>
                    <div class="fi-ta-empty-state" role="status"><strong>No showcase rows found</strong><p>Empty state is presented without deleting seeded records.</p></div>
                </x-filament::section>
            @elseif ($state === 'TableLoadingState')
                <x-filament::section aria-label="TableLoadingState" data-surface="TableLoadingState">
                    <x-slot name="heading">TableLoadingState</x-slot>
                    <div class="fi-ta-loading" role="status" aria-live="polite"><x-filament::loading-indicator class="h-5 w-5" /> Loading showcase rows…</div>
                </x-filament::section>
            @elseif ($state === 'TableSelectedRowState')
                <x-filament::section aria-label="TableSelectedRowState" data-surface="TableSelectedRowState">
                    <x-slot name="heading">TableSelectedRowState</x-slot>
                    <table class="fi-ta-table w-full"><caption class="sr-only">Selected showcase row</caption><tbody><tr class="fi-ta-row fi-selected"><td>DEMO-CHAIR-001</td><td><span class="fi-badge">Selected fixture row</span></td></tr></tbody></table>
                </x-filament::section>
            @elseif ($state === 'ActionLoadingState')
                <x-filament::section aria-label="ActionLoadingState" data-surface="ActionLoadingState">
                    <x-slot name="heading">ActionLoadingState</x-slot>
                    <x-filament::button wire:loading.attr="disabled" disabled aria-busy="true"><x-filament::loading-indicator class="h-4 w-4" /> Loading fixture action</x-filament::button>
                </x-filament::section>
            @elseif ($state === 'ModalOpenState')
                <x-filament::section aria-label="ModalOpenState" data-surface="ModalOpenState">
                    <x-slot name="heading">ModalOpenState</x-slot>
                    <div class="fi-modal fi-modal-open" role="dialog" aria-modal="true" aria-labelledby="state-modal-heading"><div class="fi-modal-window"><h3 id="state-modal-heading">Presentation-only modal</h3><p>No action is submitted and no record is changed.</p><button type="button" class="fi-btn">Close fixture</button></div></div>
                </x-filament::section>
            @elseif ($state === 'NotificationVisibleState')
                <x-filament::section aria-label="NotificationVisibleState" data-surface="NotificationVisibleState">
                    <x-slot name="heading">NotificationVisibleState</x-slot>
                    <div class="fi-no-notification fi-status-success" role="status"><strong>Fixture notification visible</strong><p>This message is stable for screenshots and does not use timeout behavior.</p></div>
                </x-filament::section>
            @elseif ($state === 'HoverState')
                <x-filament::section aria-label="HoverState" data-surface="HoverState">
                    <x-slot name="heading">HoverState</x-slot>
                    <x-filament::button class="hover:brightness-90" data-hover-target>Hover fixture action</x-filament::button>
                </x-filament::section>
            @elseif ($state === 'DisabledState')
                <x-filament::section aria-label="DisabledState" data-surface="DisabledState">
                    <x-slot name="heading">DisabledState</x-slot>
                    <x-filament::button disabled data-disabled-target>Disabled fixture action</x-filament::button>
                </x-filament::section>
            @else
                <x-filament::section aria-label="Default state" data-surface="default">
                    <x-slot name="heading">default</x-slot>
                    <p>Ordinary seeded fixture state. No forced state is active.</p>
                </x-filament::section>
            @endif
        </div>
    </div>
</x-filament-panels::page>
