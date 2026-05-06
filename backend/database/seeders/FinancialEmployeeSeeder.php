<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FinancialEmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Financial Admin',
                'email' => 'seminmencias300+finadmin@gmail.com',
                'password' => '#AD2610',
                'role' => 'Financial Admin',
                'employee_code' => 'F261001',
            ],
            [
                'name' => 'Budget Officer',
                'email' => 'seminmencias300+budget@gmail.com',
                'password' => '#BO2610',
                'role' => 'Budget Officer',
                'employee_code' => 'F261002',
            ],
            [
                'name' => 'Collection Officer',
                'email' => 'seminmencias300+collection@gmail.com',
                'password' => '#CO2610',
                'role' => 'Collection Officer',
                'employee_code' => 'F261003',
            ],
            [
                'name' => 'Disbursement Officer',
                'email' => 'seminmencias300+disbursement@gmail.com',
                'password' => '#DO2610',
                'role' => 'Disbursement Officer',
                'employee_code' => 'F261004',
            ],
            [
                'name' => 'Ledger Accountant',
                'email' => 'seminmencias300+ledger@gmail.com',
                'password' => '#LA2610',
                'role' => 'Ledger Accountant',
                'employee_code' => 'F261005',
            ],
            [
                'name' => 'Receivable/Payable Officer',
                'email' => 'seminmencias300+rp@gmail.com',
                'password' => '#RPO2610',
                'role' => 'Receivable/Payable Officer',
                'employee_code' => 'F261006',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'uuid' => (string) Str::uuid(),
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'employee_code' => $userData['employee_code'],
                ]
            );
        }
    }
}
