<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'step' => [
        'base_url' => env('STEP_API_BASE_URL', 'https://udd.steps.com.ph/api'),
        'timeout' => env('STEP_API_TIMEOUT', 10),
        'token' => env('STEP_API_TOKEN'),
    ],

    'winston_ai' => [
        'token' => env('WINSTON_AI_API_TOKEN', ''),
        'plagiarism_endpoint' => env('WINSTON_AI_PLAGIARISM_ENDPOINT', 'https://api.gowinston.ai/v2/plagiarism'),
        'default_language' => env('WINSTON_AI_DEFAULT_LANGUAGE', 'en'),
        'default_country' => env('WINSTON_AI_DEFAULT_COUNTRY', 'us'),
    ],

];
