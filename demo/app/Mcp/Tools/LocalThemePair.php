<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemePair extends LocalThemeTool
{
    protected string $name = 'local_theme_pair';

    protected string $description = 'Check or bind a browser-approved pairing for this MCP process.';

    public function schema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->max(120)->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $id = $this->boundedString($this->input($request, ['pairing_id'])['pairing_id'], 120);
            $pair = $this->pairing($id);
            if ($pair['status'] === 'pending') {
                return ['pairing_id' => $id, 'status' => 'pending', 'expires_at' => $pair['expiresAt']];
            }
            if (! is_string($pair['sessionId'] ?? null)
                || ! $this->lifecycle->bindPairing($id, $this->scope->processId, $pair['sessionId'])) {
                throw new \RuntimeException('pairing_required');
            }

            return ['pairing_id' => $id, 'status' => 'approved', 'expires_at' => $pair['expiresAt']];
        });
    }
}
