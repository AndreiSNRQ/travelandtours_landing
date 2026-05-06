<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('otp_verified_at')->nullable()->after('email_verified_at');
            $table->string('last_verified_ip', 45)->nullable()->after('otp_verified_at');
            $table->text('last_verified_agent')->nullable()->after('last_verified_ip');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['otp_verified_at', 'last_verified_ip', 'last_verified_agent']);
        });
    }
};
