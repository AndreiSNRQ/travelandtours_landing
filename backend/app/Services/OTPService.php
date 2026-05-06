<?php

namespace App\Services;

use App\Mail\OtpMail;
use App\Models\Otp;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class OTPService
{
    /**
     * Generate and send OTP
     */
    public function sendOtp(string $email, string $purpose = 'login', $userId = null, $ip = null, $agent = null)
    {
        $otpCode = random_int(100000, 999999);
        $otpHash = Hash::make($otpCode);
        $expiresAt = Carbon::now()->addMinutes(1);

        $otp = Otp::create([
            'user_id' => $userId,
            'email' => $email,
            'otp_hash' => $otpHash,
            'purpose' => $purpose,
            'ip_address' => $ip,
            'user_agent' => $agent,
            'expires_at' => $expiresAt,
        ]);

        try {
            Mail::to($email)->send(new OtpMail($otpCode));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Mail Error: " . $e->getMessage());

            // Fail-Soft: If bypass is enabled, don't block the flow
            if (env('SKIP_OTP', false)) {
                \Illuminate\Support\Facades\Log::warning("Fail-Soft: OTP mail failed but bypass is ENABLED. Proceeding without sending email.");
                return $otp;
            }

            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => ['Failed to send OTP email: ' . $e->getMessage()]
            ]);
        }

        return $otp;
    }

    /**
     * Verify an OTP
     */
    public function verifyOtp(string $email, string $otpInput)
    {
        $record = Otp::where('email', $email)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$record) {
            return ['status' => false, 'message' => 'Invalid or expired OTP'];
        }

        if (!Hash::check($otpInput, $record->otp_hash)) {
            return ['status' => false, 'message' => 'Invalid OTP'];
        }

        $record->update([
            'is_used' => true,
            'used_by' => Auth::check() ? Auth::id() : $record->user_id,
            'used_at' => now(),
        ]);

        return ['status' => true, 'message' => 'OTP verified'];
    }

    public function resendOtp(string $email, $userId = null, $ip = null, $agent = null)
    {
        $lastOtp = Otp::where('email', $email)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();

        // 1. Check for backend authcontroller (and api.php) rules:
        // "Only resend OTP codes within 1 mins after the current one expires"
        if ($lastOtp) {
            // Calculate remaining seconds
            $secondsRemaining = now()->diffInSeconds($lastOtp->expires_at, false);
            if ($secondsRemaining > 0) {
                return [
                    'status' => false,
                    'code' => 429,
                    'message' => 'Please wait ' . ceil($secondsRemaining) . 's until current OTP expires.',
                ];
            }
        }

        // Mark previous unused OTPs as expired
        Otp::where('email', $email)
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->update(['expires_at' => now()]);

        // Generate and send new OTP
        $newOtp = $this->sendOtp($email, 'login', $userId, $ip, $agent);

        return [
            'status' => true,
            'message' => 'A new OTP has been sent to your email.',
            'otp' => $newOtp,
        ];
    }
}
