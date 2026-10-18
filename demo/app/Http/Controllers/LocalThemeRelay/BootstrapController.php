<?php

declare(strict_types=1);

namespace App\Http\Controllers\LocalThemeRelay;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BootstrapController extends SafeRelayController
{
    public function __invoke(Request $request): JsonResponse
    {
        return $this->safely(fn (): JsonResponse => response()->json(['version' => 1, 'origin' => config('local-theme-relay.origin'),
            'host' => config('local-theme-relay.host'), 'csrfToken' => $request->session()->token(), 'enabled' => true]));
    }
}
