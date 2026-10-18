<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationPayloadLifecycle;
use App\Mcp\ThemeRelay\OperationStore;
use App\Mcp\ThemeRelay\RelayLimits;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeImportPreview extends LocalThemeTool
{
    protected string $name = 'local_theme_import_preview';

    protected string $description = 'Send a bounded theme document to the paired browser for preview; never applies it.';

    public function schema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->max(120)->required(),
            'raw_json' => $schema->string()->min(1)->max(RelayLimits::MAX_THEME_BYTES)->required(),
            'filename' => $schema->string()->enum(['filament-theme.json'])->required(),
            'proposed_name' => $schema->string()->min(1)->max(120)->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $input = $this->input($request, ['pairing_id', 'raw_json', 'filename', 'proposed_name']);
            $pairing = $this->boundedString($input['pairing_id'], 120);
            $raw = $this->boundedString($input['raw_json'], RelayLimits::MAX_THEME_BYTES);
            $filename = $this->boundedString($input['filename'], 64);
            $name = $this->boundedString($input['proposed_name'], 120);
            if ($filename !== 'filament-theme.json' || ! mb_check_encoding($raw, 'UTF-8') || strlen($raw) > RelayLimits::MAX_THEME_BYTES) {
                throw new \InvalidArgumentException('invalid_input');
            }
            $this->authorize($pairing);
            $digest = hash('sha256', $raw);
            $operations = app(OperationStore::class);
            $id = $operations->create('import', $pairing, $this->scope->processId, $digest);
            if (! app(OperationPayloadLifecycle::class)->publish($id, $pairing, $this->scope->processId, $raw, $filename, $name)) {
                throw new \RuntimeException('pairing_required');
            }

            return ['operation_id' => $id, 'kind' => 'import', 'status' => 'pending'];
        });
    }
}
