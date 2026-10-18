<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeOperationStatus extends LocalThemeStatusTool
{
    protected string $name = 'local_theme_operation_status';

    protected string $description = 'Retrieve status and any available one-shot result for an owned operation.';

    public function schema(JsonSchema $schema): array
    {
        return ['operation_id' => $schema->string()->pattern('^[a-f0-9]{64}$')->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->operationStatus($request, false);
    }
}
