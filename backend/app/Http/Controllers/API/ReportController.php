<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\InstallmentApplyStatus;
use App\Models\InstallmentPayment;
use App\Models\Society;
use App\Models\Validation;
use App\Models\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    /**
     * Laporan validasi
     */
    public function getValidationReport(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User) {
                return response()->json([
                    "message" => "Only staff can access reports"
                ], 403);
            }

            $validationStats = Validation::select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->get()
                ->pluck('total', 'status')
                ->toArray();

            $totalValidations = Validation::count();

            $validationsByRegional = Validation::join('societies', 'validations.society_id', '=', 'societies.id')
                ->join('regionals', 'societies.regional_id', '=', 'regionals.id')
                ->select(
                    'regionals.id as regional_id',
                    'regionals.province',
                    'regionals.district',
                    DB::raw('count(*) as total'),
                    DB::raw("SUM(CASE WHEN validations.status = 'accepted' THEN 1 ELSE 0 END) as accepted"),
                    DB::raw("SUM(CASE WHEN validations.status = 'declined' THEN 1 ELSE 0 END) as declined"),
                    DB::raw("SUM(CASE WHEN validations.status = 'pending' THEN 1 ELSE 0 END) as pending")
                )
                ->groupBy('regionals.id', 'regionals.province', 'regionals.district')
                ->get();

            $reportData = [
                "summary" => [
                    "total_validations" => $totalValidations,
                    "accepted" => $validationStats['accepted'] ?? 0,
                    "declined" => $validationStats['declined'] ?? 0,
                    "pending" => $validationStats['pending'] ?? 0,
                    "acceptance_rate" => $totalValidations > 0
                        ? round((($validationStats['accepted'] ?? 0) / $totalValidations) * 100, 2)
                        : 0,
                ],
                "by_regional" => $validationsByRegional,
                "generated_at" => now()->format('Y-m-d H:i:s'),
                "generated_by" => $user->name
            ];

            if ($request->has('download') && $request->download === 'pdf') {
                $pdf = Pdf::loadView('reports.validation-report', ['data' => $reportData]);
                return $pdf->download('validation-report-' . now()->format('Y-m-d') . '.pdf');
            }

            return response()->json([
                "report" => $reportData
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get validation report failed", [
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
     * Laporan pengajuan kredit
     */
    public function getInstallmentReport(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User) {
                return response()->json([
                    "message" => "Only staff can access reports"
                ], 403);
            }

            $applicationStats = InstallmentApplyStatus::select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->get()
                ->pluck('total', 'status')
                ->toArray();

            $totalApplications = InstallmentApplyStatus::count();

            $applicationsByCar = InstallmentApplyStatus::join('installments', 'installment_apply_status.installment_id', '=', 'installments.id')
                ->join('brands', 'installments.brand_id', '=', 'brands.id')
                ->select(
                    'installments.id as car_id',
                    'installments.cars as car_name',
                    'brands.brand',
                    DB::raw('count(*) as total'),
                    DB::raw("SUM(CASE WHEN installment_apply_status.status = 'accepted' THEN 1 ELSE 0 END) as accepted"),
                    DB::raw("SUM(CASE WHEN installment_apply_status.status = 'rejected' THEN 1 ELSE 0 END) as rejected"),
                    DB::raw("SUM(CASE WHEN installment_apply_status.status = 'pending' THEN 1 ELSE 0 END) as pending")
                )
                ->groupBy('installments.id', 'installments.cars', 'brands.brand')
                ->get();

            $reportData = [
                "summary" => [
                    "total_applications" => $totalApplications,
                    "accepted" => $applicationStats['accepted'] ?? 0,
                    "rejected" => $applicationStats['rejected'] ?? 0,
                    "pending" => $applicationStats['pending'] ?? 0,
                    "approval_rate" => $totalApplications > 0
                        ? round((($applicationStats['accepted'] ?? 0) / $totalApplications) * 100, 2)
                        : 0,
                ],
                "by_car" => $applicationsByCar,
                "generated_at" => now()->format('Y-m-d H:i:s'),
                "generated_by" => $user->name
            ];

            // Check if PDF download is requested
            if ($request->has('download') && $request->download === 'pdf') {
                $pdf = Pdf::loadView('reports.installment-report', ['data' => $reportData]);
                return $pdf->download('installment-report-' . now()->format('Y-m-d') . '.pdf');
            }

            return response()->json([
                "report" => $reportData
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get installment report failed", [
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
     * Laporan daftar mobil & tenor (OFFICER)
     */
    public function getCarReport(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'officer') {
                return response()->json([
                    "message" => "Only officers can access this report"
                ], 403);
            }

            $cars = Installment::with(['brand', 'availableMonths'])
                ->withCount('installmentApplySocieties')
                ->orderBy('created_at', 'desc')
                ->get();

            $reportData = [
                "summary" => [
                    "total_cars" => $cars->count(),
                    "total_brands" => \App\Models\Brand::count(),
                    "total_tenors" => \App\Models\AvailableMonth::count(),
                ],
                "cars" => $cars->map(function($car) {
                    return [
                        "car" => $car->cars,
                        "brand" => $car->brand->brand ?? 'N/A',
                        "price" => $car->price,
                        "description" => $car->description,
                        "total_applications" => $car->installment_apply_societies_count,
                        "tenors" => $car->availableMonths->map(function($tenor) {
                            return [
                                "month" => $tenor->month,
                                "nominal" => $tenor->nominal,
                                "description" => $tenor->description
                            ];
                        })
                    ];
                }),
                "generated_at" => now()->format('Y-m-d H:i:s'),
                "generated_by" => $user->name
            ];

            if ($request->has('download') && $request->download === 'pdf') {
                $pdf = Pdf::loadView('reports.car-report', ['data' => $reportData]);
                return $pdf->download('car-report-' . now()->format('Y-m-d') . '.pdf');
            }

            return response()->json([
                "report" => $reportData
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get car report failed", ["exception" => $th]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Laporan pembayaran cicilan (OFFICER)
     */
    public function getPaymentReport(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'officer') {
                return response()->json([
                    "message" => "Only officers can access this report"
                ], 403);
            }

            $paymentStats = InstallmentPayment::select('status', DB::raw('count(*) as total'), DB::raw('sum(payment_amount) as total_amount'))
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            $totalPayments = InstallmentPayment::count();
            $totalAmount = InstallmentPayment::sum('payment_amount');
            $totalPaidAmount = InstallmentPayment::where('status', 'paid')->sum('payment_amount');

            $latePayments = InstallmentPayment::where('status', 'unpaid')
                ->where('due_date', '<', now())
                ->count();

            $reportData = [
                "summary" => [
                    "total_payments" => $totalPayments,
                    "total_amount" => $totalAmount,
                    "total_paid" => $totalPaidAmount,
                    "paid_count" => $paymentStats['paid']->total ?? 0,
                    "unpaid_count" => $paymentStats['unpaid']->total ?? 0,
                    "late_count" => $latePayments,
                    "collection_rate" => $totalAmount > 0
                        ? round(($totalPaidAmount / $totalAmount) * 100, 2)
                        : 0,
                ],
                "generated_at" => now()->format('Y-m-d H:i:s'),
                "generated_by" => $user->name
            ];

            if ($request->has('download') && $request->download === 'pdf') {
                $pdf = Pdf::loadView('reports.payment-report', ['data' => $reportData]);
                return $pdf->download('payment-report-' . now()->format('Y-m-d') . '.pdf');
            }

            return response()->json([
                "report" => $reportData
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get payment report failed", ["exception" => $th]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Laporan society yang sudah validasi & mengajukan (OFFICER)
     */
    public function getSocietyReport(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'officer') {
                return response()->json([
                    "message" => "Only officers can access this report"
                ], 403);
            }

            $societies = Society::with(['regional', 'validations', 'installmentApplySocieties'])
                ->whereHas('validations')
                ->get();

            $reportData = [
                "summary" => [
                    "total_societies" => $societies->count(),
                    "validated" => $societies->where('validations.status', 'accepted')->count(),
                    "pending_validation" => $societies->where('validations.status', 'pending')->count(),
                    "applied_installment" => $societies->filter(function($s) {
                        return $s->installmentApplySocieties->count() > 0;
                    })->count(),
                ],
                "societies" => $societies->map(function($society) {
                    return [
                        "name" => $society->name,
                        "id_card_number" => $society->id_card_number,
                        "gender" => $society->gender,
                        "regional" => $society->regional ? $society->regional->province . ', ' . $society->regional->district : 'N/A',
                        "validation_status" => $society->validations->first()->status ?? 'N/A',
                        "job" => $society->validations->first()->job ?? 'N/A',
                        "income" => $society->validations->first()->income ?? 0,
                        "total_applications" => $society->installmentApplySocieties->count(),
                    ];
                }),
                "generated_at" => now()->format('Y-m-d H:i:s'),
                "generated_by" => $user->name
            ];

            if ($request->has('download') && $request->download === 'pdf') {
                $pdf = Pdf::loadView('reports.society-report', ['data' => $reportData]);
                return $pdf->download('society-report-' . now()->format('Y-m-d') . '.pdf');
            }

            return response()->json([
                "report" => $reportData
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get society report failed", ["exception" => $th]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Dashboard summary untuk admin
     */
    public function getDashboardSummary(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
                return response()->json([
                    "message" => "Only admin can access dashboard"
                ], 403);
            }

            return response()->json([
                "dashboard" => [
                    "total_societies" => Society::count(),
                    "total_validators" => Validator::count(),
                    "total_cars" => Installment::count(),
                    "pending_validations" => Validation::where('status', 'pending')->count(),
                    "pending_applications" => InstallmentApplyStatus::where('status', 'pending')->count(),
                    "total_revenue" => InstallmentPayment::where('status', 'paid')->sum('payment_amount'),
                ]
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Get dashboard failed", ["exception" => $th]);

            return response()->json([
                "message" => "Server error",
                "errors" => $th->getMessage()
            ], 500);
        }
    }
}
