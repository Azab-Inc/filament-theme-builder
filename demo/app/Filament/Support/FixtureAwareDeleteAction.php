<?php

namespace App\Filament\Support;

use Filament\Actions\DeleteAction;
use Illuminate\Database\Eloquent\Model;

final class FixtureAwareDeleteAction
{
    public static function make(): DeleteAction
    {
        return DeleteAction::make()
            ->disabled(fn (Model $record): bool => method_exists($record, 'isDemoFixture') && $record->isDemoFixture())
            ->tooltip(fn (Model $record): ?string => method_exists($record, 'isDemoFixture') && $record->isDemoFixture()
                ? 'Showcase fixtures are protected from deletion.'
                : null);
    }
}
