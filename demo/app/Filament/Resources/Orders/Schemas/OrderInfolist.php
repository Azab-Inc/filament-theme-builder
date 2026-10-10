<?php

namespace App\Filament\Resources\Orders\Schemas;

use App\Filament\Support\EntityResourceInfolist;
use App\Models\Order;
use App\Models\Product;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class OrderInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceInfolist::configure($schema, 'order')->components([
            TextEntry::make('number'),
            TextEntry::make('customer.name')->label('Customer')->default('Guest'),
            TextEntry::make('items')->label('Products')->state(fn (Order $record): string => $record->items
                ->map(function ($item): string {
                    $product = $item->relationLoaded('product') ? $item->getRelation('product') : $item->product;

                    return $product instanceof Product ? $product->name : ($item->product_name ?? 'Product unavailable');
                })
                ->join(', ')),
            TextEntry::make('statusHistories')->label('Status history')->state(fn (Order $record): string => $record->statusHistories
                ->map(fn ($history): string => ucfirst((string) $history->status))
                ->join(', ')),
            TextEntry::make('total_cents')->money(fn ($record): string => $record->currency ?? 'USD', divideBy: 100),
            TextEntry::make('status')->badge()->formatStateUsing(fn (?string $state): ?string => $state ? ucfirst($state) : null),
        ]);
    }
}
