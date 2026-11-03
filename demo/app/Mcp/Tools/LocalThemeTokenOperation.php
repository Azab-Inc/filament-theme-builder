<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLimits;
use App\Mcp\ThemeRelay\ThemeTokenOperation;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeTokenOperation extends LocalThemeTool
{
    protected string $name = 'local_theme_token_operation';

    protected string $description = 'Discover, read, preview, set, reset, link, or unlink named colors and custom palettes through the paired browser import boundary.';

    public function schema(JsonSchema $schema): array
    {
        return [
            'pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->required(),
            'action' => $schema->string()->enum(['discover', 'read', 'preview', 'set', 'reset', 'link', 'unlink'])->required(),
            'raw_json' => $schema->string()->min(1)->max(RelayLimits::MAX_THEME_BYTES),
            'target' => $schema->object(),
            'mode' => $schema->string()->enum(['light', 'dark']),
            'value' => $schema->string()->pattern('^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$'),
            'proposed_name' => $schema->string()->min(1)->max(120),
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
                if (! array_key_exists('raw_json', $input)) return ThemeTokenOperation::capabilities();
                $raw = $this->boundedString($input['raw_json'], RelayLimits::MAX_THEME_BYTES);
                $theme = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
                if (! is_array($theme)) throw new \InvalidArgumentException('invalid_theme');
                return ['capabilities' => ThemeTokenOperation::capabilities(), 'available' => ThemeTokenOperation::read($theme)];
            }
            $raw = $this->boundedString($input['raw_json'] ?? null, RelayLimits::MAX_THEME_BYTES);
            $theme = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($theme)) throw new \InvalidArgumentException('invalid_theme');
            $target = $input['target'] ?? null;
            if ($action === 'read') return ThemeTokenOperation::read($theme, is_array($target) ? $target : null);
            if (! is_array($target)) throw new \InvalidArgumentException('invalid_target');
            $candidate = ThemeTokenOperation::mutate($theme, $target, $action, $input['mode'] ?? null, $input['value'] ?? null);
            $payload = json_encode($candidate, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            $id = app(OperationStore::class)->create('import', $pairing, $this->scope->processId, hash('sha256', $payload));
            if (! app(OperationPayloadLifecycle::class)->publish($id, $pairing, $this->scope->processId, $payload, 'filament-theme.json', (string) ($input['proposed_name'] ?? 'Token operation'))) {
                throw new \RuntimeException('pairing_required');
            }

            return ['operation_id' => $id, 'kind' => 'import', 'status' => 'pending', 'action' => $action, 'boundary' => 'browser_preview_and_revision_grant'];
        });
    }
}
