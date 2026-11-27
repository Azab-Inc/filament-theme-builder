<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalPaddingSet extends LocalPaddingMutationTool
{
    protected string $name = 'local_padding_set';

    protected string $description = 'Stage a validated padding mutation for paired browser confirmation.';

    public function schema(JsonSchema $schema): array
    {
        return $this->mutationSchema($schema);
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->stage($request, 'set');
    }
}
