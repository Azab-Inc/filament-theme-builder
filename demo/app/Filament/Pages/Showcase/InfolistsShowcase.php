<?php

namespace App\Filament\Pages\Showcase;

use App\Models\Order;
use App\Models\Product;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use UnitEnum;

class InfolistsShowcase extends Page
{
    protected static ?string $title = 'Infolists';

    protected static ?string $navigationLabel = 'Infolists';

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 40;

    protected string $view = 'filament.pages.showcase.infolists-showcase';

    public Product $product;

    public Order $order;

    public static function getSlug(?Panel $panel = null): string
    {
        return 'infolists-showcase';
    }

    public function mount(): void
    {
        $this->product = Product::query()
            ->with(['supplier', 'categories', 'tags'])
            ->where('sku', 'DEMO-CHAIR-001')
            ->firstOrFail();

        $this->order = Order::query()
            ->with(['customer', 'items.product', 'items.variant'])
            ->where('number', 'DEMO-ORDER-1001')
            ->firstOrFail();
    }

    public function productInfolist(Schema $schema): Schema
    {
        return $schema
            ->record($this->product)
            ->components([
                Section::make('Product overview')
                    ->description('A read-only product fixture with accessible image and status indicators.')
                    ->schema([
                        Grid::make(3)->schema([
                            ImageEntry::make('image_url')
                                ->label('Product image')
                                ->alt(fn (Product $record): string => $record->name)
                                ->placeholder('No image')
                                ->imageSize(96),
                            TextEntry::make('name')
                                ->label('Product name')
                                ->size('large')
                                ->weight('bold'),
                            TextEntry::make('sku')
                                ->label('SKU')
                                ->badge(),
                        ]),
                        Grid::make(3)->schema([
                            TextEntry::make('status')->label('Status')->badge(),
                            TextEntry::make('supplier.name')
                                ->label('Supplier')
                                ->placeholder('No supplier'),
                            IconEntry::make('is_demo_fixture')
                                ->label('Featured fixture')
                                ->boolean()
                                ->state(fn (Product $record): bool => (bool) $record->getAttribute('is_demo_fixture')),
                        ]),
                    ])
                    ->columns(1),
                Section::make('Product details')
                    ->schema([
                        Group::make([
                            Grid::make(2)->schema([
                                TextEntry::make('price_cents')
                                    ->label('Price')
                                    ->money('USD', divideBy: 100),
                                TextEntry::make('categories.name')
                                    ->label('Category')
                                    ->listWithLineBreaks()
                                    ->placeholder('No category'),
                                TextEntry::make('description')
                                    ->label('Description')
                                    ->columnSpanFull()
                                    ->prose(),
                                TextEntry::make('tags.name')
                                    ->label('Tags')
                                    ->badge()
                                    ->separator(', ')
                                    ->placeholder('No tags'),
                            ]),
                        ]),
                    ])
                    ->columns(1),
            ]);
    }

    public function orderInfolist(Schema $schema): Schema
    {
        return $schema
            ->record($this->order)
            ->components([
                Section::make('Related order')
                    ->description('A seeded order and its customer relationship, shown without edit controls.')
                    ->schema([
                        Grid::make(3)->schema([
                            TextEntry::make('number')->label('Order number')->badge(),
                            TextEntry::make('customer.name')
                                ->label('Customer')
                                ->placeholder('Guest'),
                            TextEntry::make('status')->label('Status')->badge(),
                        ]),
                    ]),
                Section::make('Order items')
                    ->schema([
                        RepeatableEntry::make('items')
                            ->label('Order items')
                            ->placeholder('No order items')
                            ->schema([
                                TextEntry::make('product_name')
                                    ->label('Product')
                                    ->placeholder('Product unavailable'),
                                TextEntry::make('variant_name')
                                    ->label('Variant')
                                    ->placeholder('No variant'),
                                TextEntry::make('quantity')->label('Quantity')->numeric(),
                                TextEntry::make('total_cents')->label('Line total')->money('USD', divideBy: 100),
                            ])
                            ->columns(2),
                    ]),
            ]);
    }
}
