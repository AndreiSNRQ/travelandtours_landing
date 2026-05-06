<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefreshToken extends Model
{
    protected $table = 'refresh_tokens';
    protected $fillable = [
        'token',
        'user_id',
        'device_id',
        'expires_at',
    ];

    public function user() : BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function userDevice() : BelongsTo
    {
        // 'device_id' is the foreign key on refresh_tokens table referencing user_devices.id
        return $this->belongsTo(UserDevice::class, 'device_id');
    }
}
