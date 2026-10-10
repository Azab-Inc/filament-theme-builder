<?php

namespace App\Filament\Support;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\DatePicker;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

final class EntityResourceTable
{
    public static function configure(Table $table, string $entity): Table
    {
        $columns = match ($entity) {
            'customer' => [TextColumn::make('name')->searchable()->sortable(), TextColumn::make('email')->searchable(), TextColumn::make('phone')],
            'address' => [TextColumn::make('name')->searchable(), TextColumn::make('customer.name')->searchable(), TextColumn::make('city')->searchable(), TextColumn::make('country')],
            'product' => [ImageColumn::make('image_url')->label('Image'), TextColumn::make('name')->searchable()->sortable(), TextColumn::make('sku')->searchable(), TextColumn::make('price_cents')->money('USD', divideBy: 100)->sortable(), TextColumn::make('status')->formatStateUsing(fn (?string $state): ?string => $state ? ucfirst($state) : null)->badge()->sortable(), TextColumn::make('supplier.name')->label('Supplier')],
            'category' => [TextColumn::make('name')->searchable()->sortable(), TextColumn::make('slug')->searchable(), TextColumn::make('parent.name')->label('Parent')],
            'product-variant' => [TextColumn::make('name')->searchable(), TextColumn::make('sku')->searchable(), TextColumn::make('product.name')->searchable(), TextColumn::make('price_cents')->money('USD', divideBy: 100), TextColumn::make('is_active')->badge()],
            'tag' => [TextColumn::make('name')->searchable()->sortable(), TextColumn::make('slug')->searchable()],
            'review' => [TextColumn::make('title')->searchable(), TextColumn::make('product.name')->searchable(), TextColumn::make('customer.name')->searchable(), TextColumn::make('rating')->sortable(), TextColumn::make('status')->badge()->sortable()],
            'order' => [TextColumn::make('number')->searchable()->sortable(), TextColumn::make('customer.name')->searchable(), TextColumn::make('total_cents')->money(fn ($record): string => $record->currency ?? 'USD', divideBy: 100)->sortable(), TextColumn::make('status')->badge()->sortable(), TextColumn::make('placed_at')->dateTime()],
            'order-item' => [TextColumn::make('order.number')->searchable(), TextColumn::make('product_name')->searchable(), TextColumn::make('quantity')->sortable(), TextColumn::make('total_cents')->money('USD', divideBy: 100)],
            'payment' => [TextColumn::make('order.number')->searchable(), TextColumn::make('transaction_id')->searchable(), TextColumn::make('amount_cents')->money(fn ($record): string => $record->currency ?? 'USD', divideBy: 100)->sortable(), TextColumn::make('status')->badge()],
            'refund' => [TextColumn::make('payment.transaction_id')->searchable(), TextColumn::make('amount_cents')->money('USD', divideBy: 100), TextColumn::make('reason')->searchable(), TextColumn::make('status')->badge()],
            'shipment' => [TextColumn::make('order.number')->searchable(), TextColumn::make('tracking_number')->searchable(), TextColumn::make('carrier'), TextColumn::make('status')->badge()],
            'order-status-history' => [TextColumn::make('order.number')->searchable(), TextColumn::make('status')->badge(), TextColumn::make('comment')->searchable(), TextColumn::make('created_at')->dateTime()],
            'inventory' => [TextColumn::make('product.name')->searchable(), TextColumn::make('variant.name')->searchable(), TextColumn::make('quantity')->sortable(), TextColumn::make('location')->searchable()],
            'supplier' => [TextColumn::make('name')->searchable()->sortable(), TextColumn::make('email')->searchable(), TextColumn::make('phone')],
            'discount' => [TextColumn::make('name')->searchable(), TextColumn::make('code')->searchable(), TextColumn::make('amount_cents')->money('USD', divideBy: 100), TextColumn::make('is_active')->badge()],
            'note' => [TextColumn::make('noteable_type')->searchable(), TextColumn::make('noteable_id')->sortable(), TextColumn::make('body')->searchable()],
            default => throw new \InvalidArgumentException("Unknown entity table: {$entity}"),
        };

        return $table
            ->columns($columns)
            ->filters(self::filtersFor($entity))
            ->recordActions([ViewAction::make(), EditAction::make()])
            ->toolbarActions([BulkActionGroup::make([DeleteBulkAction::make()])]);
    }

    /** @return list<Filter|SelectFilter> */
    public static function filtersFor(string $entity): array
    {
        return match ($entity) {
            'customer', 'tag', 'supplier', 'note' => [self::dateFilter('created_at')],
            'address' => [SelectFilter::make('customer_id')->relationship('customer', 'name')],
            'product' => [SelectFilter::make('status')->options(['draft' => 'Draft', 'active' => 'Active', 'archived' => 'Archived']), SelectFilter::make('supplier_id')->relationship('supplier', 'name')],
            'category' => [SelectFilter::make('parent_id')->relationship('parent', 'name')],
            'product-variant' => [SelectFilter::make('product_id')->relationship('product', 'name'), SelectFilter::make('is_active')->options([1 => 'Active', 0 => 'Inactive'])],
            'review' => [SelectFilter::make('status')->options(['pending' => 'Pending', 'approved' => 'Approved', 'rejected' => 'Rejected']), SelectFilter::make('product_id')->relationship('product', 'name')],
            'order' => [SelectFilter::make('status')->options(['pending' => 'Pending', 'paid' => 'Paid', 'shipped' => 'Shipped', 'refunded' => 'Refunded']), SelectFilter::make('customer_id')->relationship('customer', 'name'), self::dateFilter('placed_at')],
            'order-item' => [SelectFilter::make('order_id')->relationship('order', 'number'), SelectFilter::make('product_id')->relationship('product', 'name')],
            'payment' => [SelectFilter::make('status')->options(['pending' => 'Pending', 'succeeded' => 'Succeeded', 'failed' => 'Failed']), SelectFilter::make('order_id')->relationship('order', 'number')],
            'refund' => [SelectFilter::make('status')->options(['pending' => 'Pending', 'succeeded' => 'Succeeded', 'failed' => 'Failed']), SelectFilter::make('payment_id')->relationship('payment', 'transaction_id')],
            'shipment' => [SelectFilter::make('status')->options(['pending' => 'Pending', 'shipped' => 'Shipped', 'delivered' => 'Delivered']), SelectFilter::make('order_id')->relationship('order', 'number')],
            'order-status-history' => [SelectFilter::make('status')->options(['pending' => 'Pending', 'paid' => 'Paid', 'shipped' => 'Shipped', 'refunded' => 'Refunded']), SelectFilter::make('order_id')->relationship('order', 'number'), self::dateFilter('created_at')],
            'inventory' => [SelectFilter::make('product_id')->relationship('product', 'name'), SelectFilter::make('product_variant_id')->relationship('variant', 'name')],
            'discount' => [SelectFilter::make('type')->options(['fixed' => 'Fixed', 'percentage' => 'Percentage']), SelectFilter::make('is_active')->options([1 => 'Active', 0 => 'Inactive']), self::dateFilter('starts_at')],
            default => throw new \InvalidArgumentException("Unknown entity filters: {$entity}"),
        };
    }

    private static function dateFilter(string $column): Filter
    {
        return Filter::make($column)
            ->form([DatePicker::make('from'), DatePicker::make('until')])
            ->query(fn (Builder $query, array $data): Builder => $query
                ->when($data['from'] ?? null, fn (Builder $query, string $date): Builder => $query->whereDate($column, '>=', $date))
                ->when($data['until'] ?? null, fn (Builder $query, string $date): Builder => $query->whereDate($column, '<=', $date)));
    }
}
