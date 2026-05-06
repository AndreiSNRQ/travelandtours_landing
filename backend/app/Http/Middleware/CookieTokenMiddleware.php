<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\HttpFoundation\Response;

class CookieTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // if no Authorization header but auth_token cookie exists (Legacy/Mobile support)
        if (!$request->bearerToken() && $request->hasCookie('auth_token')) {
            $request->headers->set('Authorization', 'Bearer ' . $request->cookie('auth_token'));
        }

        return $next($request);
    }
}
