<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\InstallmentPayment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SocietyController extends Controller
{
    /**
     * Melihat jadwal cicilan setelah pengajuan disetujui
     */
    public function getPaymentSchedule(Request $request)
    {
        try {
            $user = $request->user();

        if (!$user instanceof \App\Models\Society) {
            return response()->json([
                "message" => "Unauthorized"
            ], 403);
        }

        // DEBUG: Log user ID
        Log::info("Looking for payments with society_id: " . $user->id);

        // Cek dulu tanpa relasi untuk memastikan data ada
        $paymentsCheck = InstallmentPayment::where('society_id', $user->id)->get();
        Log::info("Found payments: " . $paymentsCheck->count());

        if ($paymentsCheck->isNotEmpty()) {
            Log::info("Payment data sample: ", $paymentsCheck->first()->toArray());
        }

        $payments = InstallmentPayment::with([
            'installmentApplySociety.installment.brand',
            'installmentApplySociety.availableMonth'
        ])
        ->where('society_id', $user->id)
        ->orderBy('month_number')
        ->get();

        if ($payments->isEmpty()) {
            return response()->json([
                "message" => "No payment schedule found. Your application might not be approved yet.",
                "payments" => []
            ], 200);
        }

            $firstPayment = $payments->first();
            $totalPaid = $payments->where('status', 'paid')->sum('payment_amount');
            $totalAmount = $payments->sum('payment_amount');
            $remainingAmount = $totalAmount - $totalPaid;

            return response()->json([
                "payments" => [
                    "car_info" => [
                        "car" => $firstPayment->installmentApplySociety->installment->cars ?? null,
                        "brand" => $firstPayment->installmentApplySociety->installment->brand->brand ?? null,
                        "tenor" => $firstPayment->installmentApplySociety->availableMonth->month ?? null . " months",
                    ],
                    "summary" => [
                        "total_amount" => $totalAmount,
                        "total_paid" => $totalPaid,
                        "remaining_amount" => $remainingAmount,
                        "total_months" => $payments->count(),
                        "paid_months" => $payments->where('status', 'paid')->count(),
                        "unpaid_months" => $payments->where('status', 'unpaid')->count(),
                        "late_months" => $payments->where('status', 'late')->count(),
                    ],
                    "schedule" => $payments->map(function($payment) {
                        return [
                            "id" => $payment->id,
                            "month_number" => $payment->month_number,
                            "payment_amount" => $payment->payment_amount,
                            "status" => $payment->status,
                            "due_date" => $payment->due_date,
                            "paid_date" => $payment->paid_date,
                            "is_overdue" => $payment->status !== 'paid' && Carbon::parse($payment->due_date)->isPast(),
                        ];
                    })
                ]
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get payment schedule failed", [
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
     * Bayar cicilan
     */
    public function payInstallment(Request $request)
    {
        DB::beginTransaction();

        try {
            $user = $request->user();

            $request->validate([
                "payment_id" => "required|exists:installment_payments,id",
                "payment_amount" => "required|numeric|min:0"
            ]);

            if (!$user instanceof \App\Models\Society) {
                return response()->json([
                    "message" => "Unauthorized"
                ], 403);
            }

            $payment = InstallmentPayment::with('installmentApplySociety')
                ->where('id', $request->payment_id)
                ->where('society_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$payment) {
                return response()->json([
                    "message" => "Payment not found or unauthorized"
                ], 404);
            }

            if ($payment->status === 'paid') {
                return response()->json([
                    "message" => "This installment has already been paid"
                ], 400);
            }

            if ($request->payment_amount < $payment->payment_amount) {
                return response()->json([
                    "message" => "Payment amount is less than the required amount",
                    "required_amount" => $payment->payment_amount,
                    "your_payment" => $request->payment_amount
                ], 400);
            }

            $payment->update([
                "status" => "paid",
                "paid_date" => now(),
                "payment_amount" => $request->payment_amount
            ]);

            Log::info("Installment paid successfully", [
                "society_id" => $user->id,
                "payment_id" => $payment->id,
                "amount" => $request->payment_amount,
                "month_number" => $payment->month_number
            ]);

            DB::commit();

            return response()->json([
                "message" => "Payment successful",
                "payment" => [
                    "id" => $payment->id,
                    "month_number" => $payment->month_number,
                    "amount_paid" => $request->payment_amount,
                    "paid_date" => $payment->paid_date,
                    "status" => $payment->status
                ]
            ], 200);

        } catch (\Throwable $th) {
            DB::rollBack();

            Log::error("Payment failed", [
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
     * Melihat history pembayaran
     */
    public function getPaymentHistory(Request $request)
    {
        try {
            $user = $request->user();

            $payments = InstallmentPayment::with('installmentApplySociety.installment.brand')
                ->where('society_id', $user->id)
                ->where('status', 'paid')
                ->orderBy('paid_date', 'desc')
                ->get();

            return response()->json([
                "history" => $payments->map(function($payment) {
                    return [
                        "id" => $payment->id,
                        "car" => $payment->installmentApplySociety->installment->cars ?? null,
                        "brand" => $payment->installmentApplySociety->installment->brand->brand ?? null,
                        "month_number" => $payment->month_number,
                        "amount" => $payment->payment_amount,
                        "paid_date" => $payment->paid_date,
                        "due_date" => $payment->due_date,
                    ];
                })
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get payment history failed", ["exception" => $th]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }
}
