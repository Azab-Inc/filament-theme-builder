<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationStore;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeExport extends LocalThemeTool
{
    protected string $name = 'local_theme_export';

    protected string $description = 'Request a safe canonical export from the paired browser.';

    public function schema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->max(120)->required(),
            'theme_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->max(120)->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $input = $this->input($request, ['pairing_id', 'theme_id']);
            $pairing = $this->boundedString($input['pairing_id'], 120);
            $theme = $this->boundedString($input['theme_id'], 120);
            $this->authorize($pairing);
            $operation = app(OperationStore::class)->create('export', $pairing, $this->scope->processId,
                hash('sha256', 'export:'.$pairing.':'.$theme), $theme);

            return ['operation_id' => $operation, 'kind' => 'export', 'status' => 'pending'];
        });
    }
}
