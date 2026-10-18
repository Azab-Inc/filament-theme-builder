<?php

declare(strict_types=1);

namespace App\Http\Controllers\LocalThemeRelay;

use App\Http\Requests\LocalThemeRelay\RelayRequestValidator;
use App\Mcp\ThemeRelay\BrowserSessionLifecycle;
use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationReceiptLifecycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class OperationPayloadController extends SafeRelayController
{
    public function payload(Request $request, string $id, BrowserSessionLifecycle $sessions,
        OperationPayloadLifecycle $payloads): JsonResponse
    {
        return $this->safely(function () use ($request, $id, $sessions, $payloads): JsonResponse {
            $session = $this->authorized($request, $sessions);
            $result = $session && RelayRequestValidator::id($id) ? $payloads->read($id, $session) : null;

            return $result ? response()->json($result) : response()->json(['error' => 'operation_unavailable'], 404);
        });
    }

    public function receipt(Request $request, string $id, BrowserSessionLifecycle $sessions,
        OperationReceiptLifecycle $receipts): JsonResponse
    {
        return $this->safely(function () use ($request, $id, $sessions, $receipts): JsonResponse {
            $body = RelayRequestValidator::exact($request, ['version', 'digest', 'received']);
            $session = $this->authorized($request, $sessions);
            if (! $body || $body['received'] !== true || ! is_string($body['digest'])
                || ! preg_match('/\A[a-f0-9]{64}\z/', $body['digest']) || ! $session
                || ! RelayRequestValidator::id($id) || ! $receipts->acknowledgePayload($id, $body['digest'], $session)) {
                return response()->json(['error' => 'operation_unavailable'], 404);
            }

            return response()->json(['version' => 1, 'status' => 'received']);
        });
    }

    /** @return array<string, mixed>|null */
    private function authorized(Request $request, BrowserSessionLifecycle $sessions): ?array
    {
        return $sessions->authorize($request->session()->getId(),
            hash('sha256', (string) $request->header('X-FTB-Tab-Key')), $request->session()->getId());
    }
}
