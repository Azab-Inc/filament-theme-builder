<?php

namespace App\Filament\Pages\Showcase;

use App\Filament\Support\ShowcaseState;
use Filament\Pages\Page;
use Filament\Panel;
use UnitEnum;

class ShowcaseStateControls extends Page
{
    protected static ?string $title = 'Forced states';

    protected static ?string $breadcrumb = 'Forced states';

    protected static ?string $navigationLabel = 'Forced states';

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 70;

    protected string $view = 'filament.pages.showcase.states-showcase';

    public string $state = 'default';

    public static function getSlug(?Panel $panel = null): string
    {
        return 'states-showcase';
    }

    public function mount(): void
    {
        $this->state = ShowcaseState::fromRequest(request())->value();
    }

    public function resetState(): void
    {
        $this->state = ShowcaseState::fromRequest(request())->reset()->value();
    }

    /** @return list<string> */
    public function allowedStates(): array
    {
        return ShowcaseState::allowed();
    }

    public function isState(string $identifier): bool
    {
        return $this->state === $identifier;
    }
}
