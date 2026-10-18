<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Mcp\ThemeRelay\BrowserSessionDisconnectLifecycle;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\ResponseFactory;

final class LocalThemeDisconnect extends LocalThemeTool
{
    protected string $name = 'local_theme_disconnect';

    protected string $description = 'Disconnect only this MCP process’s paired browser session.';

    public function schema(JsonSchema $schema): array
    {
        return ['pairing_id' => $schema->string()->pattern('^[a-zA-Z0-9_-]{1,120}$')->max(120)->required()];
    }

    public function handle(Request $request): ResponseFactory
    {
        return $this->safe(function () use ($request): array {
            $id = $this->boundedString($this->input($request, ['pairing_id'])['pairing_id'], 120);
            $session = $this->authorize($id);
            app(BrowserSessionDisconnectLifecycle::class)->disconnect($session);

            return ['pairing_id' => $id, 'status' => 'disconnected'];
        });
    }
}
