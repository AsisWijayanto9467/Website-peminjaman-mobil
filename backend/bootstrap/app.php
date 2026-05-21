<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\OfficerMiddleware;
use App\Http\Middleware\SocietyMiddleware;
use App\Http\Middleware\StaffMiddleware;
use App\Http\Middleware\ValidatorMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'officer' => OfficerMiddleware::class,
            'validator' => ValidatorMiddleware::class,
            'staff' => StaffMiddleware::class,
            'society' => SocietyMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
