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

    /**
     * Retrieve a list of users from the STEP API.
     *
     * @param  array<string, mixed>  $payload
     */
    public function listUsers(array $payload = []): Response
    {
        $client = $this->client();
        $token = (string) config('services.step.token', '');

        if ($token !== '') {
            $client = $client->withToken($token);
        }

        try {
            return $client->get('/list/users', $payload);
        } catch (ConnectionException $exception) {
            throw $exception;
        }
    }
}
