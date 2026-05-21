<?php

namespace Database\Seeders;

use App\Models\Society;
use App\Models\User;
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
        $defaultPassword = Hash::make('password123');

        // ==========================================
        // SEEDER UNTUK TABEL: USERS & VALIDATORS
        // ==========================================

        // Akun Admin
        User::create([
            'id_card_number' => '1111222233334444', // 16 digit
            'password' => $defaultPassword,
            'name' => 'John Admin',
            'born_date' => '1990-01-01',
            'gender' => 'male',
            'address' => 'Jl. Admin No. 1',
            'role' => 'admin',
        ]);

        // Akun Officer + Data Validator Terkait
        $officer = User::create([
            'id_card_number' => '5555666677778888', // 16 digit
            'password' => $defaultPassword,
            'name' => 'Alice Officer',
            'born_date' => '1993-05-10',
            'gender' => 'female',
            'address' => 'Jl. Officer No. 5',
            'role' => 'officer',
        ]);

        DB::table('validators')->insert([
            'user_id' => $officer->id,
            'role' => 'officer',
            'name' => 'Alice Officer (Validator Desk)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Akun Validator + Data Validator Terkait
        $validator = User::create([
            'id_card_number' => '9999000011112222', // 16 digit
            'password' => $defaultPassword,
            'name' => 'Bob Validator',
            'born_date' => '1988-11-25',
            'gender' => 'male',
            'address' => 'Jl. Validator No. 9',
            'role' => 'validator',
        ]);

        DB::table('validators')->insert([
            'user_id' => $validator->id,
            'role' => 'validator',
            'name' => 'Bob Validator (Field Desk)',
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        // ==========================================
        // SEEDER UNTUK TABEL: SOCIETIES
        // ==========================================

        // Akun Masyarakat 1
        Society::create([
            'id_card_number' => '12345678', // Sesuai skema migration kamu (char 8)
            'password' => $defaultPassword,
            'name' => 'Budi Santoso',
            'born_date' => '1995-08-17',
            'gender' => 'male',
            'address' => 'Jl. Merdeka No. 17, Jakarta',
            'regional_id' => 1,
        ]);

        // Akun Masyarakat 2
        Society::create([
            'id_card_number' => '87654321', // Sesuai skema migration kamu (char 8)
            'password' => $defaultPassword,
            'name' => 'Siti Aminah',
            'born_date' => '1997-12-25',
            'gender' => 'female',
            'address' => 'Jl. Sudirman No. 45, Jakarta',
            'regional_id' => 2,
        ]);
    }
}
