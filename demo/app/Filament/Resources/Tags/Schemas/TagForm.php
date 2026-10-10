<?php

namespace App\Filament\Resources\Tags\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class TagForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'tag');
    }
}
