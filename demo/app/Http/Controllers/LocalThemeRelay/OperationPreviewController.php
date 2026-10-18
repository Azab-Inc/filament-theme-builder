<?php

declare(strict_types=1);

namespace App\Http\Controllers\LocalThemeRelay;

use App\Http\Requests\LocalThemeRelay\RelayRequestValidator;
use App\Mcp\ThemeRelay\BrowserSessionLifecycle;
use App\Mcp\ThemeRelay\OperationPreviewLifecycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class OperationPreviewController extends SafeRelayController
{
    public function preview(Request $request, string $id, BrowserSessionLifecycle $sessions,
        OperationPreviewLifecycle $previews): JsonResponse
    {
        return $this->safely(function () use ($request, $id, $sessions, $previews): JsonResponse {
            $body = RelayRequestValidator::exact($request, ['version', 'preview']);
            $session = $this->authorized($request, $sessions);
            if (! $body || ! is_array($body['preview']) || ! is_string($body['preview']['payloadDigest'] ?? null)
                || ! preg_match('/\A[a-f0-9]{64}\z/', $body['preview']['payloadDigest'])
                || ! RelayRequestValidator::id($id) || ! $session) {
                return response()->json(['error' => 'operation_unavailable'], 404);
            }
            $status = $previews->record($id, $body['preview'], $session);

            return $status === null ? response()->json(['error' => 'operation_unavailable'], 404)
                : response()->json(['version' => 1, 'status' => $status, 'digest' => $body['preview']['payloadDigest']]);
        });
    }

    public function authorizeApply(Request $request, string $id, BrowserSessionLifecycle $sessions,
        OperationPreviewLifecycle $previews): JsonResponse
    {
        return $this->safely(function () use ($request, $id, $sessions, $previews): JsonResponse {
            $body = RelayRequestValidator::exact($request, ['version', 'digest', 'revision', 'displayName']);
            $session = $this->authorized($request, $sessions);
            if (! $body || ! is_string($body['digest']) || ! preg_match('/\A[a-f0-9]{64}\z/', $body['digest'])
                || ! is_int($body['revision']) || $body['revision'] < 0 || ! is_string($body['displayName'])
                || mb_strlen($body['displayName']) > 120 || ! RelayRequestValidator::id($id) || ! $session) {
                return response()->json(['error' => 'invalid_request'], 422);
            }
            $grant = $previews->authorizeApply($id, $body['digest'], $body['revision'], $body['displayName'], $session);

            return response()->json($grant ?? ['version' => 1, 'status' => 'rejected', 'errorCategory' => 'stale_revision']);
        });
    }

    /** @return array<string, mixed>|null */
    private function authorized(Request $request, BrowserSessionLifecycle $sessions): ?array
    {
        $id = $request->session()->getId();

        return $sessions->authorize($id, hash('sha256', (string) $request->header('X-FTB-Tab-Key')), $id);
    }
}
