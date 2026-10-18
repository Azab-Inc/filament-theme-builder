<?php

declare(strict_types=1);

namespace Tests\Feature\Mcp;

interface LocalThemeToolRegistry
{
    /** @return array<string, mixed>|null */
    public function tool(string $name): ?array;
}
