<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Society;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request) {
        try {
            $request->validate([
                "id_card_number" => "required|min:6",
                "password" => "required"
            ]);

            $society = Society::with("regional")->where("id_card_number", $request->id_card_number)->first();

            if(!$society || !Hash::check($request->password, $society->password)) {
                return response()->json([
                    "message" => "ID Card Number or Password incorrect"
                ], 401);
            }

            $token = $society->createToken($request->id_card_number . "_Token")->plainTextToken;

            $society->login_tokens = $token;
            $society->save();

            return response()->json([
                "name" => $society->name,
                "born_date" => $society->born_date,
                "gender" => $society->gender,
                "address" => $society->address,
                "token" => $token,
                "regional" => [
                    "id" => $society->regional?->id,
                    "province" => $society->regional?->province,
                    "district" => $society->regional?->district,
                ]
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Gagal melakukan login " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request) {
        try {
            $user = $request->user();

            $user->login_tokens = "";
            $user->save();
            
            $user->currentAccessToken()->delete();

            return response()->json([
                "message" => "Logout success"
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Gagal melakukan logout " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }
}
