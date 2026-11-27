<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalPaddingDiscover extends LocalThemeTool
{
    protected string $name = 'local_padding_discover';

    protected string $description = 'Discover verified hierarchical padding targets and approved units.';

    public function schema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $input = $this->input($request, ['pairing_id']);
            $pairing = $this->boundedString($input['pairing_id'], 120);
            $this->authorize($pairing);
            $catalog = json_decode((string) file_get_contents(resource_path('theme-registry/filament-padding-targets.json')), true, 512, JSON_THROW_ON_ERROR);

            return ['kind' => 'padding_discover', 'status' => 'approved', 'catalog' => $catalog];
        });
    }
}
