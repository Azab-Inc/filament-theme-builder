<x-filament-panels::page>
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section aria-label="Product showcase details">
            {{ $this->getSchema('productInfolist') }}
        </section>
        <section aria-label="Order showcase details">
            {{ $this->getSchema('orderInfolist') }}
        </section>
    </div>
</x-filament-panels::page>
