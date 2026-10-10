<?php

namespace App\Filament\Support;

use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

final class EntityResourceInfolist
{
    public static function configure(Schema $schema, string $entity): Schema
    {
        $entries = match ($entity) {
            'product' => [
                ImageEntry::make('image_url')->label('Image'),
                TextEntry::make('name'),
                TextEntry::make('price_cents')->money('USD', divideBy: 100),
                TextEntry::make('status')->badge()->formatStateUsing(fn (?string $state): ?string => $state ? ucfirst($state) : null),
            ],
            default => [TextEntry::make(match ($entity) {
                'customer', 'product', 'category', 'product-variant', 'tag', 'supplier' => 'name',
                'address' => 'name',
                'review' => 'title',
                'order' => 'number',
                'order-item' => 'product_name',
                'payment' => 'transaction_id',
                'refund' => 'reason',
                'shipment' => 'tracking_number',
                'order-status-history' => 'comment',
                'inventory' => 'location',
                'discount' => 'code',
                'note' => 'body',
                default => throw new \InvalidArgumentException("Unknown entity infolist: {$entity}"),
            })],
        };

        return $schema->components($entries);
    }
}
