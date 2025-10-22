<?php

namespace App\Http\Controllers;

use App\Enums\ThesisStatus;
use App\Models\Thesis;
use App\Models\ThesisTitle;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $roleNames = $this->resolveRoleNames($user);
        $isTeacher = in_array('Teacher', $roleNames, true);
        $isStudent = in_array('Student', $roleNames, true) || ! $isTeacher;

        return Inertia::render('dashboard', [
            'dashboard' => [
                'viewer' => [
                    'name' => $user->name,
                    'isStudent' => $isStudent,
                    'isTeacher' => $isTeacher,
                ],
                'student' => $isStudent ? $this->buildStudentSummary($user) : null,
                'teacher' => $isTeacher ? $this->buildTeacherSummary($user) : null,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildStudentSummary(User $user): array
    {
        $activeThesis = ThesisTitle::query()
            ->with([
                'adviser:id,name',
                'members:id,name',
                'theses:id,thesis_title_id,status,chapter,post_grad,created_at,updated_at',
            ])
            ->withCount('theses')
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->first();

        $memberTheses = ThesisTitle::query()
            ->with([
                'user:id,name',
                'theses:id,thesis_title_id,status,chapter,created_at,updated_at',
            ])
            ->whereHas('members', fn ($query) => $query->where('users.id', $user->id))
            ->latest('created_at')
            ->limit(5)
            ->get();

        $needsAttention = collect();

        $activeThesisData = null;

        if ($activeThesis) {
            $statusCounts = [
                ThesisStatus::PENDING->value => 0,
                ThesisStatus::APPROVED->value => 0,
                ThesisStatus::REJECTED->value => 0,
            ];

            $programLevel = null;

            foreach ($activeThesis->theses as $thesis) {
                $status = $this->resolveThesisStatus($thesis->status);

                if (array_key_exists($status, $statusCounts)) {
                    $statusCounts[$status]++;
                }

                if (in_array(
                    $status,
                    [ThesisStatus::PENDING->value, ThesisStatus::REJECTED->value],
                    true
                )) {
                    $needsAttention->push([
                        'id' => $thesis->id,
                        'chapter' => $thesis->chapter,
                        'status' => $status,
                        'updated_at' => optional($thesis->updated_at)->toIso8601String(),
                        'submitted_at' => optional($thesis->created_at)->toIso8601String(),
                        'title' => $activeThesis->title,
                        'thesis_title_id' => $activeThesis->id,
                        'url' => route('thesis-titles.show', $activeThesis),
                        'sort' => optional($thesis->updated_at ?? $thesis->created_at)->timestamp ?? 0,
                    ]);
                }

                if ($programLevel === null && $thesis->post_grad !== null) {
                    $programLevel = $thesis->post_grad ? 'Postgrad' : 'Undergrad';
                }
            }

            $milestones = collect();
            $approvalFormLabel = null;
            $approvalFormUrl = null;
            $recommendedForm = null;

            if ($activeThesis->proposal_defense_at) {
                $milestones->push([
                    'type' => 'proposal',
                    'label' => 'Proposal Defense',
                    'date' => $activeThesis->proposal_defense_at->toIso8601String(),
                ]);
            }

            if ($activeThesis->final_defense_at) {
                $milestones->push([
                    'type' => 'final',
                    'label' => 'Final Defense',
                    'date' => $activeThesis->final_defense_at->toIso8601String(),
                ]);
            }

            if ($programLevel === null) {
                $programLevel = $this->resolveProgramLevelFromUser($user);
            }

            if ($programLevel === 'Postgrad') {
                $recommendedForm = 'postgrad';
                $approvalFormLabel = 'Postgraduate Approval Form';
                $approvalFormUrl = route('thesis-titles.approval-forms.postgrad', $activeThesis);
            } elseif ($programLevel === 'Undergrad') {
                $recommendedForm = 'undergrad';
                $approvalFormLabel = 'Undergraduate Approval Form';
                $approvalFormUrl = route('thesis-titles.approval-forms.undergrad', $activeThesis);
            }

            $activeThesisData = [
                'id' => $activeThesis->id,
                'title' => $activeThesis->title,
                'adviser' => $activeThesis->adviser?->only(['id', 'name']),
                'members' => $activeThesis->members
                    ->map(fn ($member) => $member->only(['id', 'name']))
                    ->values(),
                'statusCounts' => $statusCounts,
                'totalChapters' => $activeThesis->theses_count,
                'milestones' => $milestones->values(),
                'programLevel' => $programLevel,
                'links' => [
                    'view' => route('thesis-titles.show', $activeThesis),
                    'approvalForm' => $approvalFormUrl ? [
                        'label' => $approvalFormLabel,
                        'url' => $approvalFormUrl,
                        'key' => $recommendedForm,
                    ] : null,
                ],
            ];
        }

        $memberThesesData = $memberTheses->map(function (ThesisTitle $title) use ($needsAttention) {
            $pendingCount = 0;

            foreach ($title->theses as $thesis) {
                $status = $this->resolveThesisStatus($thesis->status);

                if ($status === ThesisStatus::PENDING->value) {
                    $pendingCount++;
                }

                if (in_array(
                    $status,
                    [ThesisStatus::PENDING->value, ThesisStatus::REJECTED->value],
                    true
                )) {
                    $needsAttention->push([
                        'id' => $thesis->id,
                        'chapter' => $thesis->chapter,
                        'status' => $status,
                        'updated_at' => optional($thesis->updated_at)->toIso8601String(),
                        'submitted_at' => optional($thesis->created_at)->toIso8601String(),
                        'title' => $title->title,
                        'thesis_title_id' => $title->id,
                        'url' => route('thesis-titles.show', $title),
                        'sort' => optional($thesis->updated_at ?? $thesis->created_at)->timestamp ?? 0,
                    ]);
                }
            }

            return [
                'id' => $title->id,
                'title' => $title->title,
                'leader' => $title->user?->only(['id', 'name']),
                'pendingCount' => $pendingCount,
                'totalChapters' => $title->theses->count(),
                'url' => route('thesis-titles.show', $title),
            ];
        })->values();

        $needsAttention = $needsAttention
            ->sortByDesc('sort')
            ->take(5)
            ->map(function (array $item) {
                unset($item['sort']);

                return $item;
            })
            ->values();

        return [
            'activeThesis' => $activeThesisData,
            'needsAttention' => $needsAttention,
            'memberTheses' => $memberThesesData,
            'links' => [
                'create' => Route::has('thesis-titles.create')
                    ? route('thesis-titles.create')
                    : null,
                'browse' => route('thesis-titles.index'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTeacherSummary(User $user): array
    {
        $adviseeQuery = ThesisTitle::query()
            ->where('adviser_id', $user->id);

        $totalAdvisees = (clone $adviseeQuery)->count();

        $pendingChapterCount = Thesis::query()
            ->whereHas('thesisTitle', fn ($query) => $query->where('adviser_id', $user->id))
            ->where('status', ThesisStatus::PENDING)
            ->count();

        $pendingReviews = Thesis::query()
            ->with([
                'thesisTitle' => fn ($query) => $query
                    ->select('id', 'title', 'user_id')
                    ->with('user:id,name'),
            ])
            ->whereHas('thesisTitle', fn ($query) => $query->where('adviser_id', $user->id))
            ->where('status', ThesisStatus::PENDING)
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function (Thesis $thesis) {
                $title = $thesis->thesisTitle;

                return [
                    'id' => $thesis->id,
                    'chapter' => $thesis->chapter,
                    'status' => $this->resolveThesisStatus($thesis->status),
                    'submitted_at' => optional($thesis->created_at)->toIso8601String(),
                    'updated_at' => optional($thesis->updated_at)->toIso8601String(),
                    'thesisTitle' => $title ? [
                        'id' => $title->id,
                        'title' => $title->title,
                        'leader' => $title->user?->only(['id', 'name']),
                        'url' => route('thesis-titles.show', $title),
                    ] : null,
                ];
            })
            ->values();

        $advisees = ThesisTitle::query()
            ->with([
                'user:id,name',
                'theses:id,thesis_title_id,status',
            ])
            ->where('adviser_id', $user->id)
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function (ThesisTitle $title) {
                $pendingCount = 0;

                foreach ($title->theses as $thesis) {
                    if ($this->resolveThesisStatus($thesis->status) === ThesisStatus::PENDING->value) {
                        $pendingCount++;
                    }
                }

                return [
                    'id' => $title->id,
                    'title' => $title->title,
                    'leader' => $title->user?->only(['id', 'name']),
                    'pendingCount' => $pendingCount,
                    'totalChapters' => $title->theses->count(),
                    'url' => route('thesis-titles.show', $title),
                ];
            })
            ->values();

        $upcomingEvents = ThesisTitle::query()
            ->where('adviser_id', $user->id)
            ->get(['id', 'title', 'proposal_defense_at', 'final_defense_at'])
            ->flatMap(function (ThesisTitle $title) {
                return collect([
                    $title->proposal_defense_at ? [
                        'type' => 'proposal',
                        'label' => 'Proposal Defense',
                        'date' => $title->proposal_defense_at->copy(),
                        'thesis_title_id' => $title->id,
                        'title' => $title->title,
                    ] : null,
                    $title->final_defense_at ? [
                        'type' => 'final',
                        'label' => 'Final Defense',
                        'date' => $title->final_defense_at->copy(),
                        'thesis_title_id' => $title->id,
                        'title' => $title->title,
                    ] : null,
                ])->filter();
            })
            ->filter(function (array $event) {
                /** @var Carbon|null $date */
                $date = $event['date'] ?? null;

                if (! $date instanceof Carbon) {
                    return false;
                }

                return $date->gte(Carbon::now()->startOfDay());
            })
            ->sortBy(fn (array $event) => $event['date'])
            ->take(6)
            ->map(function (array $event) {
                /** @var Carbon $date */
                $date = $event['date'];

                return [
                    'type' => $event['type'],
                    'label' => $event['label'],
                    'date' => $date->toIso8601String(),
                    'thesisTitle' => [
                        'id' => $event['thesis_title_id'],
                        'title' => $event['title'],
                        'url' => route('thesis-titles.show', $event['thesis_title_id']),
                    ],
                ];
            })
            ->values();

        return [
            'totals' => [
                'advisees' => $totalAdvisees,
                'pendingReviews' => $pendingChapterCount,
                'upcomingEvents' => $upcomingEvents->count(),
            ],
            'pendingReviews' => $pendingReviews,
            'upcomingEvents' => $upcomingEvents,
            'advisees' => $advisees,
            'links' => [
                'advisees' => route('thesis-titles.advisees'),
            ],
        ];
    }

    /**
     * @return list<string>
     */
    private function resolveRoleNames(User $user): array
    {
        if ($user->relationLoaded('roles')) {
            $rolesRelation = $user->getRelation('roles');

            if ($rolesRelation instanceof Collection) {
                return $rolesRelation->pluck('name')->all();
            }

            if (is_array($rolesRelation)) {
                return array_values($rolesRelation);
            }
        }

        $rolesAttribute = $user->getAttribute('roles');

        if ($rolesAttribute instanceof Collection) {
            return $rolesAttribute->pluck('name')->all();
        }

        if (is_array($rolesAttribute)) {
            return array_values($rolesAttribute);
        }

        return $user->roles()->pluck('name')->all();
    }

    private function resolveProgramLevelFromUser(User $user): ?string
    {
        $student = $user->getAttribute('student');

        if (! $student) {
            return null;
        }

        $postGradValue = data_get($student, 'course.post_grad');

        if (is_bool($postGradValue)) {
            return $postGradValue ? 'Postgrad' : 'Undergrad';
        }

        if (is_numeric($postGradValue)) {
            return (int) $postGradValue === 1 ? 'Postgrad' : 'Undergrad';
        }

        if (is_string($postGradValue)) {
            $numeric = filter_var($postGradValue, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE);

            if ($numeric !== null) {
                return (int) $numeric === 1 ? 'Postgrad' : 'Undergrad';
            }

            $normalized = strtolower(trim($postGradValue));

            if (in_array($normalized, ['postgrad', 'postgraduate'], true)) {
                return 'Postgrad';
            }

            if (in_array($normalized, ['undergrad', 'undergraduate'], true)) {
                return 'Undergrad';
            }
        }

        return null;
    }

    /**
     * @param  ThesisStatus|string|null  $status
     */
    private function resolveThesisStatus($status): string
    {
        if ($status instanceof ThesisStatus) {
            return $status->value;
        }

        if (is_string($status) && in_array($status, ThesisStatus::values(), true)) {
            return $status;
        }

        return ThesisStatus::PENDING->value;
    }
}
