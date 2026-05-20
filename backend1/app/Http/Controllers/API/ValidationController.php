<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Society;
use App\Models\Validation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ValidationController extends Controller
{
    public function createValidation(Request $request) {
        try {
            $request->validate([
                "job" => "required|string",
                "job_description" => "required",
                "income" => "required|integer",
                "reason_accepted" => "required"
            ]);

            $user = $request->user();

            $validCheck = Validation::where("society_id", $user->id)->first();

            if($validCheck) {
                return response()->json([
                    "message" => "Only one validation per user"
                ], 401);
            }

            Validation::create([
                "society_id" => $user->id,
                "validator_id" => null,
                "status" => "pending",
                "job" => $request->job,
                "job_description" => $request->job_description,
                "income" => $request->income,
                "reason_accepted" => $request->reason_accepted,
                "validator_notes" => null
            ]);

            return response()->json([
                "message" => "request data validation sent"
            ], 201);
        } catch (\Throwable $th) {
            Log::error("Gagal melakukan login " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }

    public function getValidations(Request $request) {
        try {
            $user = $request->user();

            $validations = Validation::with("validator")->where("society_id", $user->id)->get();

            return response()->json([
                "validation" => $validations->map(function($v) {
                    return [
                        "id" => $v->id ?? null,
                        "status" => $v->status ?? null,
                        "job" => $v->job ?? null,
                        "job_description" => $v->job_description ?? null,
                        "income" => $v->income ?? null,
                        "reason_accepted" => $v->reason_accepted ?? null,
                        "validator_notes" => $v->validator_notes ?? null,
                        "validator" => $v->validator ? [
                            "id" => $v->validator->id ?? null,
                            "name" => $v->validator->name ?? null,
                            "role" => $v->validator->role ?? null,
                        ] : null,
                    ];
                })
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Gagal melakukan login " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }
}
