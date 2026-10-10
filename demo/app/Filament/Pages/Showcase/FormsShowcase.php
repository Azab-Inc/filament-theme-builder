<?php

namespace App\Filament\Pages\Showcase;

use Filament\Forms\Components\Builder;
use Filament\Forms\Components\Builder\Block;
use Filament\Forms\Components\Checkbox;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Wizard;
use Filament\Schemas\Components\Wizard\Step;
use Filament\Schemas\Schema;
use LogicException;
use UnitEnum;

class FormsShowcase extends Page
{
    protected static ?string $title = 'Forms & Schemas';

    protected static ?string $navigationLabel = 'Forms & Schemas';

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 20;

    protected string $view = 'filament.pages.showcase.forms-showcase';

    /** @var array<string, mixed> */
    public array $data = [];

    public static function getSlug(?Panel $panel = null): string
    {
        return 'forms-showcase';
    }

    public function mount(): void
    {
        $this->showcaseForm()->fill([
            'campaign_name' => 'Autumn studio launch',
            'audience' => 'Independent makers',
            'show_details' => true,
            'optional_note' => null,
            'long_text' => 'A long local fixture paragraph demonstrates how editorial copy remains readable while the form stays scannable.',
            'channels' => [
                ['channel' => 'Email', 'budget' => '1200'],
            ],
            'content_blocks' => [
                ['type' => 'headline', 'data' => ['headline' => 'Make room for considered work']],
            ],
            'editorial_notes' => '<p>Keep the launch focused, useful, and unmistakably local.</p>',
            'disabled_fixture' => 'Read-only local value',
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Campaign brief')
                    ->description('A deterministic, request-scoped fixture for schema composition.')
                    ->schema([
                        TextInput::make('campaign_name')
                            ->label('Campaign name')
                            ->required()
                            ->maxLength(120),
                        TextInput::make('audience')
                            ->label('Audience')
                            ->required(),
                        TextInput::make('disabled_fixture')
                            ->label('Disabled fixture')
                            ->disabled(),
                        TextInput::make('filled_fixture')
                            ->label('Prefilled fixture')
                            ->default('Local deterministic value'),
                        Textarea::make('optional_note')
                            ->label('Optional note')
                            ->nullable(),
                        Textarea::make('long_text')
                            ->label('Long text fixture')
                            ->rows(4)
                            ->maxLength(500),
                    ])
                    ->columns(2),
                Wizard::make([
                    Step::make('Plan')
                        ->description('Required values and focus order')
                        ->schema([
                            TextInput::make('plan_reference')
                                ->label('Plan reference')
                                ->default('DEMO-CAMPAIGN-001')
                                ->required(),
                        ]),
                    Step::make('Build')
                        ->description('Repeatable and block-based content')
                        ->schema([
                            TextInput::make('build_reference')
                                ->label('Build reference')
                                ->default('DEMO-BUILD-001'),
                        ]),
                    Step::make('Review')
                        ->description('Long-form editorial content')
                        ->schema([
                            Textarea::make('review_reference')
                                ->label('Review reference')
                                ->default('DEMO-REVIEW-001'),
                        ]),
                ])
                    ->label('Wizard')
                    ->persistStepInQueryString('form-step'),
                Section::make('Repeater')
                    ->schema([
                        Repeater::make('channels')
                            ->label('Channels')
                            ->schema([
                                TextInput::make('channel')->required(),
                                TextInput::make('budget')->numeric()->required(),
                            ])
                            ->itemLabel(fn (array $state): ?string => $state['channel'] ?? null)
                            ->defaultItems(1)
                            ->columns(2),
                    ]),
                Section::make('Content blocks')
                    ->schema([
                        Builder::make('content_blocks')
                            ->label('Content blocks')
                            ->blocks([
                                Block::make('headline')
                                    ->label('Headline block')
                                    ->schema([
                                        TextInput::make('headline')->required(),
                                    ]),
                                Block::make('quote')
                                    ->label('Quote block')
                                    ->schema([
                                        Textarea::make('quote')->required(),
                                    ]),
                            ])
                            ->blockPickerColumns(2)
                            ->reorderable(false),
                    ]),
                Section::make('Editorial notes')
                    ->schema([
                        RichEditor::make('editorial_notes')
                            ->label('Editorial notes')
                            ->toolbarButtons(['bold', 'italic', 'bulletList', 'orderedList', 'link']),
                    ]),
                Tabs::make('Tabs and sections')
                    ->tabs([
                        Tab::make('Overview')
                            ->schema([
                                Toggle::make('show_details')
                                    ->label('Show conditional details')
                                    ->live(),
                                Checkbox::make('is_featured')
                                    ->label('Featured fixture')
                                    ->default(true),
                            ]),
                        Tab::make('Conditional')
                            ->schema([
                                Textarea::make('conditional_details')
                                    ->label('Conditional details')
                                    ->default('Local conditional details')
                                    ->visible(fn (Get $get): bool => (bool) $get('show_details'))
                                    ->required(fn (Get $get): bool => (bool) $get('show_details')),
                            ]),
                    ]),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $this->showcaseForm()->validate();
    }

    protected function showcaseForm(): Schema
    {
        return $this->getSchema('form') ?? throw new LogicException('The forms showcase schema is not configured.');
    }

    public function getView(): string
    {
        return $this->view;
    }
}
