<?php

namespace App\Providers;

use App\Filament\Auth\Responses\LogoutResponse;
use App\Mcp\Commands\ServeLocalThemeMcp;
use App\Mcp\ThemeRelay\FileRelayStore;
use App\Mcp\ThemeRelay\RelayClock;
use App\Mcp\ThemeRelay\RelayStore;
use App\Mcp\ThemeRelay\SystemRelayClock;
use Carbon\CarbonImmutable;
use Filament\Auth\Http\Responses\Contracts\LogoutResponse as LogoutResponseContract;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(LogoutResponseContract::class, LogoutResponse::class);
        $this->app->singleton(RelayStore::class, fn () => new FileRelayStore((string) config('local-theme-relay.storage_path')));
        $this->app->singleton(RelayClock::class, SystemRelayClock::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        if (app()->runningInConsole() && config('local-theme-relay.enabled') && app()->environment(['local', 'testing'])) {
            $this->commands([ServeLocalThemeMcp::class]);
        }

    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
