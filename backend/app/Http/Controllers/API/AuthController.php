<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Society;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function Login(Request $request) {
        try {
            $request->validate([
                "id_card_number" => "required|string",
                "password" => "required|min:6"
            ]);

            $user = Society::with("regional")->where("id_card_number", $request->id_card_number)->first();

            if(!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    "message" => "ID card Number or Password inccorect"
                ], 401);
            }

            $token = $user->createToken($request->id_card_number . "_token")->plainTextToken;

            return response()->json([
                "name" => $user->name,
                "born_date" => $user->born_date,
                "gender" => $user->gender,
                "address" => $user->address,
                "token" => $token,
                "regional" => [
                    "id" => $user->regional->id,
                    "province" => $user->regional?->province,
                    "district" => $user->regional?->district,
                ]
            ]);
        } catch (\Throwable $th) {
            Log::error("Login is Failed", ["exception" => $th]);
            return response()->json([
                "message" => "server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }

    public function Logout(Request $request) {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                "message" => "Logout success"
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Logout Failed", ["exception" => $th]);
            return response()->json([
                "message" => "server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }
}
