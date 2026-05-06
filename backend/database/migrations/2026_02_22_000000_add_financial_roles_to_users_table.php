<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we can change the enum by modifying the column
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'HR1 Admin', 'HR2 Admin', 'Employee', 'Trainer',
            'HR3 Admin', 'HR4 Admin', 'HR4 Manager',
            'CT1 Admin', 'Tour Operator',
            'LogisticsI Admin', 'Manager', 'Staff',
            'Fleet Manager', 'Driver',
            'Facility Admin', 'Legal Admin', 'Front Desk Admin', 'Administrative Admin',
            'Super Admin', 'Customer',
            'Financial Admin', 'Budget Officer', 'Collection Officer',
            'Disbursement Officer', 'Ledger Accountant', 'Receivable/Payable Officer'
        ) DEFAULT 'Employee'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'HR1 Admin', 'HR2 Admin', 'Employee', 'Trainer',
            'HR3 Admin', 'HR4 Admin', 'HR4 Manager',
            'CT1 Admin', 'Tour Operator',
            'LogisticsI Admin', 'Manager', 'Staff',
            'Fleet Manager', 'Driver',
            'Facility Admin', 'Legal Admin', 'Front Desk Admin', 'Administrative Admin',
            'Super Admin', 'Customer'
        ) DEFAULT 'Employee'");
    }
};
