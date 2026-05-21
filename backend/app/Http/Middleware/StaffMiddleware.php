<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                "message" => "Unauthenticated"
            ], 401);
        }

        if ($user instanceof \App\Models\User) {
            return $next($request);
        }

        return response()->json([
            "message" => "Access denied. Staff only."
        ], 403);
    }
}
