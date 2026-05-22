<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Regional;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RegionalController extends Controller
{
    /**
     * Display a listing of all regionals.
     */
    public function index()
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
     * Store a newly created regional.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'province' => 'required|string|max:255',
                'district' => 'required|string|max:255'
            ], [
                'province.required' => 'Provinsi wajib diisi',
                'province.max' => 'Provinsi maksimal 255 karakter',
                'district.required' => 'Kabupaten/Kota wajib diisi',
                'district.max' => 'Kabupaten/Kota maksimal 255 karakter'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check duplicate
            $exists = Regional::where('province', $request->province)
                ->where('district', $request->district)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kombinasi Provinsi dan Kabupaten/Kota sudah ada'
                ], 422);
            }

            $regional = Regional::create([
                'province' => $request->province,
                'district' => $request->district
            ]);

            Log::info("Regional created", [
                'regional_id' => $regional->id,
                'province' => $regional->province,
                'district' => $regional->district
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Data regional berhasil ditambahkan',
                'data' => $regional
            ], 201);

        } catch (\Throwable $th) {
            Log::error("Failed to create regional: " . $th->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan data regional',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified regional by ID.
     */
    public function show($id)
    {
        try {
            $regional = Regional::with(['societies' => function($query) {
                $query->select('id', 'name', 'id_card_number', 'regional_id');
            }])->find($id);

            if (!$regional) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data regional tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data regional berhasil diambil',
                'data' => $regional
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Failed to fetch regional detail: " . $th->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail regional',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified regional.
     */
    public function update(Request $request, $id)
    {
        try {
            $regional = Regional::find($id);

            if (!$regional) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data regional tidak ditemukan'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'province' => 'required|string|max:255',
                'district' => 'required|string|max:255'
            ], [
                'province.required' => 'Provinsi wajib diisi',
                'province.max' => 'Provinsi maksimal 255 karakter',
                'district.required' => 'Kabupaten/Kota wajib diisi',
                'district.max' => 'Kabupaten/Kota maksimal 255 karakter'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check duplicate except current ID
            $exists = Regional::where('province', $request->province)
                ->where('district', $request->district)
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kombinasi Provinsi dan Kabupaten/Kota sudah ada'
                ], 422);
            }

            $regional->update([
                'province' => $request->province,
                'district' => $request->district
            ]);

            Log::info("Regional updated", [
                'regional_id' => $regional->id,
                'province' => $regional->province,
                'district' => $regional->district
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Data regional berhasil diperbarui',
                'data' => $regional->fresh()
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Failed to update regional: " . $th->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui data regional',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified regional.
     */
    public function destroy($id)
    {
        try {
            $regional = Regional::find($id);

            if (!$regional) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data regional tidak ditemukan'
                ], 404);
            }

            // Check if regional has related societies
            if ($regional->societies()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus regional karena masih memiliki data masyarakat'
                ], 400);
            }

            $regionalData = $regional->toArray();
            $regional->delete();

            Log::info("Regional deleted", [
                'regional_id' => $id,
                'province' => $regionalData['province'],
                'district' => $regionalData['district']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Data regional berhasil dihapus'
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Failed to delete regional: " . $th->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data regional',
                'error' => $th->getMessage()
            ], 500);
        }
    }
}
