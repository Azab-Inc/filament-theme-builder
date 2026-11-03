<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLimits;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeTokenOperation extends LocalThemeTool
{
    protected string $name = 'local_theme_token_operation';

    protected string $description = 'Discover, read, preview, set, reset, link, unlink, create, update, or remove supported theme targets through the paired browser domain boundary.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->required(),
            'action' => $schema->string()->enum(['discover', 'read', 'preview', 'set', 'reset', 'link', 'unlink', 'create-color', 'create-palette', 'update', 'remove'])->required(),
            'target' => $schema->object(),
            'mode' => $schema->string()->enum(['light', 'dark']),
            'value' => $schema->string()->max(512),
            'proposed_name' => $schema->string()->min(1)->max(120),
            'theme_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->max(120),
        ];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $input = $request->all();
            $pairing = $this->boundedString($input['pairing_id'] ?? null, 120);
            $this->authorize($pairing);
            $action = $this->boundedString($input['action'] ?? null, 16);
            if ($action === 'discover') {
                return [
                    'target_kinds' => ['semantic', 'raw', 'foundation', 'palette-base', 'palette-shade', 'user-color', 'user-palette-base', 'user-palette-shade'],
                    'actions' => ['read', 'preview', 'set', 'reset', 'link', 'unlink', 'create-color', 'create-palette', 'update', 'remove'],
                    'read_boundary' => 'local_theme_export',
                    'mutation_boundary' => 'browser_theme_intent_preview_revision_grant',
                ];
            }
            $target = $input['target'] ?? null;
            if ($action === 'read') {
                $theme = $this->boundedString($input['theme_id'] ?? null, 120);
                $operation = app(OperationStore::class)->create('export', $pairing, $this->scope->processId, hash('sha256', 'export:'.$pairing.':'.$theme), $theme);

                return ['operation_id' => $operation, 'kind' => 'export', 'status' => 'pending', 'target' => $target];
            }
            if (! is_array($target)) {
                throw new \InvalidArgumentException('invalid_target');
            }
            $intentAction = $action === 'preview' ? (array_key_exists('value', $input) ? 'set' : 'reset') : $action;
            if (in_array($intentAction, ['create-color', 'create-palette', 'update', 'set'], true) && ! array_key_exists('value', $input)) {
                throw new \InvalidArgumentException('missing_value');
            }
            $payloadData = ['schemaVersion' => 1, 'kind' => 'theme-intent', 'action' => $intentAction, 'target' => $target];
            if (array_key_exists('mode', $input)) {
                $payloadData['mode'] = $input['mode'];
            }
            if (array_key_exists('value', $input)) {
                $payloadData['value'] = $input['value'];
            }
            $payload = json_encode($payloadData, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            if (strlen($payload) > RelayLimits::MAX_THEME_BYTES) {
                throw new \InvalidArgumentException('invalid_input');
            }
            $id = app(OperationStore::class)->create('import', $pairing, $this->scope->processId, hash('sha256', $payload));
            if (! app(OperationPayloadLifecycle::class)->publish($id, $pairing, $this->scope->processId, $payload, 'filament-theme-intent.json', (string) ($input['proposed_name'] ?? 'Token operation'))) {
                throw new \RuntimeException('pairing_required');
            }

            return ['operation_id' => $id, 'kind' => 'import', 'status' => 'pending', 'action' => $action, 'boundary' => 'browser_preview_and_revision_grant'];
        });
    }
}
