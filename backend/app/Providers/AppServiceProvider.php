<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Dotenv\Dotenv;
use Google\Rpc\Context\AttributeContext\Response;
use Illuminate\Support\Env;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Env::disablePutenv();
        Dotenv::createImmutable(base_path())->load(); 
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        RateLimiter::for('prevent-spam', function ($request) {
            return Limit::perMinute(5)
                    ->by($request->ip());
        });
    }
}
