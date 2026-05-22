<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Cek akses admin
     */
    private function checkAdminAccess($user)
    {
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return false;
        }
        return true;
    }

    /**
     * Membuat akun validator/officer
     * Insert users + validators
     */
    public function createUser(Request $request)
    {
        DB::beginTransaction();

        try {
            $user = $request->user();

            if (!$this->checkAdminAccess($user)) {
                return response()->json([
                    "message" => "Only admin can access this"
                ], 403);
            }

            $request->validate([
                "id_card_number" => "required|string|min:3|unique:users,id_card_number",
                "password" => "required|string|min:6",
                "name" => "required|string|max:255",
                "born_date" => "required|date",
                "gender" => "required|in:male,female",
                "address" => "required|string|max:500",
                "role" => "required|in:officer,validator"
            ]);

            // Create user with all required fields
            $newUser = User::create([
                "id_card_number" => $request->id_card_number,
                "password" => $request->password, // Will be auto-hashed due to cast
                "name" => $request->name,
                "born_date" => $request->born_date,
                "gender" => $request->gender,
                "address" => $request->address,
                "role" => $request->role // Set role in users table
            ]);

            // Create validator record
            $validator = Validator::create([
                "user_id" => $newUser->id,
                "role" => $request->role,
                "name" => $request->name
            ]);

            DB::commit();

            Log::info("New staff account created", [
                "admin_id" => $user->id,
                "new_user_id" => $newUser->id,
                "id_card_number" => $request->id_card_number,
                "role" => $request->role
            ]);

            return response()->json([
                "message" => "Staff account created successfully",
                "user" => [
                    "id" => $newUser->id,
                    "id_card_number" => $newUser->id_card_number,
                    "name" => $newUser->name,
                    "role" => $newUser->role,
                    "created_at" => $newUser->created_at
                ]
            ], 201);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Create user failed", [
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
     * Lihat semua validator/officer
     * Select validators join users
     */
    public function getAllValidators(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->checkAdminAccess($user)) {
                return response()->json([
                    "message" => "Only admin can access this"
                ], 403);
            }

            $validators = Validator::with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                "validators" => $validators->map(function($validator) {
                    return [
                        "id" => $validator->id,
                        "user_id" => $validator->user_id,
                        "id_card_number" => $validator->user->id_card_number ?? 'N/A',
                        "name" => $validator->name,
                        "role" => $validator->role,
                        "total_validations" => \App\Models\Validation::where('validator_id', $validator->id)->count(),
                        "recent_validations" => \App\Models\Validation::where('validator_id', $validator->id)
                            ->whereIn('status', ['accepted', 'declined'])
                            ->count(),
                        "created_at" => $validator->created_at,
                        "updated_at" => $validator->updated_at
                    ];
                }),
                "total" => $validators->count(),
                "summary" => [
                    "total_officers" => $validators->where('role', 'officer')->count(),
                    "total_validators" => $validators->where('role', 'validator')->count(),
                ]
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get all validators failed", [
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
     * Detail validator/officer
     */
    public function getValidatorDetail(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$this->checkAdminAccess($user)) {
                return response()->json([
                    "message" => "Only admin can access this"
                ], 403);
            }

            $validator = Validator::with(['user', 'validations'])
                ->find($id);

            if (!$validator) {
                return response()->json([
                    "message" => "Validator not found"
                ], 404);
            }

            return response()->json([
                "validator" => [
                    "id" => $validator->id,
                    "user_id" => $validator->user_id,
                    "id_card_number" => $validator->user->id_card_number ?? 'N/A',
                    "name" => $validator->name,
                    "role" => $validator->role,
                    "statistics" => [
                        "total_validations" => $validator->validations->count(),
                        "accepted" => $validator->validations->where('status', 'accepted')->count(),
                        "declined" => $validator->validations->where('status', 'declined')->count(),
                        "pending" => $validator->validations->where('status', 'pending')->count(),
                    ],
                    "recent_activities" => $validator->validations()
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function($validation) {
                            return [
                                "id" => $validation->id,
                                "status" => $validation->status,
                                "society_name" => $validation->society->name ?? 'N/A',
                                "created_at" => $validation->created_at
                            ];
                        }),
                    "created_at" => $validator->created_at,
                    "updated_at" => $validator->updated_at
                ]
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get validator detail failed", [
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
     * Update user (validator/officer) - All fields
     */
    public function updateUser(Request $request, $validator_id)
    {
        DB::beginTransaction();

        try {
            $admin = $request->user();

            if (!$this->checkAdminAccess($admin)) {
                return response()->json([
                    "message" => "Only admin can access this"
                ], 403);
            }

            $validator = Validator::with('user')->find($validator_id);

            if (!$validator) {
                return response()->json([
                    "message" => "Validator not found"
                ], 404);
            }

            if ($validator->user_id === $admin->id) {
                return response()->json([
                    "message" => "Cannot update your own account through this endpoint"
                ], 403);
            }

            $request->validate([
                "name" => "nullable|string|max:255",
                "id_card_number" => "nullable|string|min:3|unique:users,id_card_number," . $validator->user_id,
                "born_date" => "nullable|date",
                "gender" => "nullable|in:male,female",
                "address" => "nullable|string|max:500",
                "role" => "nullable|in:officer,validator",
                "old_password" => "nullable|string|min:6",
                "new_password" => "nullable|string|min:6|confirmed",
            ]);

            $changes = [];
            $userData = [];

            if ($request->has('name')) {
                $changes['name'] = ['old' => $validator->name, 'new' => $request->name];
                $userData['name'] = $request->name;
                $validator->name = $request->name;
            }

            if ($request->has('id_card_number')) {
                $changes['id_card_number'] = ['old' => $validator->user->id_card_number, 'new' => $request->id_card_number];
                $userData['id_card_number'] = $request->id_card_number;
            }

            if ($request->has('born_date')) {
                $changes['born_date'] = ['old' => $validator->user->born_date, 'new' => $request->born_date];
                $userData['born_date'] = $request->born_date;
            }

            if ($request->has('gender')) {
                $changes['gender'] = ['old' => $validator->user->gender, 'new' => $request->gender];
                $userData['gender'] = $request->gender;
            }

            if ($request->has('address')) {
                $changes['address'] = ['old' => $validator->user->address, 'new' => $request->address];
                $userData['address'] = $request->address;
            }

            if ($request->has('new_password')) {
                if (!$request->has('old_password')) {
                    return response()->json([
                        "message" => "Old password is required to change password"
                    ], 400);
                }

                if (!Hash::check($request->old_password, $validator->user->password)) {
                    return response()->json([
                        "message" => "Old password is incorrect"
                    ], 400);
                }

                $userData['password'] = Hash::make($request->new_password);
                $changes['password'] = 'changed';
            }

            if ($request->has('role')) {
                $changes['role'] = ['old' => $validator->role, 'new' => $request->role];
                $userData['role'] = $request->role;
                $validator->role = $request->role;
            }

            if (!empty($userData)) {
                $validator->user->update($userData);
            }

            if ($request->has('role') || $request->has('name')) {
                $validator->save();
            }

            DB::commit();

            Log::info("User updated by admin", [
                "admin_id" => $admin->id,
                "validator_id" => $validator->id,
                "updated_user_id" => $validator->user_id,
                "changes" => $changes
            ]);

            return response()->json([
                "message" => "User updated successfully",
                "user" => [
                    "id" => $validator->id,
                    "user_id" => $validator->user_id,
                    "id_card_number" => $validator->user->id_card_number,
                    "name" => $validator->name,
                    "born_date" => $validator->user->born_date,
                    "gender" => $validator->user->gender,
                    "address" => $validator->user->address,
                    "role" => $validator->role,
                    "updated_at" => $validator->user->updated_at
                ],
                "changes" => $changes
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Update user failed", [
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
     * Hapus akun validator/officer
     * Delete users cascade
     */
    public function deleteValidator(Request $request, $validator_id)
    {
        DB::beginTransaction();

        try {
            $user = $request->user();

            if (!$this->checkAdminAccess($user)) {
                return response()->json([
                    "message" => "Only admin can access this"
                ], 403);
            }

            // Cari validator dari URL parameter
            $validator = Validator::with('user')->find($validator_id);

            if (!$validator) {
                return response()->json([
                    "message" => "Validator not found"
                ], 404);
            }

            if ($validator->user_id === $user->id) {
                return response()->json([
                    "message" => "Cannot delete your own account"
                ], 403);
            }

            $hasPendingValidations = \App\Models\Validation::where('validator_id', $validator->id)
                ->where('status', 'pending')
                ->exists();

            if ($hasPendingValidations) {
                return response()->json([
                    "message" => "Cannot delete validator with pending validations"
                ], 400);
            }

            $validatorName = $validator->name;
            $validatorRole = $validator->role;
            $userId = $validator->user_id;

            // Delete user (cascade akan menghapus validator juga)
            $validator->user->delete();

            DB::commit();

            Log::info("Validator account deleted", [
                "admin_id" => $user->id,
                "deleted_user_id" => $userId,
                "validator_name" => $validatorName,
                "role" => $validatorRole
            ]);

            return response()->json([
                "message" => "Account deleted successfully",
                "deleted" => [
                    "id" => $validator_id,
                    "name" => $validatorName,
                    "role" => $validatorRole
                ]
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Delete validator failed", [
                "exception" => $th->getMessage(),
                "trace" => $th->getTraceAsString()
            ]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }
}
