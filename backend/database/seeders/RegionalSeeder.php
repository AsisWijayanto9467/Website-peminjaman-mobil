<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegionalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("regionals")->insert([
            [
                "province" => "DKI Jakarta",
                "district" => "Central Jakarta"
            ],[
                "province" => "DKI Jakarta",
                "district" => "South Jakarta"
            ],[
                "province" => "West Jakarta",
                "district" => "Bandung"
            ]
        ]);
    }
}
