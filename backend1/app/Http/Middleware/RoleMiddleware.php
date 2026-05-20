<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if(!in_array($user->user()->role, $roles)) {
            return response()->json([
                "message" => "ypu dont have access to this feature"
            ], 403);
        }
        return $next($request);
    }
}
