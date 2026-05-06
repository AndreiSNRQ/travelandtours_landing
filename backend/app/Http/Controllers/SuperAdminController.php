<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Otp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SuperAdminController extends Controller
{
    const AVAILABLE_ROLES = [
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
        'Receivable/Payable Officer'
    ];

    const AVAILABLE_DOMAINS = [
        'Human Resource',
        'Operational Logistics',
        'Corporate Support',
        'Governance',
        'Public Service',
        'Standard Operations'
    ];
    /**
     * Display dashboard statistics.
     */
    public function getDashboardStats()
    {
        $totalUsers = User::count();
        $verifiedUsers = User::whereNotNull('last_verified_at')->count();
        $domainAdmins = User::where('role', 'like', '%Admin%')->count();
        $customers = User::where('role', 'Customer')->count();

        // Calculate real activity trend for the last 24 hours
        $now = Carbon::now();
        $activityData = collect(range(0, 23))->map(function ($hourOffset) use ($now) {
            $targetTime = $now->copy()->subHours(23 - $hourOffset);
            $hourStart = $targetTime->copy()->startOfHour();
            $hourEnd = $targetTime->copy()->endOfHour();

            // Real traffic: Count of OTP requests (proxy for auth activity)
            $requestsCount = Otp::whereBetween('created_at', [$hourStart, $hourEnd])->count();

            // Real reliability: Percentage of OTPs used successfully
            $totalOtps = Otp::whereBetween('created_at', [$hourStart, $hourEnd])->count();
            $usedOtps = Otp::whereBetween('created_at', [$hourStart, $hourEnd])
                ->where('is_used', true)
                ->count();

            $reliabilityScore = $totalOtps > 0 ? ($usedOtps / $totalOtps) * 100 : 100;

            return [
                'time' => $hourStart->format('H:00'),
                'requests' => $requestsCount,
                'reliability' => round($reliabilityScore, 1),
            ];
        });

        return response()->json([
            'metrics' => [
                ['label' => 'Verified Identities', 'value' => $verifiedUsers . '/' . $totalUsers, 'color' => 'text-emerald-400', 'status' => 'Synced'],
                ['label' => 'Privileged Access', 'value' => $domainAdmins, 'color' => 'text-primary', 'status' => 'Authorized'],
                ['label' => 'Service Reach', 'value' => $customers, 'color' => 'text-accent', 'status' => 'Direct'],
                ['label' => 'System Uptime', 'value' => '99.99%', 'color' => 'text-emerald-500', 'status' => 'Live'],
            ],
            'domain_health' => [
                ['name' => 'Human Capital', 'status' => 'Operational', 'uptime' => '99.9%', 'color' => 'text-emerald-400', 'icon' => 'HC'],
                ['name' => 'Operational Logistics', 'status' => 'Operational', 'uptime' => '99.7%', 'color' => 'text-emerald-400', 'icon' => 'OL'],
                ['name' => 'Commercial & Travel', 'status' => 'Operational', 'uptime' => '99.8%', 'color' => 'text-emerald-400', 'icon' => 'CT'],
                ['name' => 'Corporate Services', 'status' => 'Operational', 'uptime' => '100%', 'color' => 'text-emerald-400', 'icon' => 'CS'],
            ],
            'integrations' => [
                ['label' => 'Identity Gateway Service', 'status' => 'ENCRYPTED', 'color' => 'text-primary', 'icon' => 'Database'],
                ['label' => 'Telemetry Sync Bridge', 'status' => 'ACTIVE', 'color' => 'text-accent', 'icon' => 'Zap'],
                ['label' => 'Cross-Domain SSO Provider', 'status' => 'READY', 'color' => 'text-emerald-400', 'icon' => 'Lock'],
                ['label' => 'Governance Compliance Auditor', 'status' => 'MONITORING', 'color' => 'text-zinc-400', 'icon' => 'Server'],
            ],
            'activity_data' => $activityData
        ]);
    }

    /**
     * Create a new enterprise user account.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => Rule::in(self::AVAILABLE_ROLES),
            'employee_code' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'uuid' => (string) \Str::uuid(),
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'employee_code' => $data['employee_code'] ?? 'EMP-' . strtoupper(\Str::random(6)),
        ]);

        return response()->json([
            'message' => 'Identity account created and synchronized',
            'user' => $user
        ], 201);
    }

    /**
     * Display a listing of enterprise users.
     */
    public function index()
    {
        $users = User::select(['id', 'uuid', 'name', 'email', 'role', 'employee_code', 'last_verified_at', 'created_at'])
            ->latest()
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'employee_code' => $user->employee_code ?? 'N/A',
                    'verified' => !is_null($user->last_verified_at),
                    'domain' => $this->getDomainFromRole($user->role),
                    'created_at' => $user->created_at ? $user->created_at->toIso8601String() : null,
                ];
            });

        return response()->json($users);
    }

    /**
     * Update user role.
     */
    public function updateRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', 'string', Rule::in(self::AVAILABLE_ROLES)],
        ]);

        $user->update(['role' => $data['role']]);

        return response()->json([
            'message' => 'User role updated successfully and synchronized',
            'user' => $user
        ]);
    }

    /**
     * Securely provisions an SSO token via FMS API.
     */
    public function generateDomainToken(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'Super Admin') {
            return response()->json(['message' => 'Unauthorized governance action'], 403);
        }

        try {
            $fmsUrl = env('FMS_BACKEND_URL');
            $response = Http::withHeaders([
                'X-Internal-Sync-Key' => env('SYSTEM_SSO_KEY')
            ])->post("{$fmsUrl}/internal/sync/sso-token", [
                        'email' => $user->email
                    ]);

            if ($response->failed()) {
                Log::error("SSO Token Provisioning Failed: " . $response->body());
                return response()->json(['message' => 'SSO Handshake Failed'], 502);
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error("generateDomainToken Error: " . $e->getMessage());
            return response()->json(['message' => 'Internal Synchronization Error'], 500);
        }
    }

    private function syncUserToFms(User $user, $rawPassword = null)
    {
        $logisticsRoles = ['LogisticsI Admin', 'Fleet Manager', 'Driver', 'Super Admin'];

        if (!in_array($user->role, $logisticsRoles)) {
            return;
        }

        try {
            $fmsUrl = env('FMS_BACKEND_URL');
            Http::withHeaders([
                'X-Internal-Sync-Key' => env('SYSTEM_SSO_KEY')
            ])->post("{$fmsUrl}/internal/sync/user", [
                        'uuid' => $user->employee_code ?? $user->uuid,
                        'name' => $user->name,
                        'email' => $user->email,
                        'password' => $user->password, // Send hashed password
                        'role' => $user->role,
                    ]);
        } catch (\Exception $e) {
            Log::error("syncUserToFms Failed for {$user->email}: " . $e->getMessage());
        }
    }

    public function getMetadata()
    {
        return response()->json([
            'roles' => self::AVAILABLE_ROLES,
            'departments' => self::AVAILABLE_DOMAINS
        ]);
    }

    public function getUnmappedEmployees()
    {
        try {
            $allEmployees = [];
            $page = 1;
            $hasMore = true;

            // Simple loop to fetch employees (max 10 per page as per user info)
            // We'll limit to prevent infinite loops if something goes wrong
            while ($hasMore && $page < 100) {
                $response = Http::get("https://back.hr4armai.jampzdev.com/api/employees", ['page' => $page]);

                if ($response->failed()) {
                    break;
                }

                $data = $response->json();
                $employees = $data['data'] ?? [];

                if (empty($employees)) {
                    $hasMore = false;
                } else {
                    $allEmployees = array_merge($allEmployees, $employees);
                    $page++;
                    // Check if we've reached the last page from typical Laravel pagination
                    if (isset($data['current_page']) && isset($data['last_page']) && $data['current_page'] >= $data['last_page']) {
                        $hasMore = false;
                    }
                }
            }

            // Get all existing employee codes from our system
            $existingCodes = User::whereNotNull('employee_code')->pluck('employee_code')->toArray();

            // Filter out employees who already have an account
            $unmapped = array_filter($allEmployees, function ($emp) use ($existingCodes) {
                return !in_array($emp['employee_code'], $existingCodes);
            });

            return response()->json(array_values($unmapped));
        } catch (\Exception $e) {
            Log::error("getUnmappedEmployees Error: " . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch HR data'], 500);
        }
    }

    /**
     * Helper to map roles to enterprise domains.
     */
    private function getDomainFromRole(?string $role): string
    {
        if (empty($role)) {
            return 'Standard Operations';
        }

        if (str_contains($role, 'HR'))
            return 'Human Capital';
        if (str_contains($role, 'Logistics') || in_array($role, ['Fleet Manager', 'Driver']))
            return 'Operational Logistics';
        if (in_array($role, ['Facility Admin', 'Legal Admin', 'Front Desk Admin']))
            return 'Corporate Support';
        if ($role === 'Super Admin')
            return 'Governance';
        if ($role === 'Customer')
            return 'Public Service';

        return 'Standard Operations';
    }
}
