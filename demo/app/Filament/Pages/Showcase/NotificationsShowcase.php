<?php

namespace App\Filament\Pages\Showcase;

use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Panel;
use UnitEnum;

class NotificationsShowcase extends Page
{
    protected static ?string $title = 'Notifications';

    protected static ?string $navigationLabel = 'Notifications';

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 60;

    protected string $view = 'filament.pages.showcase.notifications-showcase';

    public string $lastNotification = 'Info notification';

    public static function getSlug(?Panel $panel = null): string
    {
        return 'notifications-showcase';
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('showSuccess')->label('Show success notification')->action(function (): void {
                $this->showSuccess();
            }),
            Action::make('showDanger')->label('Show danger notification')->action(function (): void {
                $this->showDanger();
            }),
            Action::make('showWarning')->label('Show warning notification')->action(function (): void {
                $this->showWarning();
            }),
            Action::make('showInfo')->label('Show info notification')->action(function (): void {
                $this->showInfo();
            }),
            Action::make('showPersistent')->label('Show persistent notification')->action(function (): void {
                $this->showPersistent();
            }),
            Action::make('showTransient')->label('Show transient notification')->action(function (): void {
                $this->showTransient();
            }),
        ];
    }

    public function showSuccess(): void
    {
        $this->send('Success notification', 'A successful local fixture event.', 'success');
    }

    public function showDanger(): void
    {
        $this->send('Danger notification', 'A dangerous local fixture event.', 'danger');
    }

    public function showWarning(): void
    {
        $this->send('Warning notification', 'A warning local fixture event.', 'warning');
    }

    public function showInfo(): void
    {
        $this->send('Info notification', 'An informational local fixture event.', 'info');
    }

    public function showPersistent(): void
    {
        $this->lastNotification = 'Persistent fixture notification';
        Notification::make()
            ->title('Persistent fixture notification')
            ->body('This notification stays visible until dismissed.')
            ->info()
            ->persistent()
            ->send();
    }

    public function showTransient(): void
    {
        $this->lastNotification = 'Transient fixture notification';
        Notification::make()
            ->title('Transient fixture notification')
            ->body('This notification uses a deterministic short duration.')
            ->info()
            ->duration(5000)
            ->send();
    }

    private function send(string $title, string $body, string $status): void
    {
        $this->lastNotification = $title;
        Notification::make()->title($title)->body($body)->{$status}()->actions([
            Action::make('dismiss')->label('Dismiss'),
        ])->send();
    }
}
