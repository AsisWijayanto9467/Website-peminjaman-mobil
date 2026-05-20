<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SocietySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("societies")->insert([
            [
                "id_card_number" => "08972632131",
                "name" => "AkmalWanto",
                "password" => Hash::make("password123"),
                "born_date" => "2026-08-17",
                "gander" => "male",
                "address" => "Karanganyar, Jawa Tengah",
                "regional_id" => 1,
                "login_tokens" => "",
                "created_at" => now(),
                "updated_at" => now(),
            ], [
                "id_card_number" => "08972837248",
                "name" => "Hirus warto",
                "password" => Hash::make("password123"),
                "born_date" => "2026-06-24",
                "gander" => "male",
                "address" => "Karanganyar, Jawa Tengah",
                "regional_id" => 1,
                "login_tokens" => "",
                "created_at" => now(),
                "updated_at" => now(),
            ]
        ]);
    }
}
