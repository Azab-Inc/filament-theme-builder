<?php

namespace App\Filament\Support;

use Illuminate\Http\Request;

final class ShowcaseState
{
    private const DEFAULT = 'default';

    /** @var list<string> */
    private const ALLOWED = [
        self::DEFAULT,
        'FormValidationState',
        'FormFocusState',
        'TableEmptyState',
        'TableLoadingState',
        'TableSelectedRowState',
        'ActionLoadingState',
        'ModalOpenState',
        'NotificationVisibleState',
        'HoverState',
        'DisabledState',
    ];

    private function __construct(private readonly string $identifier) {}

    /** @return list<string> */
    public static function allowed(): array
    {
        return self::ALLOWED;
    }

    public static function fromRequest(Request $request): self
    {
        $requested = $request->query('state');

        return new self(is_string($requested) && in_array($requested, self::ALLOWED, true) ? $requested : self::DEFAULT);
    }

    public function is(string $identifier): bool
    {
        return $this->identifier === $identifier;
    }

    public function value(): string
    {
        return $this->identifier;
    }

    public function reset(): self
    {
        return new self(self::DEFAULT);
    }
}
