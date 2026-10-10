<x-filament-panels::page>
    <div role="status" aria-live="polite" wire:loading.flex class="mb-4 items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <x-filament::loading-indicator class="h-4 w-4" />
        Loading products…
    </div>

    {{ $this->table }}

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        @livewire(\App\Filament\Pages\Showcase\Tables\OrdersTableFixture::class)
        @livewire(\App\Filament\Pages\Showcase\Tables\InventoryTableFixture::class)
    </div>
</x-filament-panels::page>
