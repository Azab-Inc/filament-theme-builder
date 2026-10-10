<?php

namespace App\Filament\Support;

use Filament\Tables\Table;

final class RelationManagerTable
{
    /**
     * @param  array<int, mixed>  $columns
     * @param  array<int, mixed>  $filters
     * @param  array<int, mixed>  $headerActions
     * @param  array<int, mixed>  $recordActions
     * @param  array<int, mixed>  $toolbarActions
     */
    public static function configure(
        Table $table,
        array $columns,
        array $filters = [],
        array $headerActions = [],
        array $recordActions = [],
        array $toolbarActions = [],
    ): Table {
        return $table
            ->columns($columns)
            ->filters($filters)
            ->headerActions($headerActions)
            ->recordActions($recordActions)
            ->toolbarActions($toolbarActions);
    }
}
