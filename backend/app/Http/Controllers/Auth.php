<?php

namespace App\Http\Controllers;

use App\Mail\OtpMail;
use App\Models\Otp;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class Auth extends Controller
{
    /**Refactor
     * 
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'       => ['required','email','exists:users,email'],
            'password'    => ['required','min:6'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 403);
        }

        $deviceIdentifier = $request->userAgent() . '|' . $request->ip();
        // Find or create device
        $device = $user->UserDevices()->firstOrCreate(
            ['device_fingerprint' => $deviceIdentifier],
            [
                'device_name' => $validated['device_name'] ?? $request->userAgent(),
                'user_agent'  => $request->userAgent(),
                'first_ip'    => $request->ip(),
            ]
        );

        $device->last_seen_at = now();
        $device->last_ip = $request->ip();
        $device->save();

        if ($device->verified_at && $device->verified_at->gt(now()->subDay())) {
            return $this->issueTokenResponse($user, $device, 'Device already verified');
        }

        // Send OTP if device not yet verified
        $otpCode = rand(100000, 999999);
        $otpHash = Hash::make($otpCode);

        $otp = $user->otps()->create([
            'device_id'  => $device->id,
            'email'      => $user->email,
            'otp_hash'   => $otpHash,
            'purpose'    => 'login',
            'expires_at' => now()->addMinutes(1),
        ]);

        Mail::to($user->email)->send(new OtpMail($otpCode));

        $response = response()->json([
            'message' => 'OTP sent to your email',
            'otp_id'  => $otp->id,
            'email'   => $user->email,
        ]);

        foreach ($this->otpCookies($user->email, $otp->id) as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }

    public function logout(Request $request){
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No authenticated user'], 401);
        }

        $deviceIdentifier = $request->userAgent() . '|' . $request->ip();

        // Find the device
        $device = $user->UserDevices()
            ->where('device_fingerprint', $deviceIdentifier)
            ->first();

        if ($device) {
            // Delete refresh token for this device
            $device->refreshToken()->delete();

            // Optionally mark device as unverified
            $device->verified_at = null;
            $device->save();
        }

        $user->tokens()->delete();
        $user->otps()
            ->where('email', $user->email)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->update(['expires_at' => now()]);

        // Build response
        $response = response()->json(['message' => 'Logged out successfully']);

        // Forget refresh token cookie
        $response->headers->setCookie(
            cookie()->forget('refresh_token')
        );

        // Clear OTP cookies
        foreach ($this->clearOtpCookies() as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }


    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'email'              => 'required|email',
            'otp'                => 'required|string|size:6',
        ]);

        $deviceIdentifier = $request->userAgent() . '|' . $request->ip();
        
        $user = User::where('email', $validated['email'])->firstOrFail();

        $device = $user->UserDevices()->where('device_fingerprint', $deviceIdentifier)->firstOrFail();

        //get only not expired and not used login otps.
        $otp = $user->otps()
            ->where('email', $validated['email'])
            ->where('purpose', 'login')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp || !Hash::check($validated['otp'], $otp->otp_hash)) {
            return response()->json(['message' => 'Invalid or expired OTP'], 422);
        }

        // Mark OTP as used
        $otp->update([
            'is_used' => true,
            'used_at' => now(),
        ]);

        // Mark device as verified
        $device->verified_at = now();
        $device->save();

        // Issue access + refresh token
        $response = $this->issueTokenResponse($user, $device, 'OTP verified successfully');

        foreach ($this->clearOtpCookies() as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }


    public function resendOtp(Request $request)
    {
        $validated = $request->validate([
            'email'              => 'required|email|exists:users,email',
        ]);

        $deviceIdentifier = $request->userAgent() . '|' . $request->ip();

        $user = User::where('email', $validated['email'])->firstOrFail();

        $device = $user->UserDevices()->where('device_fingerprint', $deviceIdentifier)->firstOrFail();

        // Invalidate all otp for this device making the request.
       $user->otps()
            ->where('email', $validated['email'])
            ->where('purpose', 'login')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->update(['expires_at' => now()]);

        // Generate new OTP if none exists or expired
        $otpCode = rand(100000, 999999);
        $otpHash = Hash::make($otpCode);

        $otp = $user->otps()->create([
            'device_id'  => $device->id,
            'email'      => $user->email,
            'otp_hash'   => $otpHash,
            'purpose'    => 'login',
            'expires_at' => now()->addMinutes(1),
        ]);

        Mail::to($user->email)->send(new OtpMail($otpCode));

        $response = response()->json([
            'message' => 'OTP sent to your email',
            'otp_id'  => $otp->id,
            'email'   => $user->email,
        ]);

        foreach ($this->otpCookies($user->email) as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }


    public function refreshToken(Request $request)
    {
        $plainRefreshToken = $request->cookie('refresh_token');

        if (!$plainRefreshToken) {
            return response()->json(['message' => 'Refresh token missing'], 401);
        }

        $hashedToken = hash('sha256', $plainRefreshToken);

        $refreshToken = RefreshToken::where('token', $hashedToken)
            ->where('expires_at', '>', now())
            ->first();

        if (!$refreshToken) {
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }

        $user = $refreshToken->user;
        $device = $refreshToken->userDevice;

        if (!$user || !$device) {
            return response()->json(['message' => 'User or device not found'], 401);
        }

        // Issue new access token
        $accessToken = $user->createToken($device->device_fingerprint)->plainTextToken;

        // Rotate refresh token
        $newPlainRefreshToken = bin2hex(random_bytes(32));
        $refreshToken->update([
            'token'      => hash('sha256', $newPlainRefreshToken),
            'expires_at' => now()->addDays(30),
        ]);

        return response()->json([
            'access_token' => $accessToken,
            'message'      => 'Token refreshed successfully'
        ])->cookie(
            'refresh_token',
            $newPlainRefreshToken,
            60*24*30,
            '/',
            env('SESSION_DOMAIN'),
            app()->environment('production'),
            true,
            true,
            'Strict'
        );
    }


    private function issueTokenResponse(User $user, $device, $message)
    {
        // Create Sanctum access token
        $accessToken = $user->createToken($device->device_fingerprint)->plainTextToken;

        // Create hashed refresh token
        $plainRefreshToken = bin2hex(random_bytes(32));
        $device->refreshToken()->updateOrCreate(
            ['device_id' => $device->id],
            [
                'user_id' => $user->id,
                'token' => hash('sha256', $plainRefreshToken),
                'expires_at' => now()->addDays(30),
            ]
        ); 

        // Build response
        $response = response()->json([
            'message' => $message,
        ]);

        // Attach access token cookie
        $response->headers->setCookie(
            cookie(
                'auth_token',
                $accessToken,
                60, // 60 minutes
                '/',
                env('SESSION_DOMAIN'),
                app()->environment('production'),
                true,  // secure
                true,  // HttpOnly
                'Strict'
            )
        );

        // Attach refresh token cookie
        $response->headers->setCookie(
            cookie(
                'refresh_token',
                $plainRefreshToken,
                60 * 24, // 1 day
                '/',
                env('SESSION_DOMAIN'),
                app()->environment('production'),
                true,  // secure
                true,  // HttpOnly
                'Strict'
            )
        );

        return $response;
    }

    // Create OTP cookies for the frontend to used
    private function otpCookies($email)
    {
        $duration = 1; //1 minutes
        
        return [
            cookie('otp_email', $email, $duration, '/', env("SESSION_DOMAIN"), app()->environment('production'), false, false, 'Lax'),
        ];
    }

    // Clear OTP cookies
    private function clearOtpCookies()
    {
        return [
            cookie('otp_email', null, -1, '/', env("SESSION_DOMAIN"), app()->environment('production'), false, false, 'Lax'),
        ];
    }
}
