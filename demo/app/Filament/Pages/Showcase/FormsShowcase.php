<?php

namespace App\Filament\Pages\Showcase;

use App\Filament\Pages\Showcase\Forms\CustomerContactForm;
use App\Filament\Pages\Showcase\Forms\OrderStatusForm;
use App\Filament\Pages\Showcase\Forms\ProductEditorForm;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use LogicException;
use UnitEnum;

class FormsShowcase extends Page
{
    protected static ?string $title = 'Forms & Schemas';

    protected static ?string $navigationLabel = 'Forms & Schemas';

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 20;

    protected string $view = 'filament.pages.showcase.forms-showcase';

    /** @var array<string, mixed> */
    public array $data = [];

    public static function getSlug(?Panel $panel = null): string
    {
        return 'forms-showcase';
    }

    public function mount(): void
    {
        $this->showcaseForm()->fill([
            'product_name' => 'Considered Field Notebook',
            'product_reference' => 'FIXTURE-PRODUCT-001',
            'product_price' => '24.00',
            'product_category' => 'stationery',
            'product_available' => true,
            'product_launch_date' => '2026-10-10',
            'product_image' => null,
            'product_sku' => 'NOTEBOOK-001',
            'product_description' => 'A considered notebook for field notes and small observations.',
            'product_long_text' => 'A long deterministic fixture paragraph keeps the showcase readable while exercising long-form text treatment without relying on persisted content.',
            'product_compare_price' => '28.00',
            'product_notes' => null,
            'street_address' => '14 Market Street',
            'city' => 'Brighton',
            'region' => 'East Sussex',
            'postal_code' => 'BN1 1AA',
            'contact_email' => 'hello@example.test',
            'contact_phone' => '+44 20 7946 0958',
            'order_status' => 'pending',
            'order_status_note' => 'Awaiting payment confirmation.',
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('ProductEditorForm')
                    ->schema(ProductEditorForm::components()),
                ...CustomerContactForm::components(),
                ...OrderStatusForm::components(),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $this->showcaseForm()->validate();
    }

    protected function showcaseForm(): Schema
    {
        return $this->getSchema('form') ?? throw new LogicException('The forms showcase schema is not configured.');
    }

    public function getView(): string
    {
        return $this->view;
    }
}
