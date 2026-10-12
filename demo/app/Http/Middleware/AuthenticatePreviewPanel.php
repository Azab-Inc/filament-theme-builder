<?php

namespace App\Http\Middleware;

use Closure;
use Filament\Http\Middleware\Authenticate;

class AuthenticatePreviewPanel extends Authenticate
{
    public function handle($request, Closure $next, ...$guards)
    {
        if ($request->routeIs(
            'filament.admin.pages.dashboard',
            'filament.admin.pages.demo-showcase-dashboard',
            'filament.admin.pages.showcase',
            'filament.admin.pages.anonymous-upload',
            'filament.admin.auth.logout',
        )) {
            return $next($request);
        }

        return parent::handle($request, $next, ...$guards);
    }
}
