<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationResultLifecycle;
use App\Mcp\ThemeRelay\OperationResultStore;
use App\Mcp\ThemeRelay\OperationStore;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

abstract class LocalThemeStatusTool extends LocalThemeTool
{
    protected function operationStatus(Request $request, bool $importsOnly): ResponseFactory
    {
        return $this->safe(function () use ($request, $importsOnly): array {
            $id = $this->boundedString($this->input($request, ['operation_id'])['operation_id'], 64, 64);
            if (! preg_match('/\A[a-f0-9]{64}\z/', $id)) {
                throw new \RuntimeException('pairing_required');
            }
            $operation = app(OperationStore::class)->read($id);
            if (! $operation || ($operation['processId'] ?? null) !== $this->scope->processId
                || ($importsOnly && ($operation['kind'] ?? null) !== 'import')) {
                throw new \RuntimeException('pairing_required');
            }
            $session = $this->authorize((string) ($operation['pairingId'] ?? ''));
            $status = app(OperationResultLifecycle::class)->status($id, $session);
            if (! $status) {
                throw new \RuntimeException('pairing_required');
            }
            $result = ['operation_id' => $id, 'kind' => $status['kind'], 'status' => $status['status']];
            foreach (['recordId' => 'record_id', 'errorCategory' => 'error_category'] as $source => $target) {
                if (is_string($status[$source] ?? null)) {
                    $result[$target] = $status[$source];
                }
            }
            if (is_array($operation['preview'] ?? null)) {
                $result['digest'] = $operation['digest'];
                $result['preview'] = $operation['preview'];
            }
            if (in_array($status['kind'], ['list', 'export'], true) && $status['status'] === 'approved') {
                $json = app(OperationResultStore::class)->consume($id, $operation['pairingId'], $this->scope->processId);
                if ($json !== null) {
                    $value = json_decode($json, true);
                    if (is_array($value)) {
                        unset($value['version']);
                        $result['result'] = $value;
                    }
                }
            }

            return $result;
        });
    }
}
