<?php

namespace App\Filament\Resources\Notes\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class NoteForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'note');
    }
}
