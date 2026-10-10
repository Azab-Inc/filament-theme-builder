<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait HasDemoFixture
{
    protected static function bootHasDemoFixture(): void
    {
        static::deleting(static fn (Model $model): ?bool => filter_var($model->getAttribute('is_demo_fixture'), FILTER_VALIDATE_BOOL) ? false : null);
    }

    /** @param Builder<Model> $query
     * @return Builder<Model>
     */
    public function scopeShowcaseFixture(Builder $query): Builder
    {
        return $query->where($this->qualifyColumn('is_demo_fixture'), true);
    }
}
