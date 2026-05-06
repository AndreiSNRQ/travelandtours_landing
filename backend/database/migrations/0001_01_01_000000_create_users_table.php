<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', [
                'HR1 Admin',
                'HR2 Admin', 'Employee', 'Trainer',
                'HR3 Admin',
                'HR4 Admin', 'HR4 Manager',
                'CT1 Admin',
                'Tour Operator',
                'LogisticsI Admin', 'Manager', 'Staff',
                'Fleet Manager', 'Driver',
                'Facility Admin', 'Legal Admin', 'Front Desk Admin', 'Administrative Admin',
                'Super Admin'
            ])->default('Employee');
            $table->rememberToken();
            $table->timestamps();
            $table->timestamp('last_login_at')->nullable();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Stable device identifier
            $table->text('device_fingerprint');

            // Human readable
            $table->string('device_name')->nullable();

            // Raw UA for auditing
            $table->text('user_agent');

            // Trust lifecycle
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();

            // Security metadata
            $table->string('first_ip', 45)->nullable();
            $table->string('last_ip', 45)->nullable();

            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
            $table->foreignId('device_id')
                ->nullable()
                ->constrained('user_devices')
                ->nullOnDelete()
                ->index();
        });
        
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('user_devices')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['token', 'expires_at']);
        });


        //refactor OTP datable
        Schema::create('otps', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('user_devices')->nullOnDelete();

            $table->string('email')->nullable()->index();
            $table->string('otp_hash')->index();
            $table->enum('purpose', ['login', 'password_reset', 'email_verify', 'change_password'])->index();

            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            $table->index(['email', 'purpose', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otps');
        Schema::dropIfExists('refresh_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
