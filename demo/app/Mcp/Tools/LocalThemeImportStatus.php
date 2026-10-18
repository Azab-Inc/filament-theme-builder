<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeImportStatus extends LocalThemeStatusTool
{
    protected string $name = 'local_theme_import_status';

    protected string $description = 'Retrieve import-only status for a paired browser import operation.';

    public function schema(JsonSchema $schema): array
    {
        return ['operation_id' => $schema->string()->pattern('^[a-f0-9]{64}$')->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->operationStatus($request, true);
    }
}
