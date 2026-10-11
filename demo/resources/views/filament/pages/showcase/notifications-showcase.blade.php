<x-filament-panels::page>
    <div class="space-y-6">
        <x-filament::section aria-label="Notification API fixtures">
            <x-slot name="heading">Native notification fixtures</x-slot>
            <p class="text-sm text-gray-600 dark:text-gray-300">
                Use the header actions to send native status notifications. Each fixture includes deterministic content, a close action, and the installed persistence or duration API where supported.
            </p>
            <p class="mt-3 text-sm text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
                Last notification: {{ $lastNotification }}
            </p>
        </x-filament::section>
    </div>
</x-filament-panels::page>
