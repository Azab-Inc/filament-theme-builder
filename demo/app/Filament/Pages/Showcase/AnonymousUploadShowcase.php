<?php

namespace App\Filament\Pages\Showcase;

use App\Filament\Pages\Showcase\Forms\ProductEditorForm;
use Filament\Pages\Page;
use Filament\Panel;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Validation\ValidationException;
use LogicException;
use UnitEnum;

final class AnonymousUploadShowcase extends Page
{
    protected static ?string $title = 'Anonymous demo uploads';

    protected static bool $shouldRegisterNavigation = false;

    protected static string|UnitEnum|null $navigationGroup = 'Operations';

    protected string $view = 'filament.pages.showcase.anonymous-upload-showcase';

    /** @var array<string, mixed> */
    public array $data = [];

    public static function getSlug(?Panel $panel = null): string
    {
        return 'anonymous-upload';
    }

    public function mount(): void
    {
        $this->uploadForm()->fill(['product_image' => null]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Anonymous demo upload')
                    ->description('This isolated fixture uses your browser session for temporary storage limits.')
                    ->schema([ProductEditorForm::imageUpload()]),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $this->uploadForm()->validate();

        try {
            $this->uploadForm()->getState();
        } catch (ValidationException $exception) {
            $message = $exception->errors()['product_image'][0] ?? 'The upload could not be saved.';
            $this->addError('data.product_image', $message);
        }
    }

    private function uploadForm(): Schema
    {
        return $this->getSchema('form') ?? throw new LogicException('The anonymous upload schema is not configured.');
    }
}
