<?php

namespace App\Filament\Resources\Reviews\Schemas;

use App\Filament\Support\EntityResourceForm;
use Filament\Schemas\Schema;

class ReviewForm
{
    public static function configure(Schema $schema): Schema
    {
        return EntityResourceForm::configure($schema, 'review');
    }
}
