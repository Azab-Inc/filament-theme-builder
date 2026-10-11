<?php

namespace App\Providers\Filament;

use App\Filament\Auth\Pages\Login;
use App\Http\Middleware\AuthenticatePreviewPanel;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
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
        // Only the dashboard preview and logout route bypass panel authentication.
        return $panel
            ->default()
            ->id('admin')
            ->path('demo/admin')
            ->brandName('Filament Theme Builder')
            ->brandLogo(new HtmlString(File::get(resource_path('views/filament/branding/logo-light.svg'))))
            ->darkModeBrandLogo(new HtmlString(File::get(resource_path('views/filament/branding/logo-dark.svg'))))
            ->brandLogoHeight('2.5rem')
            ->favicon('data:image/svg+xml;base64,'.base64_encode(File::get(resource_path('views/filament/branding/favicon.svg'))))
            ->login(Login::class)
            ->profile()
            ->breadcrumbs(true, true)
            ->subNavigationPosition(SubNavigationPosition::Top)
            ->globalSearch()
            ->globalSearchKeyBindings(['ctrl+k'])
            ->globalSearchFieldKeyBindingSuffix()
            ->sidebarCollapsibleOnDesktop()
            ->sidebarFullyCollapsibleOnDesktop()
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
                Dashboard::class,
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
}
