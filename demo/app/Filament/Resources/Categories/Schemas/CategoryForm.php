<?php

namespace App\Filament\Resources\Categories\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class CategoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'category');
    }
}
