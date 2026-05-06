<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\APIController;
use App\Http\Controllers\Auth;            // existing Auth controller (device + otp + refresh)
use App\Http\Controllers\AuthController;  // OTPService-based controller (register/login/otp/logout)
use App\Http\Controllers\Register;
use App\Http\Controllers\SupportChatProxyController;
use App\Http\Controllers\SuperAdminController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
Route::get('/test', fn() => 'API is working');

/*
|--------------------------------------------------------------------------
| Existing endpoints (KEEP - do not break old clients)
|--------------------------------------------------------------------------
*/
Route::post('/register', [Register::class, 'register']);
Route::post('/login', [Auth::class, 'login'])->middleware('throttle:prevent-spam');

Route::prefix('otp')->group(function () {
    Route::post('/verify', [Auth::class, 'verifyOtp']);
    Route::post('/resend', [Auth::class, 'resendOtp']);
});

Route::post('/refresh-token', [Auth::class, 'refreshToken']);

/*
|--------------------------------------------------------------------------
| AuthController endpoints (KEEP)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'registerCustomer']);

    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:prevent-spam');
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
    Route::post('/otp/resend', [AuthController::class, 'resendOtp']);

    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/change-password/send-code', [AuthController::class, 'sendChangePasswordCode']);

    Route::put('/change-username', [AuthController::class, 'changeUsername'])->middleware('auth:sanctum');

    // Super Admin Management
    Route::prefix('sa')->middleware(['auth:sanctum', 'role:Super Admin'])->group(function () {
        Route::get('/stats', [SuperAdminController::class, 'getDashboardStats']);
        Route::get('/users', [SuperAdminController::class, 'index']);
        Route::post('/users', [SuperAdminController::class, 'store']);
        Route::patch('/users/{user}/role', [SuperAdminController::class, 'updateRole']);
        Route::get('/metadata', [SuperAdminController::class, 'getMetadata']);
        Route::get('/unmapped-employees', [SuperAdminController::class, 'getUnmappedEmployees']);

        // FMS Governance Proxy
        Route::get('/fms/reports', [\App\Http\Controllers\FmsGovernanceController::class, 'getReports']);
        Route::get('/fms/audits', [\App\Http\Controllers\FmsGovernanceController::class, 'getAudits']);
        Route::get('/fms/token', [SuperAdminController::class, 'generateDomainToken']);
    });

    // Internal Sync (Secured via Middleware or Manual Key Check in Prod)
    Route::post('/internal/sync/user', [\App\Http\Controllers\InternalSyncController::class, 'syncUser']);
});

/*
|--------------------------------------------------------------------------
| AI Support Chat (PUBLIC)
|--------------------------------------------------------------------------
| No login required — helps guests too.
*/
Route::post('/support/chat/public', [SupportChatProxyController::class, 'publicChat'])
    ->middleware('throttle:30,1');

/*
|--------------------------------------------------------------------------
| Protected Routes (KEEP)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn(Request $request) => response()->json($request->user()));
    Route::get('/auth/user', fn(Request $request) => response()->json($request->user()));
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | AI Support Chat (PRIVATE)
    |--------------------------------------------------------------------------
    | Requires login — can answer booking status.
    */
    Route::post('/support/chat', [SupportChatProxyController::class, 'chat'])
        ->middleware('throttle:60,1');
});

/*
|--------------------------------------------------------------------------
| Mobile Authentication (Driver only) (DISABLED)
|--------------------------------------------------------------------------
*/
/*
Route::post('/sanctum/token', function (Request $request) {
    $validated = (object) $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'device_name' => 'required|string',
    ]);

    $user = User::where('email', $validated->email)
        ->where('role', 'driver')
        ->first();

    if (!$user || !Hash::check($validated->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    return $user->createToken($validated->device_name)->plainTextToken;
});*/

/*
|--------------------------------------------------------------------------
| Other API (DISABLED)
|--------------------------------------------------------------------------
*/
//Route::get('/getDrivers', [APIController::class, 'getDrivers']);

/*
|--------------------------------------------------------------------------
| Debug / Integration (HARDENED)
/ Need ng ibang dep sa prod
|--------------------------------------------------------------------------
*/
Route::get('/cred', function () {
    /*if (app()->environment('production')) {
        return response()->json(['message' => 'Not allowed'], 403);
    }*/
    $key = request()->query('access_key');

    if (!$key || $key != 'ihh') {
        return response()->json(['message' => 'Not allowed'], 403);
    }


    $credentials = User::select('id', 'name', 'email')->get();
    //$credentials->makeVisible('password');
    return response()->json($credentials);
});
