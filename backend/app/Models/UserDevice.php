<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class UserDevice extends Model
{
    protected $table = 'user_devices';
    protected $fillable = [
        'user_id',
        'device_fingerprint',
        'device_name',
        'user_agent',
        'verified_at',
        'last_seen_at',
        'first_ip',
        'last_ip',
    ];

    protected $casts = [
        'verified_at'  => 'datetime',
        'last_seen_at' => 'datetime',
    ];
    
    public function user() : BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function refreshToken() : HasOne
    {
        // 'device_id' is the foreign key on refresh_tokens table
        return $this->hasOne(RefreshToken::class, 'device_id');
    }

    public function otps() : HasMany
    {
        return $this->hasMany(Otp::class);
    }
}
