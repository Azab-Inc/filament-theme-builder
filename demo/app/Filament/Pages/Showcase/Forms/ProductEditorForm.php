<?php

namespace App\Filament\Pages\Showcase\Forms;

use App\Support\Uploads\TemporaryUploadStorage;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Wizard;
use Filament\Schemas\Components\Wizard\Step;
use Illuminate\Contracts\Support\Htmlable;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

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
                    self::imageUpload(),
                    Textarea::make('product_long_text')
                        ->label('Long text fixture')
                        ->default('A long deterministic fixture paragraph keeps the showcase readable while exercising long-form text treatment without relying on persisted content.')
                        ->rows(4)
                        ->maxLength(240),
                ])
                ->columns(2),
            Fieldset::make('Product metadata')
                ->schema([
                    Grid::make(2)
                        ->schema([
                            Select::make('product_metadata.material')
                                ->label('Material')
                                ->options([
                                    'paper' => 'Paper',
                                    'canvas' => 'Canvas',
                                    'leather' => 'Leather',
                                ])
                                ->required(),
                            Select::make('product_metadata.edition')
                                ->label('Edition')
                                ->options([
                                    'standard' => 'Standard',
                                    'limited' => 'Limited',
                                ])
                                ->required(),
                        ]),
                ]),
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

    public static function imageUpload(): FileUpload
    {
        return FileUpload::make('product_image')
            ->label('Product image')
            ->helperText('JPEG, PNG, WebP, or PDF up to 5 MB')
            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
            ->maxSize((int) ceil((int) config('maintenance.temporary_upload_max_bytes') / 1024))
            ->disk('local')
            ->directory('demo-uploads')
            ->saveUploadedFileUsing(static function (TemporaryUploadedFile $file): string {
                return app(TemporaryUploadStorage::class)->store(
                    $file,
                    (string) (auth()->id() ?? session()->getId()),
                );
            });
    }
}
