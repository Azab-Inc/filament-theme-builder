<?php

declare(strict_types=1);

namespace App\Http\Controllers\LocalThemeRelay;

use App\Http\Requests\LocalThemeRelay\RelayRequestValidator;
use App\Mcp\ThemeRelay\BrowserSessionLifecycle;
use App\Mcp\ThemeRelay\OperationResultLifecycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class OperationResultController extends SafeRelayController
{
    public function publish(Request $request, string $id, BrowserSessionLifecycle $sessions,
        OperationResultLifecycle $results): JsonResponse
    {
        return $this->safely(function () use ($request, $id, $sessions, $results): JsonResponse {
            $body = $request->json()->all();
            $session = $this->authorized($request, $sessions);
            if (($body['version'] ?? null) !== 1 || ! $session || ! RelayRequestValidator::id($id)) {
                return response()->json(['error' => 'invalid_request'], 422);
            }
            $status = $results->publish($id, $body, $session);

            return $status ? response()->json(['version' => 1, 'status' => $status])
                : response()->json(['error' => 'operation_unavailable'], 404);
        });
    }

    public function status(Request $request, string $id, BrowserSessionLifecycle $sessions,
        OperationResultLifecycle $results): JsonResponse
    {
        return $this->safely(function () use ($request, $id, $sessions, $results): JsonResponse {
            $session = $this->authorized($request, $sessions);
            $status = $session && RelayRequestValidator::id($id) ? $results->status($id, $session) : null;

            return $status ? response()->json($status) : response()->json(['error' => 'operation_unavailable'], 404);
        });
    }

    /** @return array<string, mixed>|null */
    private function authorized(Request $request, BrowserSessionLifecycle $sessions): ?array
    {
        $id = $request->session()->getId();

        return $sessions->authorize($id, hash('sha256', (string) $request->header('X-FTB-Tab-Key')), $id);
    }
}
