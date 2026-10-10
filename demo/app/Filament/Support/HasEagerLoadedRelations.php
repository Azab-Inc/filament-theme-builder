<?php

namespace App\Filament\Support;

use Illuminate\Database\Eloquent\Builder;

trait HasEagerLoadedRelations
{
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(self::eagerLoadedRelations());
    }

    /** @return list<string> */
    private static function eagerLoadedRelations(): array
    {
        return match (class_basename(static::class)) {
            'AddressResource' => ['customer'],
            'CategoryResource' => ['parent'],
            'ProductResource' => ['supplier'],
            'ProductVariantResource' => ['product'],
            'ReviewResource' => ['product', 'customer'],
            'OrderResource' => ['customer', 'billingAddress', 'shippingAddress', 'discount'],
            'OrderItemResource' => ['order', 'product', 'variant'],
            'PaymentResource' => ['order'],
            'RefundResource' => ['payment'],
            'ShipmentResource' => ['order'],
            'OrderStatusHistoryResource' => ['order'],
            'InventoryResource' => ['product', 'variant'],
            default => [],
        };
    }
}
