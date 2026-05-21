<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AvailableMonth;
use App\Models\Brand;
use App\Models\Installment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OfficerController extends Controller
{
    /**
     * Cek akses officer
     */
    private function checkOfficerAccess($user)
    {
        if (!$user instanceof \App\Models\User || $user->role !== 'officer') {
            return false;
        }
        return true;
    }


    /**
     * Get all brands
     */
    public function getAllBrands(Request $request)
    {
        try {
            if (!$this->checkOfficerAccess($request->user())) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $brands = Brand::orderBy('brand', 'asc')->get();
            return response()->json(["brands" => $brands], 200);
        } catch (\Throwable $th) {
            Log::error("Get all brands failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Get brand by ID
     */
    public function getBrandById(Request $request, $id)
    {
        try {
            if (!$this->checkOfficerAccess($request->user())) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $brand = Brand::find($id);
            if (!$brand) {
                return response()->json(["message" => "Brand not found"], 404);
            }

            return response()->json(["brand" => $brand], 200);
        } catch (\Throwable $th) {
            Log::error("Get brand by ID failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Menambah brand mobil
     */
    public function createBrand(Request $request)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $request->validate([
                "brand" => "required|string|max:255|unique:brands,brand"
            ]);

            $brand = Brand::create([
                "brand" => $request->brand
            ]);

            Log::info("Brand created", [
                "officer_id" => $user->id,
                "brand_id" => $brand->id,
                "brand" => $brand->brand
            ]);

            return response()->json([
                "message" => "Brand created successfully",
                "brand" => $brand
            ], 201);

        } catch (\Throwable $th) {
            Log::error("Create brand failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Update data brand
     */
    public function updateBrand(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $brand = Brand::find($id);
            if (!$brand) {
                return response()->json(["message" => "Brand not found"], 404);
            }

            $request->validate([
                "brand" => "required|string|max:255|unique:brands,brand," . $id
            ]);

            $brand->update([
                "brand" => $request->brand
            ]);

            Log::info("Brand updated", ["officer_id" => $user->id, "brand_id" => $brand->id]);

            return response()->json([
                "message" => "Brand updated successfully",
                "brand" => $brand
            ], 200);
        } catch (\Throwable $th) {
            Log::error("Update brand failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Hapus brand
     */
    public function deleteBrand(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $brand = Brand::find($id);
            if (!$brand) {
                return response()->json(["message" => "Brand not found"], 404);
            }

            // Cek apakah ada mobil yang menggunakan brand ini
            if ($brand->installments()->exists()) {
                return response()->json(["message" => "Cannot delete brand. It is used by one or more cars."], 400);
            }

            $brand->delete();

            Log::info("Brand deleted", ["officer_id" => $user->id, "brand_id" => $id]);

            return response()->json(["message" => "Brand deleted successfully"], 200);
        } catch (\Throwable $th) {
            Log::error("Delete brand failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }



    /**
     * Get all cars with full details
     */
    public function getAllCarsDetail(Request $request)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $cars = Installment::with(['brand', 'availableMonths'])
                ->withCount('installmentApplySocieties')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                "cars" => $cars->map(function($car) {
                    return [
                        "id" => $car->id,
                        "car" => $car->cars,
                        "brand" => $car->brand->brand ?? null,
                        "description" => $car->description,
                        "price" => $car->price,
                        "total_applications" => $car->installment_apply_societies_count,
                        "tenors" => $car->availableMonths->map(function($tenor) {
                            return [
                                "id" => $tenor->id,
                                "month" => $tenor->month,
                                "description" => $tenor->description,
                                "nominal" => $tenor->nominal
                            ];
                        })
                    ];
                })
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get cars detail failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Get car by ID
     */
    public function getCarById(Request $request, $id)
    {
        try {
            if (!$this->checkOfficerAccess($request->user())) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $car = Installment::with(['brand', 'availableMonths'])->find($id);
            if (!$car) {
                return response()->json(["message" => "Car not found"], 404);
            }

            return response()->json(["car" => $car], 200);
        } catch (\Throwable $th) {
            Log::error("Get car by ID failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Menambah mobil
     */
    public function createCar(Request $request)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $request->validate([
                "brand_id" => "required|exists:brands,id",
                "cars" => "required|string|max:255",
                "description" => "required|string",
                "price" => "required|integer|min:0"
            ]);

            $car = Installment::create([
                "brand_id" => $request->brand_id,
                "cars" => $request->cars,
                "description" => $request->description,
                "price" => $request->price
            ]);

            Log::info("Car created", [
                "officer_id" => $user->id,
                "car_id" => $car->id,
                "car" => $car->cars
            ]);

            return response()->json([
                "message" => "Car created successfully",
                "car" => $car->load('brand')
            ], 201);

        } catch (\Throwable $th) {
            Log::error("Create car failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Update data mobil
     */
    public function updateCar(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $car = Installment::find($id);
            if (!$car) {
                return response()->json(["message" => "Car not found"], 404);
            }

            $request->validate([
                "brand_id" => "sometimes|exists:brands,id",
                "cars" => "sometimes|string|max:255",
                "description" => "sometimes|string",
                "price" => "sometimes|integer|min:0"
            ]);

            $car->update($request->only(['brand_id', 'cars', 'description', 'price']));

            Log::info("Car updated", ["officer_id" => $user->id, "car_id" => $car->id]);

            return response()->json([
                "message" => "Car updated successfully",
                "car" => $car->fresh()->load('brand')
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Update car failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Hapus mobil
     */
    public function deleteCar(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $car = Installment::find($id);
            if (!$car) {
                return response()->json(["message" => "Car not found"], 404);
            }

            $hasApplications = $car->installmentApplySocieties()->exists();
            if ($hasApplications) {
                return response()->json(["message" => "Cannot delete car with existing applications"], 400);
            }

            $car->delete();
            DB::commit();

            Log::info("Car deleted", ["officer_id" => $user->id, "car_id" => $id]);

            return response()->json(["message" => "Car deleted successfully"], 200);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error("Delete car failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }



    /**
     * Get all available months
     */
    public function getAllAvailableMonths(Request $request)
    {
        try {
            if (!$this->checkOfficerAccess($request->user())) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $tenors = AvailableMonth::with('installment')->orderBy('created_at', 'desc')->get();
            return response()->json(["tenors" => $tenors], 200);
        } catch (\Throwable $th) {
            Log::error("Get all available months failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Get available month by ID
     */
    public function getAvailableMonthById(Request $request, $id)
    {
        try {
            if (!$this->checkOfficerAccess($request->user())) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $tenor = AvailableMonth::with('installment')->find($id);
            if (!$tenor) {
                return response()->json(["message" => "Tenor option not found"], 404);
            }

            return response()->json(["tenor" => $tenor], 200);
        } catch (\Throwable $th) {
            Log::error("Get available month by ID failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Tambah opsi tenor untuk mobil
     */
    public function createAvailableMonth(Request $request)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $request->validate([
                "installment_id" => "required|exists:installments,id",
                "month" => "required|integer|min:1",
                "description" => "required|string",
                "nominal" => "required|integer|min:0"
            ]);

            $exists = AvailableMonth::where('installment_id', $request->installment_id)
                ->where('month', $request->month)
                ->exists();

            if ($exists) {
                return response()->json(["message" => "Tenor for this month already exists"], 400);
            }

            $availableMonth = AvailableMonth::create($request->all());

            Log::info("Available month created", [
                "officer_id" => $user->id,
                "available_month_id" => $availableMonth->id
            ]);

            return response()->json([
                "message" => "Tenor option created successfully",
                "available_month" => $availableMonth
            ], 201);

        } catch (\Throwable $th) {
            Log::error("Create available month failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Update tenor
     */
    public function updateAvailableMonth(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $availableMonth = AvailableMonth::find($id);
            if (!$availableMonth) {
                return response()->json(["message" => "Tenor option not found"], 404);
            }

            $request->validate([
                "month" => "sometimes|integer|min:1",
                "description" => "sometimes|string",
                "nominal" => "sometimes|integer|min:0"
            ]);

            if ($request->has('month') && $request->month != $availableMonth->month) {
                $exists = AvailableMonth::where('installment_id', $availableMonth->installment_id)
                    ->where('month', $request->month)
                    ->where('id', '!=', $id)
                    ->exists();

                if ($exists) {
                    return response()->json(["message" => "Tenor for this month already exists on this car"], 400);
                }
            }

            $availableMonth->update($request->only(['month', 'description', 'nominal']));

            Log::info("Available month updated", [
                "officer_id" => $user->id,
                "available_month_id" => $availableMonth->id
            ]);

            return response()->json([
                "message" => "Tenor updated successfully",
                "available_month" => $availableMonth->fresh()
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Update available month failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }

    /**
     * Hapus tenor
     */
    public function deleteAvailableMonth(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $user = $request->user();
            if (!$this->checkOfficerAccess($user)) {
                return response()->json(["message" => "Only officers can access this"], 403);
            }

            $availableMonth = AvailableMonth::find($id);
            if (!$availableMonth) {
                return response()->json(["message" => "Tenor option not found"], 404);
            }

            $hasApplications = $availableMonth->installmentApplySocieties()->exists();
            if ($hasApplications) {
                return response()->json(["message" => "Cannot delete tenor with existing applications"], 400);
            }

            $availableMonth->delete();
            DB::commit();

            Log::info("Available month deleted", ["officer_id" => $user->id, "available_month_id" => $id]);

            return response()->json(["message" => "Tenor deleted successfully"], 200);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error("Delete available month failed", ["exception" => $th->getMessage()]);
            return response()->json(["message" => "Server error", "errors" => $th->getMessage()], 500);
        }
    }
}
