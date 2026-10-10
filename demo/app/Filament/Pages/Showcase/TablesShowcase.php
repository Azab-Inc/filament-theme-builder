<?php

namespace App\Filament\Pages\Showcase;

use App\Models\ShowcaseTableProduct;
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

    /** @return Builder<ShowcaseTableProduct> */
    public function getTableQuery(): Builder
    {
        return ShowcaseTableProduct::query()
            ->with('product.supplier')
            ->withCount('orderItems')
            ->when(blank($this->tableSort), fn (Builder $query): Builder => $query->orderBy('showcase_table_products.position'));
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
                ImageColumn::make('product.image_url')
                    ->label('Product image')
                    ->state(fn (ShowcaseTableProduct $record): ?string => $record->product?->image_url)
                    ->alt(fn (ShowcaseTableProduct $record): string => filled($record->product?->image_url) ? $record->product->name : 'No image')
                    ->defaultImageUrl(fn (): string => 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23f3f4f6"/%3E%3C/svg%3E')
                    ->square(),
                TextColumn::make('product.name')
                    ->label('Product')
                    ->searchable()
                    ->sortable()
                    ->wrap()
                    ->limit(80),
                TextColumn::make('product.sku')
                    ->label('SKU')
                    ->searchable()
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('position')
                    ->label('Showcase position')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('product.supplier.name')
                    ->label('Supplier')
                    ->state(function (ShowcaseTableProduct $record): string {
                        $supplier = $record->product?->supplier;

                        return $supplier === null ? 'No supplier' : $supplier->name;
                    })
                    ->searchable()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('product.status')
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
                    ->state(fn (ShowcaseTableProduct $record): bool => $record->product?->sku === 'DEMO-CHAIR-001')
                    ->toggleable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'active' => 'Active',
                        'draft' => 'Draft',
                        'archived' => 'Archived',
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query->when(
                            filled($data['value'] ?? null),
                            fn (Builder $query): Builder => $query->whereHas('product', fn (Builder $query): Builder => $query->where('status', $data['value'])),
                        );
                    }),
            ])
            ->groups([
                Group::make('product.status')->label('Status')->collapsible(),
                Group::make('product.supplier.name')->label('Supplier')->collapsible(),
            ])
            ->defaultSort('position')
            ->persistSortInSession(false)
            ->persistSearchInSession(false)
            ->persistFiltersInSession(false)
            ->deselectAllRecordsWhenFiltered()
            ->reorderable('position')
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
