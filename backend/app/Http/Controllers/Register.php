<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class Register extends Controller
{
    public function register(Request $request)
    {
        $validated = (object) $request->validate([
            'name'      => ['required', 'min:6'],
            'email'     => ['required', 'email', 'unique:users,email'],
            'password'  => ['required', 'min:6'],
            'role'      => [
                'required',
                Rule::in([
                    'HR1 Admin',
                    'HR2 Admin', 'Trainer', 'Employee',
                    'HR3 Admin',
                    'HR4 Admin', 'HR4 Manager',
                    'LogisticsI Admin', 'Manager', 'Staff',
                    'Fleet Manager', 'Driver',
                    'Facility Admin', 'Legal Admin', 'Front Desk Admin', 'Super Admin'
                ]),
            ],
        ]);

        User::create([
            'uuid'     => Str::uuid(),
            'name'     => $validated->name,
            'email'    => $validated->email,
            'password' => $validated->password,
            'role'     => $validated->role,
        ]);

        return response()->json(['message' => 'Registered successfully'], 200);
    }
}
