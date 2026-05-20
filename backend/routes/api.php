<?php

use App\Http\Controllers\API\ApplyInstalmentController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\InstalmentController;
use App\Http\Controllers\API\ValidationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix("v1")->group(function() {
    Route::prefix("auth")->group(function() {
        Route::post("/login", [AuthController::class, "Login"]);
        Route::post("/logout", [AuthController::class, "Logout"])->middleware("auth:sanctum");
    });

    Route::middleware("auth:sanctum")->group(function() {
        Route::post("/validation", [ValidationController::class, "createValidation"]);
        Route::get("/validations", [ValidationController::class, "getValidation"]);

        Route::prefix("instalment_cars")->group(function() {
            Route::get("/", [InstalmentController::class, "getAllCars"]);
            Route::get("/{id}", [InstalmentController::class, "getDetailCars"]);
        });

        Route::prefix("applications")->group(function() {
            Route::post("/", [ApplyInstalmentController::class, "createApply"]);
            Route::get("/", [ApplyInstalmentController::class, "getAllSocietyInstalment"]);
        });
    });
});
