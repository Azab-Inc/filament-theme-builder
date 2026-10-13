<?php

namespace App\Providers\Filament;

use App\Filament\Auth\Pages\Login;
use App\Filament\Pages\Showcase\DemoShowcaseDashboard;
use App\Filament\Pages\Showcase\ShowcaseIndexPage;
use App\Filament\Support\IconConfiguration;
use App\Http\Middleware\AuthenticatePreviewPanel;
use App\Support\Branding\PanelBrandingSettings;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Enums\SubNavigationPosition;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\View\PanelsRenderHook;
use Filament\Widgets\AccountWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\File;
use Illuminate\Support\HtmlString;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        $panel = $panel
            ->brandName(fn (): string => PanelBrandingSettings::fromRequest(request())->appName())
            ->brandLogo(fn (): HtmlString|string => $this->logoFor(PanelBrandingSettings::fromRequest(request()), 'lightLogo'))
            ->darkModeBrandLogo(fn (): HtmlString|string => $this->logoFor(PanelBrandingSettings::fromRequest(request()), 'darkLogo'))
            ->brandLogoHeight(fn (): string => PanelBrandingSettings::fromRequest(request())->logoHeight())
            ->favicon(fn (): string => $this->faviconFor(PanelBrandingSettings::fromRequest(request())))
            ->maxContentWidth(fn (): string => PanelBrandingSettings::fromRequest(request())->contentWidth())
            ->sidebarCollapsibleOnDesktop(fn (): bool => PanelBrandingSettings::fromRequest(request())->sidebar() === 'collapsible')
            ->sidebarFullyCollapsibleOnDesktop(fn (): bool => PanelBrandingSettings::fromRequest(request())->sidebar() !== 'top-navigation')
            ->topNavigation(fn (): bool => PanelBrandingSettings::fromRequest(request())->sidebar() === 'top-navigation');

        // Only the dashboard preview and logout route bypass panel authentication.
        return $panel
            ->default()
            ->id('admin')
            ->path('demo/admin')
            ->login(Login::class)
            ->profile()
            ->breadcrumbs(true, true)
            ->subNavigationPosition(SubNavigationPosition::Top)
            ->globalSearch()
            ->globalSearchKeyBindings(['ctrl+k'])
            ->globalSearchFieldKeyBindingSuffix()
            ->icons(IconConfiguration::panelIcons())
            ->renderHook(
                PanelsRenderHook::BODY_END,
                fn (): string => view('filament.preview-bridge')->render(),
            )
            ->colors([
                'primary' => Color::Amber,
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                DemoShowcaseDashboard::class,
                ShowcaseIndexPage::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                AccountWidget::class,
            ])
            ->authMiddleware([
                AuthenticatePreviewPanel::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ]);
    }

    private function logoFor(PanelBrandingSettings $branding, string $variant): HtmlString|string
    {
        $asset = $branding->asset($variant);
        $logoVariant = $variant === 'lightLogo' ? 'light' : 'dark';

        return $asset === null
            ? new HtmlString(File::get(resource_path("views/filament/branding/logo-{$logoVariant}.svg")))
            : url('/api/branding-assets/'.$asset);
    }

    private function faviconFor(PanelBrandingSettings $branding): string
    {
        return $branding->asset('favicon') === null
            ? 'data:image/svg+xml;base64,'.base64_encode(File::get(resource_path('views/filament/branding/favicon.svg')))
            : url('/api/branding-assets/'.$branding->asset('favicon'));
    }
}
