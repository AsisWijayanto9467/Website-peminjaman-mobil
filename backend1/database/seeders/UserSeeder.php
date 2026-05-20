<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("users")->insert([
            [
                "username" => "Robin Wawan",
                "password" => Hash::make("password123"),
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "username" => "Rahmat Boyem",
                "password" => Hash::make("password123"),
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "username" => "Rangga",
                "password" => Hash::make("password123"),
                "created_at" => now(),
                "updated_at" => now(),
            ]
        ]);
    }
}
