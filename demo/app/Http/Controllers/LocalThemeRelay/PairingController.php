<?php

declare(strict_types=1);

namespace App\Http\Controllers\LocalThemeRelay;

use App\Http\Requests\LocalThemeRelay\RelayRequestValidator;
use App\Mcp\ThemeRelay\PairingHttpLifecycle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PairingController extends SafeRelayController
{
    public function create(Request $request, PairingHttpLifecycle $pairings): JsonResponse
    {
        $body = RelayRequestValidator::exact($request, ['version', 'pairingId']);
        if ($body === null
            || ! is_string($body['pairingId']) || ! preg_match('/\A[a-zA-Z0-9_-]{1,120}\z/', $body['pairingId'])) {
            return response()->json(['error' => 'invalid_request'], 422);
        }

        return $this->safely(function () use ($request, $pairings, $body): JsonResponse {
            $result = $pairings->create($body['pairingId'], hash('sha256', (string) $request->header('X-FTB-Tab-Key')),
                $request->session()->getId());

            return response()->json($result);
        });
    }

    public function status(Request $request, string $id, PairingHttpLifecycle $pairings): JsonResponse
    {
        if (! preg_match('/\A[a-zA-Z0-9_-]{1,120}\z/', $id)) {
            return response()->json(['error' => 'pairing_required'], 404);
        }

        return $this->safely(function () use ($request, $id, $pairings): JsonResponse {
            $result = $pairings->status($id, hash('sha256', (string) $request->header('X-FTB-Tab-Key')),
                $request->session()->getId());

            return $result === null ? response()->json(['error' => 'pairing_required'], 404) : response()->json($result);
        });
    }

    public function approve(Request $request, string $id, PairingHttpLifecycle $pairings): JsonResponse
    {
        $body = RelayRequestValidator::exact($request, ['version', 'claimId']);
        if ($body === null
            || ! is_string($body['claimId']) || ! preg_match('/\A[a-f0-9]{64}\z/', $body['claimId'])) {
            return response()->json(['error' => 'invalid_request'], 422);
        }
        if (! preg_match('/\A[a-zA-Z0-9_-]{1,120}\z/', $id)) {
            return response()->json(['error' => 'pairing_required'], 404);
        }

        return $this->safely(function () use ($request, $id, $pairings, $body): JsonResponse {
            $result = $pairings->approve($id, $body['claimId'], hash('sha256', (string) $request->header('X-FTB-Tab-Key')),
                $request->session()->getId());

            return $result === null ? response()->json(['error' => 'pairing_required'], 404) : response()->json($result);
        });
    }
}
