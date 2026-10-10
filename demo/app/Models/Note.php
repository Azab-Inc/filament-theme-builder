<?php

namespace App\Models;

use Database\Factories\NoteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable(['noteable_type', 'noteable_id', 'body'])]
class Note extends Model
{
    /** @use HasFactory<NoteFactory> */
    use HasFactory;

    public function noteable(): MorphTo
    {
        return $this->morphTo();
    }
}
