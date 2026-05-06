<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Otp extends Model
{
    use HasFactory;

    protected $table = 'otps';

    protected $fillable = [
        'user_id',
        'email',
        'otp_hash',
        'purpose',
        'ip_address',
        'user_agent',
        'is_used',
        'used_at',
        'expires_at',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function userDevice(): BelongsTo
    {
        return $this->belongsTo(UserDevice::class);
    }
}
