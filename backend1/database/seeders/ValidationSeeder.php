<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ValidationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("validations")->insert([
            [
                "society_id" => 2,
                "validator_id" => 1,
                "status" => "accepted",
                "job" => "FireFighter",
                "job_description" => "Safe people from fire",
                "income" => 25000,
                "reason_accepted" => "I want this car because its red",
                "validator_notes" => "Alright you can have it"
            ]
        ]);
    }
}
