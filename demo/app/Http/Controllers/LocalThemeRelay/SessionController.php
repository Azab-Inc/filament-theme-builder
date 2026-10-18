<?php

declare(strict_types=1);

namespace App\Http\Controllers\LocalThemeRelay;

use App\Http\Requests\LocalThemeRelay\RelayRequestValidator;
use App\Mcp\ThemeRelay\BrowserSessionDisconnectLifecycle;
use App\Mcp\ThemeRelay\BrowserSessionLifecycle;
use App\Mcp\ThemeRelay\RelayClock;
use App\Mcp\ThemeRelay\RelayLifecycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SessionController extends SafeRelayController
{
    public function poll(Request $request, BrowserSessionLifecycle $sessions): JsonResponse
    {
        return $this->safely(function () use ($request, $sessions): JsonResponse {
            $body = RelayRequestValidator::exact($request, ['version', 'sessionId']);
            $session = $body ? $this->authorized($request, $body['sessionId'], $sessions) : null;

            return $session ? response()->json(['version' => 1, 'operations' => $sessions->poll($session)])
                : response()->json(['error' => 'pairing_required'], 404);
        });
    }

    public function heartbeat(Request $request, BrowserSessionLifecycle $sessions, RelayLifecycle $lifecycle,
        RelayClock $clock): JsonResponse
    {
        return $this->safely(function () use ($request, $sessions, $lifecycle, $clock): JsonResponse {
            $body = RelayRequestValidator::exact($request, ['version', 'sessionId']);
            $session = $body ? $this->authorized($request, $body['sessionId'], $sessions) : null;
            if (! $session) {
                return response()->json(['error' => 'pairing_required'], 404);
            }
            $lifecycle->heartbeat($session['pairingId'], $session['processId']);

            return response()->json(['version' => 1, 'status' => 'alive',
                'leaseExpiresAt' => $clock->now() + (int) config('local-theme-relay.lease_seconds', 45)]);
        });
    }

    public function disconnect(Request $request, BrowserSessionLifecycle $sessions,
        BrowserSessionDisconnectLifecycle $disconnect): JsonResponse
    {
        return $this->safely(function () use ($request, $sessions, $disconnect): JsonResponse {
            $body = RelayRequestValidator::exact($request, ['version', 'sessionId']);
            $session = $body ? $this->authorized($request, $body['sessionId'], $sessions) : null;
            if (! $session) {
                return response()->json(['error' => 'pairing_required'], 404);
            }
            $disconnect->disconnect($session);

            return response()->json(['version' => 1, 'status' => 'disconnected']);
        });
    }

    /** @return array<string, mixed>|null */
    private function authorized(Request $request, mixed $sessionId, BrowserSessionLifecycle $sessions): ?array
    {
        return is_string($sessionId) ? $sessions->authorize($sessionId,
            hash('sha256', (string) $request->header('X-FTB-Tab-Key')), $request->session()->getId()) : null;
    }
}
