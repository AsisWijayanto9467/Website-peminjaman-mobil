<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InstallmentController extends Controller
{
    public function getAllInstallment(Request $request) {
        try {
            $installments = Installment::with(["brand", "availableMonths"])->get();

            return response()->json([
                "cars" => $installments->map(function($i) {
                    return [
                        "id" => $i->id,
                        "car" => $i->cars,
                        "brand" => $i->brand->brand,
                        "price" => $i->price,
                        "description" => $i->description,
                        "available_month" => $i->AvailableMonths->map(function($available) {
                            return [
                                "month" => $available->month,
                                "description" => $available->description
                            ];
                        })
                    ];
                })
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Gagal mengload data " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }

    public function getDetailCars(Request $request, $id) {
        try {
            $installment = Installment::with(["brand", "availableMonths"])->find($id);

            return response()->json([
                "instalment" => [
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
                ]
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Gagal mengload data " . $th->getMessage());
            return response()->json([
                "message" => "Server Error",
                "error" => $th->getMessage()
            ], 500);
        }
    }
}
