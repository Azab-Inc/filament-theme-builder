<?php

namespace App\Filament\Pages\Showcase;

use App\Models\Product;
use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\Summarizers\Count;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Grouping\Group;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;

class TablesShowcase extends Page implements HasTable
{
    use InteractsWithTable;

    protected static ?string $title = 'Tables';

    protected static ?string $navigationLabel = 'Tables';

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 30;

    protected string $view = 'filament.pages.showcase.tables-showcase';

    public static function getSlug(?Panel $panel = null): string
    {
        return 'tables-showcase';
    }

    /** @return Builder<Product> */
    public function getTableQuery(): Builder
    {
        return Product::query()
            ->showcaseFixture()
            ->with('supplier')
            ->withCount('orderItems')
            ->orderBy('products.id');
    }

    public function updatedTableSearch(): void
    {
        $this->resetTableSelection();
    }

    public function updatedTableFilters(): void
    {
        $this->resetTableSelection();
    }

    private function resetTableSelection(): void
    {
        $this->selectedTableRecords = [];
        $this->deselectedTableRecords = [];
        $this->resetPage();
    }

    public function table(Table $table): Table
    {
        return $table
            ->heading('Showcase products')
            ->description('A read-only native table using the seeded product and order fixtures.')
            ->columns([
                ImageColumn::make('image_url')
                    ->label('Product image')
                    ->alt(fn (Product $record): string => filled($record->image_url) ? $record->name : 'No image')
                    ->defaultImageUrl(fn (): string => 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23f3f4f6"/%3E%3C/svg%3E')
                    ->square(),
                TextColumn::make('name')
                    ->label('Product')
                    ->searchable()
                    ->sortable()
                    ->wrap()
                    ->limit(80),
                TextColumn::make('sku')
                    ->label('SKU')
                    ->searchable()
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('supplier.name')
                    ->label('Supplier')
                    ->state(function (Product $record): string {
                        $supplier = $record->supplier;

                        return $supplier === null ? 'No supplier' : $supplier->name;
                    })
                    ->searchable()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('status')
                    ->label('Status')
                    ->formatStateUsing(fn (?string $state): ?string => $state ? ucfirst($state) : null)
                    ->badge()
                    ->sortable(),
                TextColumn::make('order_items_count')
                    ->label('Orders')
                    ->numeric()
                    ->sortable()
                    ->summarize(Count::make('count')->label('Products with orders')),
                IconColumn::make('is_featured')
                    ->label('Featured')
                    ->boolean()
                    ->state(fn (Product $record): bool => $record->sku === 'DEMO-CHAIR-001')
                    ->toggleable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'active' => 'Active',
                        'draft' => 'Draft',
                        'archived' => 'Archived',
                    ]),
            ])
            ->groups([
                Group::make('status')->label('Status')->collapsible(),
                Group::make('supplier.name')->label('Supplier')->collapsible(),
            ])
            ->defaultGroup('status')
            ->defaultSort('products.id')
            ->persistSortInSession(false)
            ->persistSearchInSession(false)
            ->persistFiltersInSession(false)
            ->deselectAllRecordsWhenFiltered()
            ->reorderable('id', condition: false)
            ->recordActions([
                Action::make('inspect')
                    ->label('Inspect')
                    ->icon('heroicon-o-eye')
                    ->requiresConfirmation()
                    ->modalHeading('Inspect product')
                    ->modalDescription('This showcase action is intentionally read-only.')
                    ->action(function (): void {
                        Notification::make()
                            ->title('Product details are read-only in this showcase.')
                            ->success()
                            ->send();
                    }),
            ])
            ->toolbarActions([
                BulkAction::make('review-selection')
                    ->label('Review selection')
                    ->requiresConfirmation()
                    ->modalHeading('Review selected products')
                    ->modalDescription('No seeded records will be changed by this fixture action.')
                    ->action(function (): void {
                        Notification::make()
                            ->title('Selected products are ready for review.')
                            ->success()
                            ->send();
                    }),
            ])
            ->emptyStateHeading('No products found')
            ->emptyStateDescription('Try changing the search or filters.')
            ->emptyStateIcon('heroicon-o-archive-box')
            ->striped()
            ->paginated([10, 25, 50]);
    }
}
