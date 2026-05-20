<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegionalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("regionals")->insert([
            [
                "province" => "Jawa Tengah",
                "district" => "Karanganyar",
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "province" => "Jawa Timur",
                "district" => "Madura",
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "province" => "Jawa Barat",
                "district" => "Banten",
                "created_at" => now(),
                "updated_at" => now(),
            ]
        ]);
    }
}
