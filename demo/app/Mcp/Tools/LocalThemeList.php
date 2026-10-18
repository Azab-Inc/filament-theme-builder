<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\OperationStore;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeList extends LocalThemeTool
{
    protected string $name = 'local_theme_list';

    protected string $description = 'Request local theme metadata from the paired browser.';

    public function schema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->max(120)->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $id = $this->boundedString($this->input($request, ['pairing_id'])['pairing_id'], 120);
            $this->authorize($id);
            $operation = app(OperationStore::class)->create('list', $id, $this->scope->processId, hash('sha256', 'list:'.$id));

            return ['operation_id' => $operation, 'kind' => 'list', 'status' => 'pending'];
        });
    }
}
