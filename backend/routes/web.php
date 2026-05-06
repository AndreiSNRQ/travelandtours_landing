<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name', 'Auth Service'),
        'status' => 'ok',
        'message' => 'Auth backend is running.',
        'api_test' => url('/api/test'),
    ]);
});

Route::get('/health', fn () => response('OK', 200));
