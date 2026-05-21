<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OfficerMiddleware
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

        if ($user instanceof User && $user->role === 'officer') {
            return $next($request);
        }

        return response()->json([
            "message" => "Access denied. Officer only."
        ], 403);
    }
}
