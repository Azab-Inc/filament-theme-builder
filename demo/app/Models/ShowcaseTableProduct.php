<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable(['product_id', 'position'])]
class ShowcaseTableProduct extends Model
{
    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return HasManyThrough<OrderItem, Product, $this> */
    public function orderItems(): HasManyThrough
    {
        return $this->hasManyThrough(OrderItem::class, Product::class, 'id', 'product_id', 'product_id', 'id');
    }
}
