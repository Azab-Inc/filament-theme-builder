<?php

namespace App\Filament\Pages\Showcase;

use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Forms\Components\TextInput;
use Filament\Infolists\Components\TextEntry;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Schemas\Components\Section;
use Filament\Support\Enums\Size;
use Filament\Support\Enums\Width;
use UnitEnum;

class ActionsShowcase extends Page
{
    protected static ?string $title = 'Actions & Modals';

    protected static ?string $navigationLabel = 'Actions & Modals';

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 50;

    protected string $view = 'filament.pages.showcase.actions-showcase';

    public static function getSlug(?Panel $panel = null): string
    {
        return 'actions-showcase';
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('primary')
                ->label('Primary action')
                ->color('primary')
                ->action(function (): void {
                    $this->notify('Primary action completed.', 'success');
                }),
            Action::make('danger')
                ->label('Danger action')
                ->color('danger')
                ->action(function (): void {
                    $this->notify('Danger fixture reviewed.', 'danger');
                }),
            Action::make('success')
                ->label('Success action')
                ->color('success')
                ->action(function (): void {
                    $this->notify('Success fixture completed.', 'success');
                }),
            Action::make('warning')
                ->label('Warning action')
                ->color('warning')
                ->action(function (): void {
                    $this->notify('Warning fixture reviewed.', 'warning');
                }),
            Action::make('info')
                ->label('Info action')
                ->color('info')
                ->action(function (): void {
                    $this->notify('Info fixture reviewed.', 'info');
                }),
            Action::make('gray')
                ->label('Gray action')
                ->color('gray')
                ->action(function (): void {
                    $this->notify('Gray fixture reviewed.', 'success');
                }),
            Action::make('outline')
                ->label('Outline action')
                ->outlined()
                ->size(Size::Small)
                ->action(function (): void {
                    $this->notify('Outline fixture reviewed.', 'info');
                }),
            Action::make('iconOnly')
                ->label('Icon-only action')
                ->icon('heroicon-o-eye')
                ->tooltip('Opens the read-only fixture details.')
                ->iconButton()
                ->action(function (): void {
                    $this->notify('Icon-only fixture reviewed.', 'info');
                }),
            Action::make('disabled')
                ->label('Disabled action')
                ->disabled(),
            Action::make('loading')
                ->label('Loading action')
                ->livewireTarget('loading')
                ->action(function (): void {
                    $this->notify('Loading fixture completed.', 'success');
                }),
            ActionGroup::make([
                Action::make('groupPrimary')->label('Grouped primary')->color('primary')->action(function (): void {
                    $this->notify('Grouped primary selected.', 'success');
                }),
                Action::make('groupReadOnly')->label('Grouped read-only')->action(function (): void {
                    $this->notify('Grouped read-only selected.', 'info');
                }),
            ])
                ->label('Action group')
                ->icon('heroicon-m-ellipsis-vertical'),
            Action::make('tooltip')
                ->label('Tooltip action')
                ->tooltip('Explains this fixture action')
                ->action(function (): void {
                    $this->notify('Tooltip fixture reviewed.', 'info');
                }),
            Action::make('confirm')
                ->label('Confirmation modal')
                ->requiresConfirmation()
                ->modalHeading('Confirm fixture review')
                ->modalDescription('This fixture is read-only.')
                ->modalSubmitActionLabel('Confirm review')
                ->modalCancelActionLabel('Cancel')
                ->action(function (): void {
                    $this->notify('Read-only fixture confirmed.', 'success');
                }),
            Action::make('form')
                ->label('Form modal')
                ->schema([
                    TextInput::make('note')
                        ->label('Fixture note')
                        ->required(),
                ])
                ->modalHeading('Form modal')
                ->modalWidth(Width::Large)
                ->modalSubmitActionLabel('Submit fixture')
                ->modalCancelActionLabel('Cancel')
                ->extraModalFooterActions(fn (Action $action): array => [
                    $action->makeModalSubmitAction('saveAndReview')->label('Save and review'),
                ])
                ->action(function (): void {
                    $this->notify('Fixture form submitted without mutation.', 'success');
                }),
            Action::make('slideOver')
                ->label('Slide-over form')
                ->schema([
                    TextInput::make('slide_note')->label('Slide-over note')->default('Read-only slide-over fixture'),
                ])
                ->slideOver()
                ->modalHeading('Slide-over form')
                ->modalSubmitActionLabel('Submit slide-over')
                ->modalCancelActionLabel('Cancel')
                ->action(function (): void {
                    $this->notify('Slide-over fixture submitted without mutation.', 'success');
                }),
            Action::make('details')
                ->label('Read-only details')
                ->infolist([
                    Section::make('Fixture details')->schema([
                        TextEntry::make('reference')->label('Reference')->state('DEMO-ACTION-001'),
                        TextEntry::make('status')->label('Status')->state('Read-only'),
                    ]),
                ])
                ->modalHeading('Read-only details')
                ->modalWidth(Width::Medium)
                ->modalCancelActionLabel('Close')
                ->modalSubmitAction(false),
        ];
    }

    private function notify(string $title, string $status): void
    {
        Notification::make()->title($title)->{$status}()->send();
    }
}
