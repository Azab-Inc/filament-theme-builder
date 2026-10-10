<?php

namespace App\Filament\Resources\Refunds;

use App\Filament\Resources\Refunds\Pages\CreateRefund;
use App\Filament\Resources\Refunds\Pages\EditRefund;
use App\Filament\Resources\Refunds\Pages\ListRefunds;
use App\Filament\Resources\Refunds\Pages\ViewRefund;
use App\Filament\Resources\Refunds\Schemas\RefundForm;
use App\Filament\Resources\Refunds\Schemas\RefundInfolist;
use App\Filament\Resources\Refunds\Tables\RefundsTable;
use App\Filament\Support\HasEagerLoadedRelations;
use App\Models\Refund;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class RefundResource extends Resource
{
    use HasEagerLoadedRelations;

    protected static ?string $model = Refund::class;

    protected static string|UnitEnum|null $navigationGroup = 'Sales';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return RefundForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return RefundInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return RefundsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListRefunds::route('/'),
            'create' => CreateRefund::route('/create'),
            'view' => ViewRefund::route('/{record}'),
            'edit' => EditRefund::route('/{record}/edit'),
        ];
    }
}
