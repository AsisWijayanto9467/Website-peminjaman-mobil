<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ValidatorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("validators")->insert([
            [
                "user_id" => 1,
                "role" => "officer",
                "name" => "Wawan",
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "user_id" => 2,
                "role" => "validator",
                "name" => "Kurniawan",
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "user_id" => 3,
                "role" => "officer",
                "name" => "Rahmat",
                "created_at" => now(),
                "updated_at" => now(),
            ]
        ]);
    }
}
