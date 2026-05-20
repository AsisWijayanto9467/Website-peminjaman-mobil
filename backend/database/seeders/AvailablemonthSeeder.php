<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AvailablemonthSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("available_months")->insert([
            [
                "installment_id" => 1,
                "month" => 6,
                "description" => "For Fun",
                "nominal" => 1400000
            ],[
                "installment_id" => 2,
                "month" => 4,
                "description" => "For Fun",
                "nominal" => 1400000
            ],[
                "installment_id" => 3,
                "month" => 3,
                "description" => "For Fun",
                "nominal" => 1400000
            ],[
                "installment_id" => 4,
                "month" => 6,
                "description" => "For Fun",
                "nominal" => 1400000
            ]
        ]);
    }
}
