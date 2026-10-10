<?php

namespace Database\Factories;

use App\Models\Note;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Note> */
class NoteFactory extends Factory
{
    public function definition(): array
    {
        return ['noteable_type' => Product::class, 'noteable_id' => Product::factory(), 'body' => 'Demo note'];
    }
}
