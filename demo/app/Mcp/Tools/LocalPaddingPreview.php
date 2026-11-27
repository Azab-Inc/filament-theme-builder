<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalPaddingPreview extends LocalPaddingMutationTool
{
    protected string $name = 'local_padding_preview';

    protected string $description = 'Preview a validated padding set or reset through the paired browser.';

    public function schema(JsonSchema $schema): array
    {
        return [...$this->mutationSchema($schema), 'operation' => $schema->string()->enum(['set', 'reset'])->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        $operation = $request->all()['operation'] ?? null;

        return in_array($operation, ['set', 'reset'], true) ? $this->stage($request, $operation) : $this->safe(fn (): array => ['error' => 'invalid_input']);
    }
}
