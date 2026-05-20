<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\InstallmentApplySociety;
use App\Models\InstallmentApplyStatus;
use App\Models\Validation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ApplyController extends Controller
{
    public function applyInstalment(Request $request) {
        DB::beginTransaction();
        try {
            $user = $request->user();

            $validation = Validation::where("society_id", $user->id)->first();

            if($validation || $validation !== "accepted") {
                return response()->json([
                    "message" => "Your data validator must be accepted by validator"
                ], 401);
            }

            $application = InstallmentApplySociety::where("society_id", $user->id)->first();

            if($application) {
                return response()->json([
                    "message" => "Application for a instalment can only be once"
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                "installment_id" => "required|exists:installments,id",
                "months" => "required|exists:available_months,id",
                "notes" => "required|string"
            ]);

            if($validator->fails()) {
                return response()->json([
                    "message" => "Invalid error",
                    "errors" => $validator->errors()
                ], 401);
            }

            $installment = InstallmentApplySociety::create([
                "notes" => $request->notes,
                "available_month_id" => $request->months,
                "date" => now(),
                "society_id" => $user->id,
                "installment_id" => $request->installment_id
            ]);

            InstallmentApplyStatus::create([
                "date" => now(),
                "society_id" => $user->id,
                "installment_id" => $request->installment_id,
                "available_month_id" => $request->months,
                "installment_apply_society_id" => $installment->id,
                "status" => "pending"
            ]);

            DB::commit();

            return response()->json([
                "message" => "Apply for instalment successful"
            ], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error("Gagal mengload data " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }

    public function getAllSocietyInstalment(Request $request) {
        try {
            $user = $request->user();

            if(!$user) {
                return response()->json([
                    "message" => "Unauthorized user"
                ], 401);
            }

            $installments = Installment::with([
                "brand",
                "installmentApplyStatuses" => function($q) use ($user) {
                    $q->where("society_id", $user->id)
                    ->with(["availableMonth", "installmentApplySociety"]);
                }
            ])->get();

            return response()->json([
                "instalments" => $installments->map(function($inst) {
                    return [
                        "id" => $inst->id,
                        "car" => $inst->cars,
                        "brand" => $inst->brand->brand ?? null,
                        "price" => $inst->price,
                        "description" => $inst->description,
                        "applications" => $inst->installmentApplyStatuses->map(function($status) {
                            return [
                                "month" => $status->AvailableMonth->month ?? null,
                                "nominal" => $status->AvailableMonth->nominal ?? null,
                                "apply_status" => $status->status ?? null,
                                "notes" => $status->InstallmentApplySociety->notes ?? null,
                            ];
                        })
                    ];
                })
            ]);
        } catch (\Throwable $th) {
            Log::error("Gagal mengload data " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }
}
