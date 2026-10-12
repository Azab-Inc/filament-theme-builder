<?php

namespace Tests\Feature\Filament\Showcase;

use App\Filament\Pages\Showcase\ActionsShowcase;
use App\Filament\Pages\Showcase\DemoShowcaseDashboard;
use App\Filament\Pages\Showcase\FormsShowcase;
use App\Filament\Pages\Showcase\GlobalSearchSurface;
use App\Filament\Pages\Showcase\InfolistsShowcase;
use App\Filament\Pages\Showcase\LoginSurface;
use App\Filament\Pages\Showcase\NotificationsShowcase;
use App\Filament\Pages\Showcase\ProfileMenuSurface;
use App\Filament\Pages\Showcase\RepresentativeBadgeSet;
use App\Filament\Pages\Showcase\ResourceIconSet;
use App\Filament\Pages\Showcase\ShowcaseIndexPage;
use App\Filament\Pages\Showcase\ShowcaseSidebarNavigation;
use App\Filament\Pages\Showcase\TablesShowcase;
use App\Filament\Pages\Showcase\TenantSwitcherSurface;
use App\Filament\Widgets\CommerceStatsOverviewWidget;
use App\Filament\Widgets\LowStockWidget;
use App\Filament\Widgets\RecentOrdersWidget;
use App\Filament\Widgets\RevenueOrdersChartWidget;
use App\Models\User;
use App\Providers\Filament\AdminPanelProvider;
use Filament\Enums\GlobalSearchPosition;
use Filament\Panel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Livewire\Livewire;
use Tests\TestCase;

class NavigationShowcaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_showcase_index_links_to_real_native_pages_and_dashboard(): void
    {
        $this->get('/demo/admin/showcase')
            ->assertOk()
            ->assertSee('Showcase')
            ->assertSee('Dashboard')
            ->assertSee('/demo/admin')
            ->assertSee('/demo/admin/forms-showcase')
            ->assertSee('/demo/admin/tables-showcase')
            ->assertSee('/demo/admin/infolists-showcase')
            ->assertSee('/demo/admin/actions-showcase')
            ->assertSee('/demo/admin/notifications-showcase')
            ->assertSee('Controlled tenant presentation')
            ->assertSee('No tenant is persisted');
    }

    public function test_showcase_page_uses_native_sub_navigation_and_breadcrumbs_without_a_second_registry(): void
    {
        $this->seed();
        $this->actingAs(User::query()->where('email', 'user')->firstOrFail());

        Livewire::test(ShowcaseIndexPage::class)
            ->assertSeeInOrder(['Dashboard', 'Forms & Schemas', 'Tables', 'Infolists', 'Actions & Modals', 'Notifications', 'Forced states']);

        $page = Livewire::test(ShowcaseIndexPage::class)->instance();
        $subNavigation = collect($page->getCachedSubNavigation())
            ->flatMap(fn ($group): array => $group->getItems())
            ->map(fn ($item): string => $item->getLabel())
            ->all();

        $this->assertSame([
            'Dashboard',
            'Forms & Schemas',
            'Tables',
            'Infolists',
            'Actions & Modals',
            'Notifications',
            'Forced states',
        ], $subNavigation);
        $this->assertSame(['Showcase'], $page->getBreadcrumbs());
    }

    public function test_panel_enables_native_search_keyboard_binding_and_collapsible_sidebar(): void
    {
        $panel = (new AdminPanelProvider(app()))->panel(Panel::make());

        $this->assertSame(GlobalSearchPosition::Topbar, $panel->getGlobalSearchPosition());
        $this->assertSame(['ctrl+k'], $panel->getGlobalSearchKeyBindings());
        $this->assertTrue($panel->isSidebarCollapsibleOnDesktop());
        $this->assertTrue($panel->isSidebarFullyCollapsibleOnDesktop());
        $this->assertFalse($panel->hasTenancy());

        $pages = $panel->getPages();
        $this->assertSame(1, count(array_filter($pages, fn (string $page): bool => $page === ShowcaseIndexPage::class)));
        $this->assertContains(FormsShowcase::class, $pages);
        $this->assertContains(TablesShowcase::class, $pages);
        $this->assertContains(InfolistsShowcase::class, $pages);
        $this->assertContains(ActionsShowcase::class, $pages);
        $this->assertContains(NotificationsShowcase::class, $pages);

        foreach ([CommerceStatsOverviewWidget::class, RevenueOrdersChartWidget::class, RecentOrdersWidget::class, LowStockWidget::class] as $widget) {
            $this->assertSame(1, count(array_filter($panel->getWidgets(), fn (string $registered): bool => $registered === $widget)));
        }
        $this->assertContains(DemoShowcaseDashboard::class, $panel->getPages());
        $this->assertSame(1, count(array_filter($pages, fn (string $page): bool => $page === DemoShowcaseDashboard::class)));
        foreach ([ResourceIconSet::class, RepresentativeBadgeSet::class, ShowcaseSidebarNavigation::class, GlobalSearchSurface::class, ProfileMenuSurface::class, LoginSurface::class, TenantSwitcherSurface::class] as $surface) {
            $this->assertTrue(class_exists($surface));
        }
    }

    public function test_showcase_pages_remain_authenticated_while_public_preview_and_credentials_are_preserved(): void
    {
        $this->get('/demo/admin/forms-showcase')->assertRedirect('/demo/admin/login');
        $this->get('/demo/admin/showcase')->assertOk();

        $this->get('/demo/admin/login')
            ->assertOk()
            ->assertSee('Username: user')
            ->assertSee('Password: password');
    }

    public function test_showcase_navigation_is_request_scoped_and_does_not_persist_tenant_state(): void
    {
        DB::connection()->enableQueryLog();

        $this->get('/demo/admin/showcase')
            ->assertOk()
            ->assertSee('data-tenant-persistence="none"', false);

        Livewire::test(ShowcaseIndexPage::class)->call('refresh');

        $writes = collect(DB::connection()->getQueryLog())
            ->filter(fn (array $query): bool => preg_match('/^(insert|update|delete|replace|alter|create|drop|truncate)\s/i', trim($query['query'])) === 1);

        $this->assertCount(0, $writes);
        $this->assertFalse(filament()->hasTenancy());
        $this->assertArrayNotHasKey('tenant', session()->all());
        $this->assertArrayNotHasKey('filament_tenant', session()->all());
    }
}
