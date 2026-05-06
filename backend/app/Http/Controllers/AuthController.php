<?php

namespace App\Http\Controllers;

use App\Mail\ChangePass;
use App\Models\Otp;
use App\Models\User;
use App\Services\OTPService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(private OTPService $otpService)
    {
    }

    /**
     * Roles allowed for registration on this project.
     * Add/remove here only.
     */
    private function allowedRoles(): array
    {
        return [
            'HR1 Admin',
            'HR2 Admin',
            'Trainer',
            'Employee',
            'HR3 Admin',
            'HR4 Admin',
            'HR4 Manager',
            'LogisticsI Admin',
            'Manager',
            'Staff',
            'Fleet Manager',
            'Driver',
            'Facility Admin',
            'Legal Admin',
            'Front Desk Admin',
            'Super Admin',
            'Customer',
            'Financial Admin',
            'Budget Officer',
            'Collection Officer',
            'Disbursement Officer',
            'Ledger Accountant',
            'Receivable/Payable Officer',
        ];
    }

    /**
     * Your existing register endpoint (allows selecting role)
     * POST /api/register (based on your routes)
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(6)],
            'role' => ['required', Rule::in($this->allowedRoles())],
        ]);

        $this->registerUser(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
            role: $data['role']
        );

        return response()->json(['message' => 'Registered successfully'], 201);
    }

    /**
     * Customer registration for Jolitravel frontend
     * POST /api/auth/register
     *
     * Frontend payload: { name, email, password }
     */
    public function registerCustomer(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(6)],
        ]);

        $user = $this->registerUser(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
            role: 'Customer'
        );

        // Optional: auto-issue token on register (handy for SPA)
        $device = $request->userAgent() ?? 'spa';
        $token = $user->createToken($device)->plainTextToken;

        return response()->json([
            'message' => 'Registered successfully',
            'token' => $token,
            'user' => $user,
        ], 201)->cookie(
                'auth_token',
                $token,
                60,
                config('session.path'),
                config('session.domain'),
                config('session.secure'),
                false,
                false,
                config('session.same_site')
            );
    }

    /**
     * Shared user creation
     */
    private function registerUser(string $name, string $email, string $password, string $role): User
    {
        return User::create([
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => $role,
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $device = $data['device_name'] ?? $request->userAgent() ?? 'spa';

        // Check for Session-based bypass (IP + UserAgent) (DISABLED)
        /*
        $isSameSession =
            $user->last_verified_ip === $request->ip() &&
            $user->last_verified_agent === $request->userAgent();
        */
        // Check for Environment-based bypass (Emergency or Dev)
        $isBypassEnabled = env('SKIP_OTP', false);

        // Check for Mobile-specific bypass
        $isMobile = str_starts_with($device, 'tnvs-');
        $isMobileBypass = $isMobile && env('MOBILE_SKIP_OTP', false);

        if ($isBypassEnabled || $isMobileBypass) {
            $user->tokens()->delete();
            $reason = $isBypassEnabled ? 'OTP Bypassed via Environment' : 'Verified session persistence';

            $response = $this->issueTokenResponse($user, $device, $reason);
            $data = $response->getData(true);
            $data['otp_required'] = false;
            $response->setData($data);

            return $response->header('X-OTP-SKIPPED', true);
        }

        // Issue OTP for verification
        try {
            $otpService = app(\App\Services\OTPService::class);
            $otp = $otpService->sendOtp($user->email, 'login', $user->id, $request->ip(), $request->userAgent());
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Identity verification service unavailable',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Verification code sent',
            'otp_id' => $otp->id,
            'email' => $user->email,
            'requires_otp' => true,
            'otp_required' => true,
            'expires_at' => $otp->expires_at
        ], 200);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $result = $this->otpService->verifyOtp($data['email'], $data['otp']);

        if (!$result['status']) {
            return response()->json(['message' => $result['message']], 422);
        }

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $deviceName = $data['device_name'] ?? $request->userAgent() ?? 'spa';

        // Update or Create UserDevice
        $user->UserDevices()->updateOrCreate(
            ['device_name' => $deviceName],
            [
                'device_fingerprint' => $deviceName, // Simple fallback
                'user_agent' => $request->userAgent(),
                'verified_at' => now(),
                'last_seen_at' => now(),
                'last_ip' => $request->ip(),
            ]
        );

        $user->update([
            'last_verified_at' => now(),
            'last_verified_ip' => $request->ip(),
            'last_verified_agent' => $request->userAgent(),
        ]);

        $response = $this->issueTokenResponse($user, $deviceName, 'OTP verified successfully');

        foreach ($this->clearOtpCookies() as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }

    public function resendOtp(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        $result = $this->otpService->resendOtp(
            $user->email,
            $user->id,
            $request->ip(),
            $request->userAgent()
        );

        if (!$result['status']) {
            return response()->json(['message' => $result['message']], $result['code']);
        }

        $otp = $result['otp'];

        $response = response()->json([
            'message' => $result['message'],
            'otp_id' => $otp->id,
            'email' => $user->email,
            'expires_at' => $otp->expires_at,
        ]);

        foreach ($this->otpCookies($user->email, $otp->id, $otp->expires_at->toIso8601String()) as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->tokens()->delete();

            // expire active OTPs
            Otp::where('email', $user->email)
                ->where('is_used', false)
                ->where('expires_at', '>', now())
                ->update(['expires_at' => now()]);
        }

        // Handle Laravel session invalidation for stateful (browser) users
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $response = response()->json(['message' => 'Logged out']);

        $domain = config('session.domain');

        // Explicitly clear tokens and session cookies domain-wide
        $response->headers->setCookie(cookie()->forget('auth_token', config('session.path'), $domain));
        $response->headers->setCookie(cookie()->forget(config('session.cookie'), config('session.path'), $domain));
        $response->headers->setCookie(cookie()->forget('XSRF-TOKEN', config('session.path'), $domain));

        // Clear standard remember me cookie patterns
        $response->headers->setCookie(cookie()->forget('remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d', '/', $domain));

        foreach ($this->clearOtpCookies() as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }

    private function issueTokenResponse(User $user, string $device, string $message)
    {
        $token = $user->createToken($device)->plainTextToken;

        // If this is a stateful request (browser), log them into the session too for SSO
        /*
        $stateful = config('sanctum.stateful', []);
        $host = request()->getHost();
        $referer = request()->headers->get('referer');
        $refererHost = $referer ? parse_url($referer, PHP_URL_HOST) : null;
        $isStateful = in_array($host, $stateful) || ($refererHost && in_array($refererHost, $stateful));

        if ($isStateful) {
            Auth::login($user, true);
        }
        */

        return response()
            ->json([
                'message' => $message,
                'token' => $token,
                'user' => [
                    'uuid' => $user->employee_code ?? $user->uuid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ])
            ->cookie(
                'auth_token',
                $token,
                60 * 24,
                config('session.path'),
                config('session.domain'),
                config('session.secure'),
                false,
                false,
                config('session.same_site')
            );
    }

    private function otpCookies(string $email, int $otpId, string $expiresAt): array
    {
        $duration = 1; // minutes

        return [
            cookie('otp_email', $email, $duration, config('session.path'), config('session.domain'), config('session.secure'), false, false, config('session.same_site')),
            cookie('otp_id', (string) $otpId, $duration, config('session.path'), config('session.domain'), config('session.secure'), false, false, config('session.same_site')),
            cookie('otp_expires_at', $expiresAt, $duration, config('session.path'), config('session.domain'), config('session.secure'), false, false, config('session.same_site')),
        ];
    }

    private function clearOtpCookies(): array
    {
        return [
            cookie('otp_email', null, -1, config('session.path'), config('session.domain'), config('session.secure'), false, false, config('session.same_site')),
            cookie('otp_id', null, -1, config('session.path'), config('session.domain'), config('session.secure'), false, false, config('session.same_site')),
            cookie('otp_expires_at', null, -1, config('session.path'), config('session.domain'), config('session.secure'), false, false, config('session.same_site')),
        ];
    }

    //CHANGE PASSWORD METHODS ADDED BY LEAD
    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'otp' => ['required', 'string', 'size:6'],
            'currentPassword' => ['required', Password::min(6)],
            'newPassword' => ['required', Password::min(6)],
        ]);

        // find latest unused, unexpired change_password OTP for this user
        $otp = Otp::where('email', $data['email'])
            ->where('purpose', 'change_password')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp || !Hash::check($data['otp'], $otp->otp_hash)) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if (!Hash::check($data['currentPassword'], $user->password)) {
            return response()->json(['error' => ['currentPassword' => 'Invalid Password']], 422);
        }

        // update password
        $user->password = Hash::make($data['newPassword']);
        $user->save();

        // mark OTP used
        $otp->update(['is_used' => true, 'used_at' => now()]);


        return response()->json(['message' => 'Password changed successfully.']);
    }


    public function sendChangePasswordCode(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        $code = rand(100000, 999999);

        $otp_id = Otp::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'otp_hash' => Hash::make($code),
            'purpose' => 'change_password',
            'is_used' => false,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'expires_at' => now()->addMinutes(2),
        ]);

        Mail::to($user->email)->send(new ChangePass($code));

        return response()->json(['message' => 'Change password code sent to your email.', 'otp_id' => $otp_id->id]);
    }

    public function changeUsername(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'name' => ['required', 'string', 'min:6', 'max:255', 'unique:users,name'],
        ]);

        $user = $request->user();
        $user->name = $data['name'];
        $user->save();

        return response()->json(['message' => 'Username changed successfully.']);
    }
}
