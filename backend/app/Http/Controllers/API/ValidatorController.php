<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\InstallmentApplySociety;
use App\Models\InstallmentApplyStatus;
use App\Models\InstallmentPayment;
use App\Models\Validation;
use App\Models\Validator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ValidatorController extends Controller
{
    /**
     * Approve pengajuan installment & generate payment schedule
     */
    public function approveInstallment(Request $request)
    {
        DB::beginTransaction();
        try {
            $request->validate([
                "application_id" => "required|exists:installment_apply_societies,id",
            ]);

            // Ambil data application dengan relasi
            $application = InstallmentApplySociety::with(['installment', 'availableMonth'])
                ->findOrFail($request->application_id);

            // Cek apakah sudah ada payment schedule
            $existingPayments = InstallmentPayment::where('installment_apply_society_id', $application->id)
                ->exists();

            if ($existingPayments) {
                return response()->json([
                    "message" => "Payment schedule already generated for this application"
                ], 400);
            }

            // Update status di installment_apply_status
            $applyStatus = InstallmentApplyStatus::where('installment_apply_society_id', $application->id)
                ->first();

            if ($applyStatus) {
                $applyStatus->update([
                    'status' => 'accepted',
                    'date' => now(),
                ]);
            } else {
                // Jika belum ada record status, buat baru
                InstallmentApplyStatus::create([
                    'date' => now(),
                    'society_id' => $application->society_id,
                    'installment_id' => $application->installment_id,
                    'available_month_id' => $application->available_month_id,
                    'installment_apply_society_id' => $application->id,
                    'status' => 'accepted',
                ]);
            }

            // ** GENERATE PAYMENT SCHEDULE **
            $this->generatePaymentSchedule($application);

            DB::commit();

            return response()->json([
                "message" => "Application approved and payment schedule generated",
                "application_id" => $application->id,
                "society_id" => $application->society_id
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error("Approve installment failed", [
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
     * Generate payment schedule otomatis
     */
    private function generatePaymentSchedule($application)
    {
        $totalPrice = $application->installment->price;
        $tenorMonths = $application->availableMonth->month;
        $monthlyPayment = (int) ceil($totalPrice / $tenorMonths);

        $startDate = now();

        for ($i = 1; $i <= $tenorMonths; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);

            InstallmentPayment::create([
                'installment_apply_society_id' => $application->id,
                'society_id' => $application->society_id,
                'month_number' => $i,
                'payment_amount' => $monthlyPayment,
                'due_date' => $dueDate->format('Y-m-d'),
                'status' => 'unpaid',
            ]);
        }

        Log::info("Payment schedule generated successfully", [
            'application_id' => $application->id,
            'total_price' => $totalPrice,
            'tenor_months' => $tenorMonths,
            'monthly_payment' => $monthlyPayment,
            'total_payments' => $tenorMonths
        ]);
    }
    /**
     * Melihat semua pengajuan validasi pending
     */
    public function getAllValidations(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'validator') {
                return response()->json([
                    "message" => "Only validators can access this"
                ], 403);
            }

            $validations = Validation::with(['society.regional'])
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                "validations" => $validations->map(function ($validation) {
                    return [
                        "id" => $validation->id,
                        "society" => [
                            "id" => $validation->society->id,
                            "name" => $validation->society->name,
                            "id_card_number" => $validation->society->id_card_number,
                            "gender" => $validation->society->gender,
                            "address" => $validation->society->address,
                            "regional" => $validation->society->regional ? [
                                "id" => $validation->society->regional->id,
                                "province" => $validation->society->regional->province,
                                "district" => $validation->society->regional->district,
                            ] : null,
                        ],
                        "job" => $validation->job,
                        "job_description" => $validation->job_description,
                        "income" => $validation->income,
                        "reason_accepted" => $validation->reason_accepted,
                        "status" => $validation->status,
                        "created_at" => $validation->created_at,
                    ];
                }),
                "total" => $validations->count()
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get all validations failed", [
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
     * Detail validasi society tertentu
     */
    public function getValidationDetail(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'validator') {
                return response()->json([
                    "message" => "Only validators can access this"
                ], 403);
            }

            $validation = Validation::with(['society.regional', 'validator'])
                ->find($id);

            if (!$validation) {
                return response()->json([
                    "message" => "Validation not found"
                ], 404);
            }

            return response()->json([
                "validation" => [
                    "id" => $validation->id,
                    "status" => $validation->status,
                    "society" => [
                        "id" => $validation->society->id,
                        "name" => $validation->society->name,
                        "id_card_number" => $validation->society->id_card_number,
                        "born_date" => $validation->society->born_date,
                        "gender" => $validation->society->gender,
                        "address" => $validation->society->address,
                        "regional" => $validation->society->regional ? [
                            "id" => $validation->society->regional->id,
                            "province" => $validation->society->regional->province,
                            "district" => $validation->society->regional->district,
                        ] : null,
                    ],
                    "job" => $validation->job,
                    "job_description" => $validation->job_description,
                    "income" => $validation->income,
                    "reason_accepted" => $validation->reason_accepted,
                    "validator_notes" => $validation->validator_notes,
                    "validator" => $validation->validator ? [
                        "id" => $validation->validator->id,
                        "name" => $validation->validator->name,
                    ] : null,
                    "created_at" => $validation->created_at,
                    "updated_at" => $validation->updated_at,
                ]
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get validation detail failed", [
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
     * Menyetujui/menolak validasi
     */
    public function validateSociety(Request $request)
    {
        DB::beginTransaction();

        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'validator') {
                return response()->json([
                    "message" => "Only validators can access this"
                ], 403);
            }

            $request->validate([
                "validation_id" => "required|exists:validations,id",
                "status" => "required|in:accepted,declined",
                "validator_notes" => "required|string|min:5"
            ]);

            $validator = Validator::where('user_id', $user->id)->first();

            if (!$validator) {
                return response()->json([
                    "message" => "Validator profile not found"
                ], 404);
            }

            $validation = Validation::where('id', $request->validation_id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$validation) {
                return response()->json([
                    "message" => "Validation not found or already processed"
                ], 404);
            }

            $validation->update([
                "status" => $request->status,
                "validator_notes" => $request->validator_notes,
                "validator_id" => $validator->id
            ]);

            DB::commit();

            $statusMessage = $request->status === 'accepted' ? 'accepted' : 'declined';

            Log::info("Validation {$statusMessage}", [
                "validation_id" => $validation->id,
                "validator_id" => $validator->id,
                "society_id" => $validation->society_id,
                "status" => $request->status
            ]);

            return response()->json([
                "message" => "Validation has been {$statusMessage} successfully",
                "validation" => [
                    "id" => $validation->id,
                    "status" => $validation->status,
                    "validator_notes" => $validation->validator_notes,
                    "validator" => [
                        "id" => $validator->id,
                        "name" => $validator->name,
                    ]
                ]
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Validate society failed", [
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
     * Melihat semua pengajuan kredit pending
     */
    public function getAllApplyInstallments(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'validator') {
                return response()->json([
                    "message" => "Only validators can access this"
                ], 403);
            }

            $applications = InstallmentApplyStatus::with([
                'society.regional',
                'installment.brand',
                'availableMonth',
                'installmentApplySociety'
            ])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                "applications" => $applications->map(function ($application) {
                    return [
                        "id" => $application->id,
                        "date" => $application->date,
                        "status" => $application->status,
                        "society" => [
                            "id" => $application->society->id,
                            "name" => $application->society->name,
                            "id_card_number" => $application->society->id_card_number,
                            "gender" => $application->society->gender,
                            "address" => $application->society->address,
                            "regional" => $application->society->regional ? [
                                "id" => $application->society->regional->id,
                                "province" => $application->society->regional->province,
                                "district" => $application->society->regional->district,
                            ] : null,
                        ],
                        "car" => [
                            "id" => $application->installment->id,
                            "name" => $application->installment->cars,
                            "brand" => $application->installment->brand->brand ?? null,
                            "price" => $application->installment->price,
                        ],
                        "tenor" => [
                            "id" => $application->availableMonth->id,
                            "month" => $application->availableMonth->month,
                            "nominal_per_month" => $application->availableMonth->nominal,
                        ],
                        "notes" => $application->installmentApplySociety->notes ?? null,
                        "created_at" => $application->created_at,
                    ];
                }),
                "total" => $applications->count()
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get all apply installments failed", [
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
     * Generate installment payments setelah application approved
     */
    private function generateInstallmentPayments($application)
    {
        $tenorMonths = $application->availableMonth->month;
        $monthlyPayment = $application->availableMonth->nominal;
        $startDate = Carbon::now();

        $payments = [];

        for ($i = 1; $i <= $tenorMonths; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);

            $payments[] = [
                "installment_apply_society_id" => $application->installment_apply_societies_id,
                "society_id" => $application->society_id,
                "payment_amount" => $monthlyPayment,
                "month_number" => $i,
                "status" => "unpaid",
                "due_date" => $dueDate->format('Y-m-d'),
                "paid_date" => null,
                "created_at" => now(),
                "updated_at" => now(),
            ];
        }

        InstallmentPayment::insert($payments);

        Log::info("Installment payments generated", [
            "application_id" => $application->id,
            "total_months" => $tenorMonths,
            "monthly_payment" => $monthlyPayment,
            "total_amount" => $monthlyPayment * $tenorMonths
        ]);

        return true;
    }
}
