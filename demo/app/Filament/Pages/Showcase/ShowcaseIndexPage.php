<?php

namespace App\Filament\Pages\Showcase;

use BackedEnum;
use Filament\Navigation\NavigationItem;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class ShowcaseIndexPage extends Page
{
    protected static ?string $title = 'Showcase';

    protected static ?string $breadcrumb = 'Showcase';

    protected static ?string $navigationLabel = 'Showcase';

    protected static string|UnitEnum|null $navigationGroup = null;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSparkles;

    protected static ?int $navigationSort = 1;

    protected string $view = 'filament.pages.showcase.showcase';

    public static function getSlug(?Panel $panel = null): string
    {
        return 'showcase';
    }

    /**
     * @return array<int, NavigationItem>
     */
    public function getSubNavigation(): array
    {
        return [
            NavigationItem::make('Dashboard')
                ->url(DemoShowcaseDashboard::getUrl())
                ->icon(Heroicon::OutlinedHome),
            NavigationItem::make('Forms & Schemas')
                ->url(FormsShowcase::getUrl())
                ->icon(Heroicon::OutlinedPencilSquare),
            NavigationItem::make('Tables')
                ->url(TablesShowcase::getUrl())
                ->icon(Heroicon::OutlinedTableCells),
            NavigationItem::make('Infolists')
                ->url(InfolistsShowcase::getUrl())
                ->icon(Heroicon::OutlinedListBullet),
            NavigationItem::make('Actions & Modals')
                ->url(ActionsShowcase::getUrl())
                ->icon(Heroicon::OutlinedCursorArrowRays),
            NavigationItem::make('Notifications')
                ->url(NotificationsShowcase::getUrl())
                ->icon(Heroicon::OutlinedBell),
            NavigationItem::make('Forced states')
                ->url(ShowcaseStateControls::getUrl())
                ->icon(Heroicon::OutlinedAdjustmentsHorizontal),
        ];
    }
}
