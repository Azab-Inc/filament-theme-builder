<x-filament-panels::page>
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section aria-label="Customer profile details">
            {{ $this->getSchema('customerProfileInfolist') }}
        </section>
        <section aria-label="Order details showcase">
            {{ $this->getSchema('orderDetailsInfolist') }}
        </section>
        <section aria-label="Product details showcase" class="xl:col-span-2">
            {{ $this->getSchema('productDetailsInfolist') }}
        </section>
    </div>
</x-filament-panels::page>
