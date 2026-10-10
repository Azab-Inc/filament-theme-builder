<?php

namespace App\Filament\Support;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

final class EntityResourceForm
{
    public static function configure(Schema $schema, string $entity): Schema
    {
        return $schema->components(match ($entity) {
            'customer' => [TextInput::make('name')->required(), TextInput::make('email')->email()->required(), TextInput::make('phone')],
            'address' => [Select::make('customer_id')->relationship('customer', 'name')->searchable()->preload()->required(), TextInput::make('name'), TextInput::make('line_1')->required(), TextInput::make('line_2'), TextInput::make('city')->required(), TextInput::make('state'), TextInput::make('postal_code'), TextInput::make('country')->length(2)->required(), TextInput::make('phone')],
            'product' => [TextInput::make('name')->required(), TextInput::make('slug')->required(), TextInput::make('sku')->required(), Textarea::make('description'), TextInput::make('price_cents')->numeric()->required(), Select::make('status')->options(['draft' => 'Draft', 'active' => 'Active', 'archived' => 'Archived'])->required(), TextInput::make('image_url')->url(), Select::make('supplier_id')->relationship('supplier', 'name')->searchable()->preload()->nullable()],
            'category' => [TextInput::make('name')->required(), TextInput::make('slug')->required(), Textarea::make('description'), Select::make('parent_id')->relationship('parent', 'name')->searchable()->preload()->nullable()],
            'product-variant' => [Select::make('product_id')->relationship('product', 'name')->searchable()->preload()->required(), TextInput::make('name')->required(), TextInput::make('sku')->required(), TextInput::make('price_cents')->numeric()->nullable(), KeyValue::make('options'), Toggle::make('is_active')],
            'tag' => [TextInput::make('name')->required(), TextInput::make('slug')->required()],
            'review' => [Select::make('product_id')->relationship('product', 'name')->searchable()->preload()->required(), Select::make('customer_id')->relationship('customer', 'name')->searchable()->preload()->nullable(), TextInput::make('rating')->numeric()->minValue(1)->maxValue(5)->required(), TextInput::make('title'), Textarea::make('body'), Select::make('status')->options(['pending' => 'Pending', 'approved' => 'Approved', 'rejected' => 'Rejected'])->required()],
            'order' => [Select::make('customer_id')->relationship('customer', 'name')->searchable()->preload()->nullable(), Select::make('billing_address_id')->relationship('billingAddress', 'name')->searchable()->preload()->nullable(), Select::make('shipping_address_id')->relationship('shippingAddress', 'name')->searchable()->preload()->nullable(), Select::make('discount_id')->relationship('discount', 'name')->searchable()->preload()->nullable(), TextInput::make('number')->required(), Select::make('status')->options(['pending' => 'Pending', 'paid' => 'Paid', 'shipped' => 'Shipped', 'refunded' => 'Refunded'])->required(), TextInput::make('currency')->length(3)->required(), TextInput::make('subtotal_cents')->numeric()->required(), TextInput::make('discount_cents')->numeric()->required(), TextInput::make('tax_cents')->numeric()->required(), TextInput::make('shipping_cents')->numeric()->required(), TextInput::make('total_cents')->numeric()->required(), DateTimePicker::make('placed_at')->nullable()],
            'order-item' => [Select::make('order_id')->relationship('order', 'number')->searchable()->preload()->required(), Select::make('product_id')->relationship('product', 'name')->searchable()->preload()->nullable(), Select::make('product_variant_id')->relationship('variant', 'name')->searchable()->preload()->nullable(), TextInput::make('product_name')->required(), TextInput::make('variant_name'), TextInput::make('sku'), TextInput::make('quantity')->numeric()->required(), TextInput::make('unit_price_cents')->numeric()->required(), TextInput::make('total_cents')->numeric()->required()],
            'payment' => [Select::make('order_id')->relationship('order', 'number')->searchable()->preload()->required(), TextInput::make('provider'), TextInput::make('transaction_id'), TextInput::make('amount_cents')->numeric()->required(), TextInput::make('currency')->length(3)->required(), Select::make('status')->options(['pending' => 'Pending', 'succeeded' => 'Succeeded', 'failed' => 'Failed'])->required(), DateTimePicker::make('paid_at')->nullable()],
            'refund' => [Select::make('payment_id')->relationship('payment', 'transaction_id')->searchable()->preload()->required(), TextInput::make('amount_cents')->numeric()->required(), TextInput::make('reason'), Select::make('status')->options(['pending' => 'Pending', 'succeeded' => 'Succeeded', 'failed' => 'Failed'])->required(), DateTimePicker::make('refunded_at')->nullable()],
            'shipment' => [Select::make('order_id')->relationship('order', 'number')->searchable()->preload()->required(), TextInput::make('carrier'), TextInput::make('tracking_number'), Select::make('status')->options(['pending' => 'Pending', 'shipped' => 'Shipped', 'delivered' => 'Delivered'])->required(), DateTimePicker::make('shipped_at')->nullable(), DateTimePicker::make('delivered_at')->nullable()],
            'order-status-history' => [Select::make('order_id')->relationship('order', 'number')->searchable()->preload()->required(), TextInput::make('status')->required(), Textarea::make('comment')],
            'inventory' => [Select::make('product_id')->relationship('product', 'name')->searchable()->preload()->required(), Select::make('product_variant_id')->relationship('variant', 'name')->searchable()->preload()->nullable(), TextInput::make('quantity')->numeric()->required(), TextInput::make('location')],
            'supplier' => [TextInput::make('name')->required(), TextInput::make('email')->email(), TextInput::make('phone'), Textarea::make('notes')],
            'discount' => [TextInput::make('name')->required(), TextInput::make('code')->required(), Select::make('type')->options(['fixed' => 'Fixed', 'percentage' => 'Percentage'])->required(), TextInput::make('amount_cents')->numeric()->required(), DateTimePicker::make('starts_at')->nullable(), DateTimePicker::make('ends_at')->nullable(), Toggle::make('is_active')],
            'note' => [TextInput::make('noteable_type')->required(), TextInput::make('noteable_id')->numeric()->required(), Textarea::make('body')->required()],
            default => throw new \InvalidArgumentException("Unknown entity form: {$entity}"),
        });
    }
}
