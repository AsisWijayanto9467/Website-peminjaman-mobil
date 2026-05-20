<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InstallmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("installments")->insert([
            [
                "brand_id" => 3,
                "cars" => "BMW K-45",
                "description" => "Make for the best",
                "price" => 789000,
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "brand_id" => 2,
                "cars" => "K-Wagen",
                "description" => "The Killer hunt",
                "price" => 888000,
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "brand_id" => 3,
                "cars" => "Panzer auf.D",
                "description" => "Best fo the poland",
                "price" => 567000,
                "created_at" => now(),
                "updated_at" => now(),
            ],[
                "brand_id" => 4,
                "cars" => "Jungker ju-87",
                "description" => "From the air he grasph",
                "price" => 1900000,
                "created_at" => now(),
                "updated_at" => now(),
            ]
        ]);
    }
}
