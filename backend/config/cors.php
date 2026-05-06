<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_merge(explode(',', env('ALLOWED_ORIGINS')), [
        /**PROD */
        "https://landing.jolitravel.jampzdev.com",
        "https://front.jobfithr1.jampzdev.com",
        "https://tchr2.jampzdev.com",
        "https://hr3workforceops.jampzdev.com",
        "https://hr4armai.jampzdev.com",
        "https://front.hr4armai.jampzdev.com",
        "https://bookingtocbs.jampzdev.com",

        "https://front.Travagent.jampzdev.com",
        "https://front.qrlog1.jampzdev.com",
        "https://front.fmslog2.jampzdev.com",
        "https://superadministrative.jampzdev.com",
        "https://front.TechFince.jampzdev.com",

        /**BACKEND*/
        "https://back.fmslog2.jampzdev.com",

        /**LOCAL DEV */

        "http://landing.jolitravel.local:3000",
        "http://front.jobfithr1.jolitravel.local:3001",
        "http://front.tchr2.jolitravel.local:3002",
        "http://front.hr3workforceops.jolitravel.local:3003",
        "http://front.hr4armai.jolitravel.local:3004",
        "http://front.bookingTOCBS.jolitravel.local:3005",
        "http://front.Travagent.jolitravel.local:3006",
        "http://front.qrlog1.jolitravel.local:3007",
        "http://front.fleet.jolitravel.local:3008",
        "http://front.superadministrative.jolitravel.local:3009",
        "http://front.TechFince.jolitravel.local:3010"
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
