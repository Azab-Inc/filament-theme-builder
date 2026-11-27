<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLimits;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

abstract class LocalPaddingMutationTool extends LocalThemeTool
{
    /** @return array<string, mixed> */
    protected function mutationSchema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->required(),
            'context' => $schema->object()->required(), 'edges' => $schema->object(), 'reset_edges' => $schema->array()];
    }

    protected function stage(Request $request, string $operation): ResponseFactory
    {
        return $this->safe(function () use ($request, $operation): array {
            $input = $request->all();
            if (array_diff(array_keys($input), ['pairing_id', 'context', 'edges', 'reset_edges', 'operation'])
                || ! array_key_exists('context', $input) || ! is_array($input['context'])) {
                throw new \InvalidArgumentException('invalid_input');
            }
            $pairing = $this->boundedString($input['pairing_id'] ?? null, 120);
            $this->authorize($pairing);
            $payload = json_encode(['schemaVersion' => 1, 'kind' => 'theme-intent', 'action' => $operation,
                'target' => ['kind' => 'padding', 'targetId' => $input['context']['targetId'] ?? '', 'context' => $input['context'],
                    ...(isset($input['edges']) && $input['edges'] !== [] ? ['edges' => $input['edges']] : []),
                    ...(isset($input['reset_edges']) && $input['reset_edges'] !== [] ? ['resetEdges' => $input['reset_edges']] : [])]], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            if (strlen($payload) > RelayLimits::MAX_THEME_BYTES) {
                throw new \InvalidArgumentException('invalid_input');
            }
            $id = app(OperationStore::class)->create('import', $pairing, $this->scope->processId, hash('sha256', $payload));
            if (! app(OperationPayloadLifecycle::class)->publish($id, $pairing, $this->scope->processId, $payload, 'filament-theme-intent.json', 'Padding '.$operation)) {
                throw new \RuntimeException('pairing_required');
            }

            return ['operation_id' => $id, 'kind' => 'padding_'.$operation, 'status' => 'pending', 'boundary' => 'browser_preview_and_revision_grant'];
        });
    }
}
