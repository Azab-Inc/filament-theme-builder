<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationStore;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalPaddingRead extends LocalThemeTool
{
    protected string $name = 'local_padding_read';

    protected string $description = 'Read resolved padding and per-edge provenance through the paired browser.';

    public function schema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->required(), 'target_id' => $schema->string()->required(), 'context' => $schema->object()->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $input = $this->input($request, ['pairing_id', 'target_id', 'context']);
            $pairing = $this->boundedString($input['pairing_id'], 120);
            if (! is_array($input['context'])) {
                throw new \InvalidArgumentException('invalid_input');
            }
            $this->authorize($pairing);
            $payload = json_encode(['schemaVersion' => 1, 'kind' => 'theme-intent', 'action' => 'read', 'target' => ['kind' => 'padding', 'targetId' => $input['target_id'], 'context' => $input['context']]], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            $id = app(OperationStore::class)->create('padding-read', $pairing, $this->scope->processId, hash('sha256', $payload));
            if (! app(OperationPayloadLifecycle::class)->publish($id, $pairing, $this->scope->processId, $payload, 'filament-theme-intent.json', 'Padding read')) {
                throw new \RuntimeException('pairing_required');
            }

            return ['operation_id' => $id, 'kind' => 'padding_read', 'status' => 'pending', 'boundary' => 'browser_preview_and_revision_grant'];
        });
    }
}
