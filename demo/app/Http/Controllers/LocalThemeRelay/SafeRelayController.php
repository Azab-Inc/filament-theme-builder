<?php

declare(strict_types=1);

namespace App\Http\Controllers\LocalThemeRelay;

use Closure;
use Illuminate\Http\JsonResponse;
use Throwable;

abstract class SafeRelayController
{
    /** @param Closure(): JsonResponse $action */
    protected function safely(Closure $action): JsonResponse
    {
        try {
            return $action();
        } catch (Throwable) {
            return response()->json(['error' => 'relay_unavailable'], 503);
        }
    }
}
