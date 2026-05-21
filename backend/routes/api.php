<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\ApplyInstalmentController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\InstalmentController;
use App\Http\Controllers\API\OfficerController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\SocietyController;
use App\Http\Controllers\API\ValidationController;
use App\Http\Controllers\API\ValidatorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix("v1")->group(function () {
    Route::prefix("auth")->group(function () {
        Route::post("/login", [AuthController::class, "Login"]);
        Route::post("/register", [AuthController::class, "Register"]);
    });

    Route::middleware("auth:sanctum")->group(function () {

        // Auth protected routes
        Route::prefix("auth")->group(function () {
            Route::post("/logout", [AuthController::class, "Logout"]);
            Route::get("/profile", [AuthController::class, "Profile"]);
        });

        Route::middleware("society")->group(function () {

            // Validation
            Route::post("/validation", [ValidationController::class, "createValidation"]);
            Route::get("/validations", [ValidationController::class, "getValidation"]);

            // Instalment cars (view only)
            Route::prefix("instalment_cars")->group(function () {
                Route::get("/", [InstalmentController::class, "getAllCars"]);
                Route::get("/{id}", [InstalmentController::class, "getDetailCars"]);
            });

            // Applications
            Route::prefix("applications")->group(function () {
                Route::post("/", [ApplyInstalmentController::class, "createApply"]);
                Route::get("/", [ApplyInstalmentController::class, "getAllSocietyInstalment"]);
            });

            // Payments
            Route::prefix("payments")->group(function () {
                Route::get("/schedule", [SocietyController::class, "getPaymentSchedule"]);
                Route::post("/pay", [SocietyController::class, "payInstallment"]);
                Route::get("/history", [SocietyController::class, "getPaymentHistory"]);
            });
        });

        // Staff routes (admin, officer, validator)
        Route::middleware("staff")->group(function () {
            Route::middleware("admin")->group(function () {
                // Dashboard & Reports
                Route::get("/dashboard", [ReportController::class, "getDashboardSummary"]);
                Route::get("/reports/validations", [ReportController::class, "getValidationReport"]);
                Route::get("/reports/installments", [ReportController::class, "getInstallmentReport"]);

                // Validator/Officer Management
                Route::post("/users", [AdminController::class, "createUser"]);
                Route::get("/validators", [AdminController::class, "getAllValidators"]);
                Route::get("/validators/{id}", [AdminController::class, "getValidatorDetail"]);
                Route::put("/validators/role", [AdminController::class, "updateValidatorRole"]);
                Route::delete("/validators", [AdminController::class, "deleteValidator"]);
                Route::post("/validators/reset-password", [AdminController::class, "resetPassword"]);
            });

            // Officer routes
            Route::middleware("officer")->group(function () {
                Route::prefix("officer")->group(function () {
                    // Brand management
                    Route::post("/brands", [OfficerController::class, "createBrand"]);

                    // Car management
                    Route::get("/cars", [OfficerController::class, "getAllCarsDetail"]);
                    Route::post("/cars", [OfficerController::class, "createCar"]);
                    Route::put("/cars", [OfficerController::class, "updateCar"]);
                    Route::delete("/cars", [OfficerController::class, "deleteCar"]);

                    // Tenor management
                    Route::post("/tenors", [OfficerController::class, "createAvailableMonth"]);
                    Route::put("/tenors", [OfficerController::class, "updateAvailableMonth"]);
                    Route::delete("/tenors", [OfficerController::class, "deleteAvailableMonth"]);

                    // Reports
                    Route::get("/reports/cars", [ReportController::class, "getCarReport"]);
                    Route::get("/reports/payments", [ReportController::class, "getPaymentReport"]);
                    Route::get("/reports/societies", [ReportController::class, "getSocietyReport"]);
                    Route::get("/reports/validations", [ReportController::class, "getValidationReport"]);
                    Route::get("/reports/applications", [ReportController::class, "getInstallmentReport"]);
                });
            });

            // Validator routes
            Route::middleware("validator")->group(function () {
                Route::prefix("validator")->group(function () {
                    // Validation management
                    Route::get("/validations", [ValidatorController::class, "getAllValidations"]);
                    Route::get("/validations/{id}", [ValidatorController::class, "getValidationDetail"]);
                    Route::post("/validations/validate", [ValidatorController::class, "validateSociety"]);

                    // Installment application management
                    Route::get("/applications", [ValidatorController::class, "getAllApplyInstallments"]);
                    Route::post("/applications/approve", [ValidatorController::class, "approveInstallment"]);

                    // Reports
                    Route::get("/reports/validations", [ReportController::class, "getValidationReport"]);
                    Route::get("/reports/installments", [ReportController::class, "getInstallmentReport"]);
                });
            });
        });
    });
});
