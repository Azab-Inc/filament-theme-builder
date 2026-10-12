<?php

namespace App\Filament\Pages\Showcase;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Filament\Infolists\Components\ColorEntry;
use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\KeyValueEntry;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Flex;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
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

    public Customer $customer;

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

        $this->customer = Customer::query()->where('email', 'avery@example.test')->firstOrFail();
    }

    public function customerProfileInfolist(Schema $schema): Schema
    {
        return $schema
            ->record($this->customer)
            ->components([
                Section::make('Customer profile')
                    ->description('A compact customer profile with grouped contact data and read-only preferences.')
                    ->schema([
                        Fieldset::make('Contact information')->schema([
                            Flex::make([
                                TextEntry::make('name')->label('Customer')->weight('bold'),
                                TextEntry::make('email')->label('Email')->icon('heroicon-m-envelope'),
                                TextEntry::make('phone')->label('Phone')->placeholder('No phone number'),
                            ]),
                        ]),
                        KeyValueEntry::make('preferences')
                            ->label('Contact preferences')
                            ->state(['Email updates' => 'Enabled', 'Preferred contact' => 'Email'])
                            ->keyLabel('Preference')
                            ->valueLabel('Value'),
                    ]),
            ]);
    }

    public function orderDetailsInfolist(Schema $schema): Schema
    {
        return $schema
            ->record($this->order)
            ->components([
                Section::make('Related order')
                    ->description('Order details: facts grouped into separate, read-only tabs.')
                    ->schema([
                        Tabs::make('Order information')
                            ->tabs([
                                Tabs\Tab::make('Summary')->schema([
                                    TextEntry::make('number')->label('Order number')->badge(),
                                    TextEntry::make('status')->label('Status')->badge(),
                                    TextEntry::make('total_cents')->label('Order total')->money('USD', divideBy: 100),
                                ]),
                                Tabs\Tab::make('Customer')->schema([
                                    TextEntry::make('customer.name')->label('Customer')->placeholder('Guest'),
                                    TextEntry::make('customer.email')->label('Customer email')->placeholder('No email'),
                                ]),
                            ]),
                        Section::make('Order items')->schema([
                            RepeatableEntry::make('items')
                                ->label('Ordered line items')
                                ->placeholder('No order items')
                                ->schema([
                                    TextEntry::make('product_name')->label('Product')->placeholder('Product unavailable'),
                                    TextEntry::make('variant_name')->label('Variant')->placeholder('No variant'),
                                    TextEntry::make('quantity')->label('Quantity')->numeric(),
                                    TextEntry::make('total_cents')->label('Line total')->money('USD', divideBy: 100),
                                ])->columns(2),
                        ]),
                    ]),
            ]);
    }

    public function productDetailsInfolist(Schema $schema): Schema
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
                        Flex::make([
                            ColorEntry::make('status_color')
                                ->label('Status color')
                                ->state('#16a34a'),
                            KeyValueEntry::make('attributes')
                                ->label('Product attributes')
                                ->state(['Finish' => 'Natural finish', 'Collection' => 'Demo collection'])
                                ->keyLabel('Attribute')
                                ->valueLabel('Value'),
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
                                    ->label('Categories')
                                    ->bulleted()
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
                                Fieldset::make('Inventory details')->schema([
                                    TextEntry::make('variants_count')
                                        ->label('Variant count')
                                        ->state(fn (Product $record): int => $record->variants()->count()),
                                    IconEntry::make('is_demo_fixture')->label('Demo fixture')->boolean(),
                                ]),
                            ]),
                        ]),
                    ])
                    ->columns(1),
            ]);
    }
}
