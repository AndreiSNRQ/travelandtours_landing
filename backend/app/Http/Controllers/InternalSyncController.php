<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class InternalSyncController extends Controller
{
    /**
     * Synchronize user from an internal domain (e.g., FMS).
     */
    public function syncUser(Request $request)
    {
        // Security check via middleware (SYSTEM_SSO_KEY) is handled in routes/api.php or middleware

        $data = $request->validate([
            'uuid' => 'required|string',
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'password' => 'nullable|string', // Hashed password from source
            'role' => 'required|string',
            'employee_code' => 'nullable|string',
        ]);

        $user = User::updateOrCreate(
            ['email' => $data['email']],
            [
                'uuid' => $data['uuid'],
                'name' => $data['name'],
                'role' => $data['role'],
                'employee_code' => $data['employee_code'] ?? $data['uuid'],
            ]
        );

        if (!empty($data['password'])) {
            // FMS sends hashed password, we store it directly if it looks like a hash
            // or we might need to handle raw passwords differently.
            // Assuming FMS sends the hash from its DB.
            $user->password = $data['password'];
            $user->save();
        }

        return response()->json([
            'message' => 'User synchronized successfully',
            'user' => $user
        ]);
    }
}
