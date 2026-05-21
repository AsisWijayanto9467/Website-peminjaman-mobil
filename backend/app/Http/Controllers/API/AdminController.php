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
                "username" => "required|string|min:3|unique:users,username",
                "password" => "required|string|min:6",
                "name" => "required|string|max:255",
                "role" => "required|in:officer,validator"
            ]);

            $newUser = User::create([
                "username" => $request->username,
                "password" => Hash::make($request->password),
            ]);

            $validator = Validator::create([
                "user_id" => $newUser->id,
                "role" => $request->role,
                "name" => $request->name
            ]);

            DB::commit();

            Log::info("New staff account created", [
                "admin_id" => $user->id,
                "new_user_id" => $newUser->id,
                "username" => $request->username,
                "role" => $request->role
            ]);

            return response()->json([
                "message" => "Staff account created successfully",
                "user" => [
                    "id" => $newUser->id,
                    "username" => $newUser->username,
                    "role" => $validator->role,
                    "name" => $validator->name,
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
                        "username" => $validator->user->username ?? 'N/A',
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
                    "username" => $validator->user->username ?? 'N/A',
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
     * Ubah role validator/officer
     * Update validators set role
     */
    public function updateValidatorRole(Request $request)
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
                "validator_id" => "required|exists:validators,id",
                "role" => "required|in:officer,validator"
            ]);

            $validator = Validator::find($request->validator_id);

            if ($validator->user_id === $user->id) {
                return response()->json([
                    "message" => "Cannot change your own role"
                ], 403);
            }

            $oldRole = $validator->role;
            $validator->update([
                "role" => $request->role
            ]);

            DB::commit();

            Log::info("Validator role updated", [
                "admin_id" => $user->id,
                "validator_id" => $validator->id,
                "old_role" => $oldRole,
                "new_role" => $request->role
            ]);

            return response()->json([
                "message" => "Role updated successfully",
                "validator" => [
                    "id" => $validator->id,
                    "name" => $validator->name,
                    "username" => $validator->user->username ?? 'N/A',
                    "role" => $validator->role,
                    "previous_role" => $oldRole
                ]
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Update validator role failed", [
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
    public function deleteValidator(Request $request)
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
                "validator_id" => "required|exists:validators,id"
            ]);

            $validator = Validator::with('user')->find($request->validator_id);

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

    /**
     * Reset password validator/officer
     */
    public function resetPassword(Request $request)
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
                "validator_id" => "required|exists:validators,id",
                "new_password" => "required|string|min:6"
            ]);

            $validator = Validator::find($request->validator_id);

            $validator->user->update([
                "password" => Hash::make($request->new_password)
            ]);

            DB::commit();

            Log::info("Password reset for validator", [
                "admin_id" => $user->id,
                "validator_id" => $validator->id
            ]);

            return response()->json([
                "message" => "Password reset successfully"
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Reset password failed", [
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
