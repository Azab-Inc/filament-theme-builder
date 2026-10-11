<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['public_id', 'expires_at'])]
class Share extends Model
{
    protected $table = 'shares';

    public $timestamps = false;
}
