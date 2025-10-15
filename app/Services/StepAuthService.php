<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StepAuthService
{
    /**
     * Attempt to authenticate against the STEP API using the provided credentials.
     *
     * @throws \RuntimeException
     * @throws \Illuminate\Http\Client\ConnectionException
     */
    public function attempt(string $email, string $password): Response
    {
        $client = $this->client();

        try {
            return $client->post('/auth/login', [
                'email' => $email,
                'password' => $password,
            ]);
        } catch (ConnectionException $exception) {
            throw $exception;
        }
    }

    /**
     * Build the HTTP client configured for the STEP API.
     */
    protected function client(): PendingRequest
    {
        $baseUrl = rtrim((string) config('services.step.base_url'), '/');

        if ($baseUrl === '') {
            throw new RuntimeException('STEP API base URL is not configured.');
        }

        $timeout = (int) config('services.step.timeout', 10);

        return Http::baseUrl($baseUrl)
            ->timeout($timeout)
            ->acceptJson();
    }
}
