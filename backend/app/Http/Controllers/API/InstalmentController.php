<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InstalmentController extends Controller
{
    public function getAllCars(Request $request) {
        try {
            $user = $request->id;

            $installments = Installment::with(["AvailableMonths", "brand","InstallmentApplyStatuses"])->get();

            return response()->json([
                "cars" => $installments->map(function($installment) {
                    return [
                        "id" => $installment->id,
                        "car" => $installment->cars,
                        "brand" => $installment->brand->brand,
                        "price" => $installment->price,
                        "description" => $installment->description,
                        "available_month" => $installment->AvailableMonths->map(function($available) {
                            return [
                                "month" => $available->month,
                                "description" => $available->description
                            ];
                        })
                    ];
                })
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Get cars failed", ["exception" => $th]);
            return response()->json([
                "message" => "server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }


    public function getDetailCars(Request $request, $id) {
        try {
            $installment = Installment::with(["AvailableMonths", "brand"])->find($id);

            return response()->json([
                "instalment" => [
                    "id" => $installment->id,
                    "car" => $installment->cars,
                    "brand" => $installment->brand->brand,
                    "price" => $installment->price,
                    "description" => $installment->description,
                    "available_month" => $installment->AvailableMonths->map(function($available) {
                        return [
                            "id" => $available->id,
                            "month" => $available->month,
                            "description" => $available->description
                        ];
                    })
                ]
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Get Detail cars failed", ["exception" => $th]);
            return response()->json([
                "message" => "server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }
}
