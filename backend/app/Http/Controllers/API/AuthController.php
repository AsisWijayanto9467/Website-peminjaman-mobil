<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Regional;
use App\Models\Society;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function Login(Request $request)
    {
        try {
            $request->validate([
                "id_card_number" => "required|string",
                "password" => "required|min:6"
            ]);

            $user = User::where("id_card_number", $request->id_card_number)->first();

            if ($user) {
                return $this->handleStaffLogin($request, $user);
            }

            $society = Society::with("regional")
                ->where("id_card_number", $request->id_card_number)
                ->first();

            if ($society) {
                return $this->handleSocietyLogin($request, $society);
            }

            return response()->json([
                "message" => "ID Card Number or Password incorrect"
            ], 401);

        } catch (\Throwable $th) {
            Log::error("Login Failed", [
                "exception" => $th->getMessage(),
                "trace" => $th->getTraceAsString()
            ]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Register society baru (otomatis menjadi user biasa/masyarakat)
     */
    public function Register(Request $request)
    {
        try {
            $request->validate([
                "id_card_number" => "required|string|size:16|unique:societies,id_card_number|unique:users,id_card_number",
                "password" => "required|min:6|confirmed",
                "name" => "required|string|max:255",
                "born_date" => "required|date",
                "gender" => "required|in:male,female",
                "address" => "required|string",
                "regional_id" => "required|exists:regionals,id"
            ]);

            DB::beginTransaction();

            // Create society member (otomatis sebagai user/masyarakat)
            $society = Society::create([
                "id_card_number" => $request->id_card_number,
                "password" => Hash::make($request->password),
                "name" => $request->name,
                "born_date" => $request->born_date,
                "gender" => $request->gender,
                "address" => $request->address,
                "regional_id" => $request->regional_id,
                "updated_at" => now()
            ]);

            DB::commit();

            // Generate token untuk auto-login setelah register
            $token = $society->createToken($request->id_card_number . "_society_token")->plainTextToken;

            Log::info("New society member registered", [
                "society_id" => $society->id,
                "id_card_number" => $request->id_card_number
            ]);

            return response()->json([
                "message" => "Registration successful. You are registered as a user/masyarakat.",
                "user" => [
                    "id" => $society->id,
                    "id_card_number" => $society->id_card_number,
                    "name" => $society->name,
                    "born_date" => $society->born_date,
                    "gender" => $society->gender,
                    "address" => $society->address,
                    "role" => "society",
                    "token" => $token,
                    "regional" => $society->regional ? [
                        "id" => $society->regional->id,
                        "province" => $society->regional->province,
                        "district" => $society->regional->district,
                    ] : null
                ]
            ], 201);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Registration Failed", [
                "exception" => $th->getMessage(),
                "trace" => $th->getTraceAsString()
            ]);

            return response()->json([
                "message" => "Registration failed",
                "errors" => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Handle login untuk staff (admin, officer, validator)
     */
    private function handleStaffLogin(Request $request, User $user)
    {
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                "message" => "ID Card Number or Password incorrect"
            ], 401);
        }

        // Revoke token lama (optional)
        // $user->tokens()->delete();

        $token = $user->createToken($request->id_card_number . "_staff_token")->plainTextToken;

        $response = [
            "user" => [
                "id" => $user->id,
                "id_card_number" => $user->id_card_number,
                "name" => $user->name,
                "role" => $user->role,
                "token" => $token
            ]
        ];

        // Tambahkan detail validator jika user adalah officer atau validator
        if (in_array($user->role, ['officer', 'validator']) && $user->validator) {
            $response["user"]["validator_id"] = $user->validator->id;
            $response["user"]["validator_name"] = $user->validator->name;
        }

        Log::info("Staff login successful", [
            "user_id" => $user->id,
            "role" => $user->role
        ]);

        return response()->json($response);
    }

    /**
     * Handle login untuk society (masyarakat)
     */
    private function handleSocietyLogin(Request $request, Society $society)
    {
        if (!Hash::check($request->password, $society->password)) {
            return response()->json([
                "message" => "ID Card Number or Password incorrect"
            ], 401);
        }

        // Revoke token lama (optional)
        // $society->tokens()->delete();

        $token = $society->createToken($request->id_card_number . "_society_token")->plainTextToken;

        Log::info("Society login successful", [
            "society_id" => $society->id
        ]);

        return response()->json([
            "user" => [
                "id" => $society->id,
                "id_card_number" => $society->id_card_number,
                "name" => $society->name,
                "born_date" => $society->born_date,
                "gender" => $society->gender,
                "address" => $society->address,
                "role" => "society",
                "token" => $token,
                "regional" => [
                    "id" => $society->regional->id,
                    "province" => $society->regional?->province,
                    "district" => $society->regional?->district,
                ]
            ]
        ]);
    }

    /**
     * Logout user
     */
    public function Logout(Request $request)
    {
        try {
            $user = $request->user();

            // Hapus token yang sedang digunakan
            $request->user()->currentAccessToken()->delete();

            Log::info("Logout successful", [
                "user_id" => $user->id,
                "user_type" => get_class($user)
            ]);

            return response()->json([
                "message" => "Logout success"
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Logout Failed", [
                "exception" => $th->getMessage()
            ]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }

    public function getRegional()
    {
        try {
            $regionals = Regional::withCount('societies')
                ->orderBy('province')
                ->orderBy('district')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Data regional berhasil diambil',
                'data' => $regionals
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Failed to fetch regionals: " . $th->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data regional',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user profile
     */
    public function Profile(Request $request)
    {
        try {
            $user = $request->user();

            // Check if user is Society
            if ($user instanceof Society) {
                $profile = [
                    "id" => $user->id,
                    "id_card_number" => $user->id_card_number,
                    "name" => $user->name,
                    "born_date" => $user->born_date,
                    "gender" => $user->gender,
                    "address" => $user->address,
                    "role" => "society",
                    "regional" => $user->regional ? [
                        "id" => $user->regional->id,
                        "province" => $user->regional->province,
                        "district" => $user->regional->district,
                    ] : null
                ];
            } else {
                // Staff (User model)
                $profile = [
                    "id" => $user->id,
                    "id_card_number" => $user->id_card_number,
                    "name" => $user->name,
                    "role" => $user->role,
                ];

                if (in_array($user->role, ['officer', 'validator']) && $user->validator) {
                    $profile["validator_id"] = $user->validator->id;
                    $profile["validator_name"] = $user->validator->name;
                }
            }

            return response()->json([
                "user" => $profile
            ]);

        } catch (\Throwable $th) {
            Log::error("Profile fetch failed", [
                "exception" => $th->getMessage()
            ]);

            return response()->json([
                "message" => "Failed to fetch profile",
                "errors" => $th->getMessage()
            ], 500);
        }
    }
}
