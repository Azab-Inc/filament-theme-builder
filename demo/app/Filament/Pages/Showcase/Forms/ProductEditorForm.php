<?php

namespace App\Filament\Pages\Showcase\Forms;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Wizard;
use Filament\Schemas\Components\Wizard\Step;
use Illuminate\Contracts\Support\Htmlable;

final class ProductEditorForm
{
    /** @return list<Htmlable|string> */
    public static function components(): array
    {
        return [
            Section::make('Section / grid layout')
                ->description('A product editor arranged as a compact two-column grid.')
                ->schema([
                    TextInput::make('product_name')
                        ->label('Product name')
                        ->required()
                        ->maxLength(120),
                    TextInput::make('product_reference')
                        ->label('Product reference')
                        ->default('FIXTURE-PRODUCT-001')
                        ->disabled(),
                    TextInput::make('product_price')
                        ->label('Product price')
                        ->prefix('$')
                        ->numeric()
                        ->required(),
                    Select::make('product_category')
                        ->label('Product category')
                        ->options([
                            'stationery' => 'Stationery',
                            'apparel' => 'Apparel',
                            'home' => 'Home goods',
                        ])
                        ->required(),
                    Toggle::make('product_available')
                        ->label('Product availability'),
                    DatePicker::make('product_launch_date')
                        ->label('Product launch date')
                        ->required(),
                    FileUpload::make('product_image')
                        ->label('Product image')
                        ->disk('local')
                        ->directory('showcase-fixtures')
                        ->visibility('private')
                        ->image()
                        ->acceptedFileTypes(['image/jpeg', 'image/png'])
                        ->maxSize(2048)
                        ->nullable(),
                ])
                ->columns(2),
            Section::make('Wizard steps layout')
                ->schema([
                    Wizard::make([
                        Step::make('Details')
                            ->schema([
                                TextInput::make('product_sku')
                                    ->label('Product SKU')
                                    ->default('NOTEBOOK-001')
                                    ->required(),
                            ]),
                        Step::make('Description')
                            ->schema([
                                Textarea::make('product_description')
                                    ->label('Product description')
                                    ->default('A considered notebook for field notes and small observations.')
                                    ->rows(3),
                            ]),
                    ])
                        ->label('Product wizard')
                        ->persistStepInQueryString('product-step'),
                ]),
            Section::make('Tabbed form layout')
                ->schema([
                    Tabs::make('Product tabs')
                        ->tabs([
                            Tab::make('Pricing')
                                ->schema([
                                    TextInput::make('product_compare_price')
                                        ->label('Compare-at price')
                                        ->prefix('$')
                                        ->numeric()
                                        ->default('28.00'),
                                ]),
                            Tab::make('Notes')
                                ->schema([
                                    Textarea::make('product_notes')
                                        ->label('Product notes')
                                        ->default('Optional merchandising notes.')
                                        ->nullable(),
                                ]),
                        ]),
                ]),
        ];
    }
}
