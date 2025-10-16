<?php

namespace App\Http\Requests\Auth;

use App\Models\Role;
use App\Models\User;
use App\Services\StepAuthService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Validate the request's credentials and return the user without logging them in.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validateCredentials(): User
    {
        $this->ensureIsNotRateLimited();

        /** @var StepAuthService $stepAuth */
        $stepAuth = app(StepAuthService::class);

        try {
            $response = $stepAuth->attempt(
                $this->input('email'),
                $this->input('password')
            );
        } catch (ConnectionException $exception) {
            throw ValidationException::withMessages([
                'email' => __('Unable to reach the authentication service. Please try again later.'),
            ]);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'email' => __('Authentication service is misconfigured. Please contact support.'),
            ]);
        } catch (Throwable $exception) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if ($response->failed()) {
            RateLimiter::hit($this->throttleKey());

            $message = $response->json('message') ?? __('auth.failed');

            throw ValidationException::withMessages([
                'email' => $message,
            ]);
        }

        $payload = $response->json();
        $userData = $payload['user'] ?? null;
        $token = $payload['token'] ?? null;

        if (! is_array($userData) || ! is_string($token) || $token === '') {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $email = $userData['email'] ?? $this->input('email');

        /** @var User $user */
        $user = User::firstOrNew(['email' => $email]);

        $user->name = $userData['name'] ?? $user->name ?? $email;

        $user->password = Hash::make($this->input('password'));

        $user->save();

        $roles = collect($userData['roles'] ?? [])
            ->map(function ($role) {
                if (is_string($role)) {
                    return $role;
                }

                if (is_array($role)) {
                    if (isset($role['name']) && is_string($role['name'])) {
                        return $role['name'];
                    }

                    if (isset($role['title']) && is_string($role['title'])) {
                        return $role['title'];
                    }
                }

                return null;
            })
            ->filter()
            ->unique()
            ->values();

        if ($roles->isNotEmpty()) {
            $roleIds = [];
            foreach ($roles as $roleName) {
                $role = Role::firstOrCreate(['name' => $roleName]);
                $roleIds[] = $role->id;
            }

            $user->roles()->sync($roleIds);
        } else {
            $user->roles()->detach();
        }

        $this->attributes->set('step_auth', [
            'token' => $token,
            'user' => $userData,
        ]);

        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate-limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return $this->string('email')
            ->lower()
            ->append('|'.$this->ip())
            ->transliterate()
            ->value();
    }
}
