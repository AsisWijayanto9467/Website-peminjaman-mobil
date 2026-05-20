<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SocietySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("societies")->insert([
            [
                "id_card_number" => "12345678",
                "password" => Hash::make("Password123"),
                "name" => "Admin1",
                "born_date" => "1974-10-22",
                "gender" => "male",
                "address" => "Ki. Raya Setiabudhi No. 790",
                "regional_id" => 1,
                "updated_at" => now()
            ],[
                "id_card_number" => "87654321",
                "password" => Hash::make("Password123"),
                "name" => "Admin2",
                "born_date" => "1993-05-17",
                "gender" => "female",
                "address" => "Ki. Raya Setiabudhi No. 105",
                "regional_id" => 1,
                "updated_at" => now()
            ]
        ]);
    }
}
