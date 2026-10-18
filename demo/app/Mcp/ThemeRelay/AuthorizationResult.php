<?php

declare(strict_types=1);

namespace App\Mcp\ThemeRelay;

final readonly class AuthorizationResult
{
    public function __construct(public bool $ok, public ?string $category = null) {}
}
