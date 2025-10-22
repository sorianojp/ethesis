<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use App\Services\StepAuthService;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Throwable;

class SyncStepUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'step:sync-users
        {--per-page=100 : Number of users to fetch per page (1-100)}
        {--page= : Fetch a specific page (1-indexed)}
        {--dry-run : Preview the sync without modifying the database}';

    /**
     * The console command description.
     *
     * @var string|null
     */
    protected $description = 'Synchronize user accounts from the STEP directory into the local database';

    public function handle(StepAuthService $stepAuth): int
    {
        $perPage = (int) $this->option('per-page');
        $perPage = max(1, min($perPage, 100));
        $requestedPage = $this->option('page');
        $requestedPage = is_null($requestedPage) ? null : max(1, (int) $requestedPage);
        $dryRun = (bool) $this->option('dry-run');

        $page = $requestedPage ?? 1;
        $created = 0;
        $updated = 0;
        $processed = 0;
        $skipped = 0;

        $this->info(sprintf(
            'Starting STEP user sync%s...',
            $dryRun ? ' (dry run)' : ''
        ));

        while (true) {
            $payload = [
                'per_page' => $perPage,
                'page' => $page,
            ];

            try {
                $response = $stepAuth->listUsers($payload);
            } catch (ConnectionException $exception) {
                $this->error('Unable to reach the STEP API: '.$exception->getMessage());

                return self::FAILURE;
            } catch (Throwable $exception) {
                $this->error('Unexpected error contacting STEP: '.$exception->getMessage());

                return self::FAILURE;
            }

            if ($response->failed()) {
                $message = $response->json('message') ?? $response->body() ?? 'Unknown error';
                $this->error(sprintf(
                    'STEP API responded with HTTP %d: %s',
                    $response->status(),
                    $message
                ));

                return self::FAILURE;
            }

            $payloadData = $response->json();

            if (! is_array($payloadData)) {
                $this->error('Unexpected response payload from STEP.');

                return self::FAILURE;
            }

            $users = is_array($payloadData['data'] ?? null) ? $payloadData['data'] : [];
            $meta = is_array($payloadData['meta'] ?? null) ? $payloadData['meta'] : [];

            $currentPage = (int) (
                $payloadData['current_page']
                ?? $meta['current_page']
                ?? $page
            );
            $lastPage = (int) (
                $payloadData['last_page']
                ?? $meta['last_page']
                ?? $currentPage
            );
            $totalCount = (int) (
                $payloadData['total']
                ?? $meta['total']
                ?? 0
            );

            $this->line(sprintf(
                'Fetched %d user%s from STEP (page %d of %d%s).',
                count($users),
                count($users) === 1 ? '' : 's',
                $currentPage,
                $lastPage,
                $totalCount > 0 ? ", total {$totalCount}" : ''
            ));

            foreach ($users as $userData) {
                if (! is_array($userData)) {
                    $skipped++;
                    continue;
                }

                $email = filter_var($userData['email'] ?? null, FILTER_VALIDATE_EMAIL);
                $name = $userData['name'] ?? null;

                if (! is_string($email)) {
                    $skipped++;
                    $this->warn('Skipped user with invalid email address.');
                    continue;
                }

                $processed++;

                if ($dryRun) {
                    continue;
                }

                DB::transaction(function () use ($email, $name, $userData, &$created, &$updated) {
                    $user = User::firstOrNew(['email' => $email]);
                    $isNew = ! $user->exists;

                    $user->name = is_string($name) && $name !== '' ? $name : ($user->name ?? $email);

                    if ($isNew) {
                        $user->password = Hash::make(Str::random(40));
                    }

                    $user->save();

                    $roleNames = $this->extractRoleNames($userData);

                    if ($roleNames->isNotEmpty()) {
                        $roleIds = [];

                        foreach ($roleNames as $roleName) {
                            $role = Role::firstOrCreate(['name' => $roleName]);
                            $roleIds[] = $role->id;
                        }

                        $user->roles()->sync($roleIds);
                    } else {
                        $user->roles()->detach();
                    }

                    if ($isNew) {
                        $created++;
                    } else {
                        $updated++;
                    }
                });
            }

            if ($requestedPage !== null) {
                break;
            }

            if ($currentPage >= $lastPage || empty($users)) {
                break;
            }

            $page++;
        }

        $this->newLine();
        $this->info(sprintf(
            'Processed %d user%s (%d created, %d updated, %d skipped)%s.',
            $processed,
            $processed === 1 ? '' : 's',
            $created,
            $updated,
            $skipped,
            $dryRun ? ' [dry run]' : ''
        ));

        return self::SUCCESS;
    }

    /**
     * @param  array<string, mixed>  $userData
     * @return \Illuminate\Support\Collection<int, string>
     */
    private function extractRoleNames(array $userData): Collection
    {
        return collect($userData['roles'] ?? [])
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
            ->filter(fn ($role) => is_string($role) && $role !== '')
            ->map(fn ($role) => trim((string) $role))
            ->filter()
            ->unique()
            ->values();
    }
}
