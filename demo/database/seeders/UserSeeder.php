<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'user'],
            [
                'name' => 'Demo User',
                'password' => 'password',
            ],
        );
    }
}
