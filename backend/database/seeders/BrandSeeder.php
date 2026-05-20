<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("brands")->insert([
            [
                "brand" => "Toyota"
            ],[
                "brand" => "Yamaha"
            ],[
                "brand" => "BMW"
            ],[
                "brand" => "Bugatti"
            ],[
                "brand" => "Jeep"
            ]
        ]);
    }
}
