<?php

namespace App\Http\Controllers;

use App\Enums\ThesisStatus;
use App\Http\Requests\StoreThesisTitleRequest;
use App\Http\Requests\UpdateThesisTitlePanelRequest;
use App\Http\Requests\UpdateThesisTitleScheduleRequest;
use App\Http\Requests\UpdateThesisTitleRequest;
use App\Models\Thesis;
use App\Models\ThesisTitle;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ThesisTitleController extends Controller
{
    private const OPTION_LIMIT_DEFAULT = 50;
    private const OPTION_LIMIT_MAX = 100;

    public function index(Request $request): Response|RedirectResponse
    {
        if ($this->userIsTeacher($request->user()) && ! $this->userHasRole($request->user(), 'Student')) {
            return redirect()->route('thesis-titles.advisees');
        }

        $thesisTitles = ThesisTitle::query()
            ->withCount('theses')
            ->with(['adviser', 'technicalAdviser'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ThesisTitle $title) => [
                'id' => $title->id,
                'title' => $title->title,
                'adviser' => $title->adviser ? [
                    'id' => $title->adviser->id,
                    'name' => $title->adviser->name,
                ] : null,
                'technical_adviser' => $title->technicalAdviser ? [
                    'id' => $title->technicalAdviser->id,
                    'name' => $title->technicalAdviser->name,
                ] : null,
                'theses_count' => $title->theses_count,
                'abstract_pdf_url' => $this->fileUrl($title->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($title->endorsement_pdf),
                'created_at' => optional($title->created_at)->toIso8601String(),
            ]);

        $memberThesisTitles = ThesisTitle::query()
            ->with(['adviser', 'technicalAdviser', 'user'])
            ->withCount('theses')
            ->whereHas('members', fn ($query) => $query->where('users.id', $request->user()->id))
            ->where('user_id', '!=', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (ThesisTitle $title) => [
                'id' => $title->id,
                'title' => $title->title,
                'leader' => $title->user ? [
                    'id' => $title->user->id,
                    'name' => $title->user->name,
                ] : null,
                'adviser' => $title->adviser ? [
                    'id' => $title->adviser->id,
                    'name' => $title->adviser->name,
                ] : null,
                'technical_adviser' => $title->technicalAdviser ? [
                    'id' => $title->technicalAdviser->id,
                    'name' => $title->technicalAdviser->name,
                ] : null,
                'theses_count' => $title->theses_count,
                'created_at' => optional($title->created_at)->toIso8601String(),
            ])
            ->values();

        return Inertia::render('thesis-titles/index', [
            'thesisTitles' => $thesisTitles,
            'permissions' => [
                'create' => ! $this->userIsTeacher($request->user()) || $this->userHasRole($request->user(), 'Student'),
            ],
            'memberThesisTitles' => $memberThesisTitles,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureStudent($request);

        return Inertia::render('thesis-titles/create', [
            'teachers' => $this->teacherOptions($request),
            'students' => $this->studentOptions($request, $request->user()->id),
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $this->ensureStudent($request);

        $type = (string) $request->string('type')->trim();

        if (! in_array($type, ['teachers', 'students'], true)) {
            throw ValidationException::withMessages([
                'type' => __('The provided type is invalid.'),
            ]);
        }

        $limit = (int) $request->input('limit', self::OPTION_LIMIT_DEFAULT);
        $limit = max(1, min($limit, self::OPTION_LIMIT_MAX));

        $search = (string) $request->string('search')->trim();

        $query = $type === 'teachers'
            ? User::teachers()
            : User::students()->whereKeyNot($request->user()->id);

        if ($search !== '') {
            $query->where('name', 'like', '%' . addcslashes($search, '%_') . '%');
        }

        $results = $query
            ->orderBy('name')
            ->limit($limit + 1)
            ->get(['id', 'name']);

        $hasMore = $results->count() > $limit;

        if ($hasMore) {
            $results = $results->slice(0, $limit);
        }

        return response()->json([
            'data' => $results->values()->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ])->all(),
            'meta' => [
                'has_more' => $hasMore,
            ],
        ]);
    }

    private function teacherOptions(Request $request, array $includeIds = []): array
    {
        return $this->buildOptions(
            User::teachers(),
            (string) $request->string('teacher_search')->trim(),
            null,
            $includeIds
        );
    }

    private function studentOptions(Request $request, int $excludeId, array $includeIds = []): array
    {
        return $this->buildOptions(
            User::students()->whereKeyNot($excludeId),
            (string) $request->string('student_search')->trim(),
            self::OPTION_LIMIT_DEFAULT,
            $includeIds
        );
    }

    private function buildOptions(Builder $baseQuery, string $search, ?int $limit = self::OPTION_LIMIT_DEFAULT, array $includeIds = []): array
    {
        $query = clone $baseQuery;

        if ($search !== '') {
            $query->where('name', 'like', '%' . addcslashes($search, '%_') . '%');
        }

        $query->orderBy('name');

        if ($limit !== null) {
            $query->limit($limit);
        }

        $results = $query->get(['id', 'name'])->values();

        if ($includeIds !== []) {
            $missingIds = collect($includeIds)
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->diff($results->pluck('id'));

            if ($missingIds->isNotEmpty()) {
                $additional = (clone $baseQuery)
                    ->whereKey($missingIds->all())
                    ->orderBy('name')
                    ->get(['id', 'name']);

                $results = $results->concat($additional);
            }
        }

        return $results
            ->unique('id')
            ->sortBy('name')
            ->values()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ])
            ->all();
    }

    public function store(StoreThesisTitleRequest $request): RedirectResponse
    {
        $this->ensureStudent($request);

        $data = $request->validated();

        $adviser = $this->resolveAdviser((int) $data['adviser_id']);
        $technicalAdviser = $this->resolveTechnicalAdviser(
            isset($data['technical_adviser_id']) ? (int) $data['technical_adviser_id'] : null
        );
        $memberIds = $this->sanitizeMemberIds($data['member_ids'] ?? [], $request->user()->id)->all();
        $collegeName = $this->resolveStudentCollegeName($request);

        $abstractPath = $request->hasFile('abstract_pdf')
            ? $this->uploadPdf(
                $request->file('abstract_pdf'),
                $request->user()->id,
                'abstracts'
            )
            : null;

        $endorsementPath = $request->hasFile('endorsement_pdf')
            ? $this->uploadPdf(
                $request->file('endorsement_pdf'),
                $request->user()->id,
                'endorsements'
            )
            : null;

        $thesisTitle = ThesisTitle::create([
            'user_id' => $request->user()->id,
            'adviser_id' => $adviser->id,
            'technical_adviser_id' => $technicalAdviser?->id,
            'college_name' => $collegeName,
            'title' => $data['title'],
            'abstract_pdf' => $abstractPath,
            'endorsement_pdf' => $endorsementPath,
        ]);

        $thesisTitle->members()->sync($memberIds);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function show(Request $request, ThesisTitle $thesisTitle): Response
    {
        $this->ensureCanView($request, $thesisTitle);

        $thesisTitle->load([
            'theses' => fn ($query) => $query->latest()->with('latestPlagiarismScan'),
            'adviser',
            'technicalAdviser',
            'members',
            'panel.chairman',
            'panel.memberOne',
            'panel.memberTwo',
            'user',
        ]);

        $canManage = (int) $request->user()->id === (int) $thesisTitle->user_id;
        $canReview = $thesisTitle->adviser_id && (int) $request->user()->id === (int) $thesisTitle->adviser_id;
        $isTechnicalAdviser = $thesisTitle->technical_adviser_id
            && (int) $request->user()->id === (int) $thesisTitle->technical_adviser_id;
        $panel = $thesisTitle->panel;
        $isMember = $thesisTitle->members->contains(
            fn (User $member) => (int) $member->id === (int) $request->user()->id
        );
        $teachers = collect();

        if ($canReview) {
            $teachersQuery = User::teachers()->orderBy('name');

            if ($thesisTitle->adviser_id) {
                $teachersQuery->whereKeyNot($thesisTitle->adviser_id);
            }

            $teachers = $teachersQuery->get(['id', 'name']);
        }

        return Inertia::render('thesis-titles/show', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
                'adviser' => $thesisTitle->adviser ? [
                    'id' => $thesisTitle->adviser->id,
                    'name' => $thesisTitle->adviser->name,
                ] : null,
                'technical_adviser' => $thesisTitle->technicalAdviser ? [
                    'id' => $thesisTitle->technicalAdviser->id,
                    'name' => $thesisTitle->technicalAdviser->name,
                ] : null,
                'leader' => $thesisTitle->user ? [
                    'id' => $thesisTitle->user->id,
                    'name' => $thesisTitle->user->name,
                ] : null,
                'abstract_pdf_url' => $this->fileUrl($thesisTitle->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($thesisTitle->endorsement_pdf),
                'members' => $thesisTitle->members->map(fn (User $member) => [
                    'id' => $member->id,
                    'name' => $member->name,
                ]),
                'proposal_defense_at' => optional($thesisTitle->proposal_defense_at)->toIso8601String(),
                'final_defense_at' => optional($thesisTitle->final_defense_at)->toIso8601String(),
                'created_at' => optional($thesisTitle->created_at)->toIso8601String(),
                'certificates' => [
                    'proposal' => route('thesis-titles.certificates.proposal', $thesisTitle),
                    'final' => route('thesis-titles.certificates.final', $thesisTitle),
                ],
                'approval_forms' => [
                    'undergrad' => route('thesis-titles.approval-forms.undergrad', $thesisTitle),
                    'postgrad' => route('thesis-titles.approval-forms.postgrad', $thesisTitle),
                ],
                'theses' => $thesisTitle->theses->map(function (Thesis $thesis) {
                    $scan = $thesis->latestPlagiarismScan;

                    return [
                        'id' => $thesis->id,
                        'chapter' => $thesis->chapter,
                        'thesis_pdf_url' => $this->fileUrl($thesis->thesis_pdf),
                        'post_grad' => (bool) $thesis->post_grad,
                        'created_at' => optional($thesis->created_at)->toIso8601String(),
                        'status' => $thesis->status instanceof ThesisStatus
                            ? $thesis->status->value
                            : ($thesis->status ?? ThesisStatus::PENDING->value),
                        'rejection_remark' => $thesis->rejection_remark,
                        'plagiarism_scan' => $scan ? [
                            'id' => $scan->id,
                            'status' => $scan->status,
                            'document_path' => $scan->document_path,
                            'document_url' => $this->fileUrl($scan->document_path),
                            'language' => $scan->language,
                            'country' => $scan->country,
                            'score' => $scan->score,
                            'source_count' => $scan->source_count,
                            'text_word_count' => $scan->text_word_count,
                            'total_plagiarism_words' => $scan->total_plagiarism_words,
                            'identical_word_count' => $scan->identical_word_count,
                            'similar_word_count' => $scan->similar_word_count,
                            'sources' => $scan->sources,
                            'raw_response' => $scan->raw_response,
                            'error_message' => $scan->error_message,
                            'scanned_at' => optional($scan->scanned_at)->toIso8601String(),
                            'created_at' => optional($scan->created_at)->toIso8601String(),
                            'updated_at' => optional($scan->updated_at)->toIso8601String(),
                        ] : null,
                    ];
                }),
                'panel' => [
                    'chairman' => $panel && $panel->chairman ? [
                        'id' => $panel->chairman->id,
                        'name' => $panel->chairman->name,
                    ] : null,
                    'member_one' => $panel && $panel->memberOne ? [
                        'id' => $panel->memberOne->id,
                        'name' => $panel->memberOne->name,
                    ] : null,
                    'member_two' => $panel && $panel->memberTwo ? [
                        'id' => $panel->memberTwo->id,
                        'name' => $panel->memberTwo->name,
                    ] : null,
                ],
            ],
            'permissions' => [
                'manage' => $canManage,
                'review' => (bool) $canReview,
                'view_documents' => (bool) ($canManage || $canReview || $isMember || $isTechnicalAdviser),
            ],
            'panelOptions' => $teachers,
        ]);
    }

    public function updatePanel(UpdateThesisTitlePanelRequest $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureAdviser($request, $thesisTitle);

        $panelMembers = $request->panelMembers();

        $panel = [
            'chairman_id' => $this->resolvePanelMemberId($panelMembers['chairman_id'], 'chairman_id'),
            'member_one_id' => $this->resolvePanelMemberId($panelMembers['member_one_id'], 'member_one_id'),
            'member_two_id' => $this->resolvePanelMemberId($panelMembers['member_two_id'], 'member_two_id'),
        ];

        // Remove adviser if they were assigned and avoid duplicates.
        $panel = collect($panel)->map(function ($value) use ($thesisTitle) {
            if ($value && $value === (int) $thesisTitle->adviser_id) {
                return null;
            }

            return $value;
        })->all();

        $thesisTitle->panel()->updateOrCreate([], $panel);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function updateSchedule(UpdateThesisTitleScheduleRequest $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureAdviser($request, $thesisTitle);

        $thesisTitle->update($request->schedulePayload());

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function downloadProposalCertificate(Request $request, ThesisTitle $thesisTitle)
    {
        return $this->downloadCertificate($request, $thesisTitle, 'proposal');
    }

    public function downloadFinalCertificate(Request $request, ThesisTitle $thesisTitle)
    {
        return $this->downloadCertificate($request, $thesisTitle, 'final');
    }

    public function downloadUndergradApprovalForm(Request $request, ThesisTitle $thesisTitle)
    {
        return $this->downloadApprovalForm($request, $thesisTitle, 'undergrad');
    }

    public function downloadPostgradApprovalForm(Request $request, ThesisTitle $thesisTitle)
    {
        return $this->downloadApprovalForm($request, $thesisTitle, 'postgrad');
    }

    public function edit(Request $request, ThesisTitle $thesisTitle): Response
    {
        $this->ensureOwnership($request, $thesisTitle);
        $this->ensureStudent($request);

        $thesisTitle->load([
            'members' => fn ($query) => $query->select('users.id', 'users.name'),
            'technicalAdviser:id,name',
        ]);

        $members = $thesisTitle->members
            ->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
            ])
            ->values();

        $teacherIncludeIds = array_values(array_filter([
            $thesisTitle->adviser_id,
            $thesisTitle->technical_adviser_id,
        ]));

        $teachers = $this->teacherOptions($request, $teacherIncludeIds);

        $students = $this->studentOptions(
            $request,
            $thesisTitle->user_id,
            $members->pluck('id')->all()
        );

        return Inertia::render('thesis-titles/edit', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
                'adviser' => $thesisTitle->adviser ? [
                    'id' => $thesisTitle->adviser->id,
                    'name' => $thesisTitle->adviser->name,
                ] : null,
                'technical_adviser' => $thesisTitle->technicalAdviser ? [
                    'id' => $thesisTitle->technicalAdviser->id,
                    'name' => $thesisTitle->technicalAdviser->name,
                ] : null,
                'abstract_pdf_url' => $this->fileUrl($thesisTitle->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($thesisTitle->endorsement_pdf),
                'member_ids' => $members->pluck('id')->all(),
                'members' => $members->all(),
            ],
            'teachers' => $teachers,
            'students' => $students,
        ]);
    }

    public function update(UpdateThesisTitleRequest $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle);
        $this->ensureStudent($request);

        $data = $request->validated();

        $adviser = $this->resolveAdviser((int) $data['adviser_id']);
        $technicalAdviser = $this->resolveTechnicalAdviser(
            isset($data['technical_adviser_id']) ? (int) $data['technical_adviser_id'] : null
        );
        $memberIds = $this->sanitizeMemberIds($data['member_ids'] ?? [], $request->user()->id)->all();

        $update = [
            'title' => $data['title'],
            'adviser_id' => $adviser->id,
            'technical_adviser_id' => $technicalAdviser?->id,
        ];

        if ($request->hasFile('abstract_pdf')) {
            $this->deleteFromSpaces($thesisTitle->abstract_pdf);
            $update['abstract_pdf'] = $this->uploadPdf(
                $request->file('abstract_pdf'),
                $request->user()->id,
                'abstracts'
            );
        }

        if ($request->hasFile('endorsement_pdf')) {
            $this->deleteFromSpaces($thesisTitle->endorsement_pdf);
            $update['endorsement_pdf'] = $this->uploadPdf(
                $request->file('endorsement_pdf'),
                $request->user()->id,
                'endorsements'
            );
        }

        $thesisTitle->update($update);
        $thesisTitle->members()->sync($memberIds);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function destroy(Request $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle);
        $this->ensureStudent($request);

        $thesisTitle->load('theses');

        foreach ($thesisTitle->theses as $thesis) {
            $this->deleteFromSpaces($thesis->thesis_pdf);
        }

        $this->deleteFromSpaces($thesisTitle->abstract_pdf);
        $this->deleteFromSpaces($thesisTitle->endorsement_pdf);

        $thesisTitle->delete();

        return redirect()->route('thesis-titles.index');
    }

    public function advisees(Request $request): Response
    {
        $this->ensureTeacher($request);

        $thesisTitles = ThesisTitle::query()
            ->with(['user'])
            ->withCount('theses')
            ->where('adviser_id', $request->user()->id)
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ThesisTitle $title) => [
                'id' => $title->id,
                'title' => $title->title,
                'student' => $title->user ? [
                    'id' => $title->user->id,
                    'name' => $title->user->name,
                ] : null,
                'theses_count' => $title->theses_count,
                'created_at' => optional($title->created_at)->toIso8601String(),
            ]);

        return Inertia::render('thesis-titles/advisees', [
            'thesisTitles' => $thesisTitles,
        ]);
    }

    public function dean(Request $request): Response
    {
        $this->ensureDean($request);

        $collegeName = $this->resolveStaffCollegeName($request);

        $thesisTitles = ThesisTitle::query()
            ->with(['user', 'adviser', 'technicalAdviser'])
            ->withCount('theses')
            ->when($collegeName !== null, fn ($query) => $query->where('college_name', $collegeName))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ThesisTitle $title) => [
                'id' => $title->id,
                'title' => $title->title,
                'college_name' => $title->college_name,
                'leader' => $title->user ? [
                    'id' => $title->user->id,
                    'name' => $title->user->name,
                ] : null,
                'adviser' => $title->adviser ? [
                    'id' => $title->adviser->id,
                    'name' => $title->adviser->name,
                ] : null,
                'technical_adviser' => $title->technicalAdviser ? [
                    'id' => $title->technicalAdviser->id,
                    'name' => $title->technicalAdviser->name,
                ] : null,
                'theses_count' => $title->theses_count,
                'created_at' => optional($title->created_at)->toIso8601String(),
                'view_url' => route('thesis-titles.show', $title),
            ]);

        return Inertia::render('thesis-titles/dean', [
            'collegeName' => $collegeName,
            'thesisTitles' => $thesisTitles,
        ]);
    }

    private function uploadPdf(UploadedFile $file, int $userId, string $folder): string
    {
        $disk = Storage::disk('spaces');

        $directory = trim("users/{$userId}/{$folder}", '/');

        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();

        $path = $disk->putFileAs($directory, $file, $filename, ['visibility' => 'public']);

        if (! $path) {
            throw new RuntimeException('Failed to upload file to Spaces.');
        }

        return $path;
    }

    private function deleteFromSpaces(?string $path): void
    {
        if (! $path) {
            return;
        }

        $disk = Storage::disk('spaces');

        if ($disk->fileExists($path)) {
            $disk->delete($path);
        }
    }

    private function fileUrl(?string $path): ?string
    {
        return $path ? Storage::disk('spaces')->url($path) : null;
    }

    private function ensureOwnership(Request $request, ThesisTitle $thesisTitle): void
    {
        abort_unless($request->user() && $request->user()->id === $thesisTitle->user_id, 403);
    }

    private function ensureStudent(Request $request): void
    {
        $user = $request->user();

        abort_unless($user, 403);

        if ($this->userIsTeacher($user) && ! $this->userHasRole($user, 'Student')) {
            abort(403);
        }
    }

    private function ensureCanView(Request $request, ThesisTitle $thesisTitle): void
    {
        $user = $request->user();

        abort_unless($user, 403);

        if ($user->id === $thesisTitle->user_id) {
            return;
        }

        if ($thesisTitle->adviser_id && $user->id === $thesisTitle->adviser_id) {
            return;
        }

        if ($thesisTitle->technical_adviser_id && $user->id === $thesisTitle->technical_adviser_id) {
            return;
        }

        if ($thesisTitle->members()->whereKey($user->id)->exists()) {
            return;
        }

        if (
            $this->userHasRole($user, 'Dean')
            && $this->deanCanViewCollege($request, $thesisTitle)
        ) {
            return;
        }

        abort(403);
    }

    private function ensureTeacher(Request $request): void
    {
        $user = $request->user();

        abort_unless($this->userIsTeacher($user), 403);
    }

    private function ensureDean(Request $request): void
    {
        abort_unless($this->userHasRole($request->user(), 'Dean'), 403);
    }

    private function ensureAdviser(Request $request, ThesisTitle $thesisTitle): void
    {
        $user = $request->user();
        abort_unless(
            $user
            && $thesisTitle->adviser_id
            && (int) $user->id === (int) $thesisTitle->adviser_id,
            403
        );
    }

    private function resolvePanelMemberId(?int $userId, string $field): ?int
    {
        if (! $userId) {
            return null;
        }

        $teacher = User::teachers()->find($userId);

        if (! $teacher) {
            throw ValidationException::withMessages([
                $field => __('Selected panel member must be a teacher.'),
            ]);
        }

        return $teacher->id;
    }

    private function userIsTeacher(?User $user): bool
    {
        return $this->userHasRole($user, 'Teacher');
    }

    private function userHasRole(?User $user, string $role): bool
    {
        if (! $user) {
            return false;
        }

        $rolesRelation = $user->getRelationValue('roles');

        if ($rolesRelation instanceof Collection) {
            return $rolesRelation->contains(fn ($assigned) => $this->roleMatches($assigned, $role));
        }

        $rolesAttribute = $user->getAttribute('roles');

        if (is_array($rolesAttribute)) {
            foreach ($rolesAttribute as $assigned) {
                if ($this->roleMatches($assigned, $role)) {
                    return true;
                }
            }
        } elseif (is_string($rolesAttribute) && $this->roleMatches($rolesAttribute, $role)) {
            return true;
        }

        return $user->roles()->where('name', $role)->exists();
    }

    /**
     * @param  iterable<int|string>  $memberIds
     */
    private function sanitizeMemberIds(iterable $memberIds, int $leaderId): Collection
    {
        return collect($memberIds)
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0 && $id !== $leaderId)
            ->unique()
            ->values();
    }

    private function roleMatches(mixed $assigned, string $role): bool
    {
        if ($assigned instanceof \App\Models\Role) {
            return $assigned->name === $role;
        }

        if (is_string($assigned)) {
            return $assigned === $role;
        }

        if (is_array($assigned)) {
            if (isset($assigned['name']) && is_string($assigned['name'])) {
                return $assigned['name'] === $role;
            }

            if (isset($assigned['title']) && is_string($assigned['title'])) {
                return $assigned['title'] === $role;
            }
        }

        if (is_object($assigned)) {
            if (isset($assigned->name) && is_string($assigned->name)) {
                return $assigned->name === $role;
            }

            if (isset($assigned->title) && is_string($assigned->title)) {
                return $assigned->title === $role;
            }
        }

        return false;
    }

    private function resolveAdviser(int $adviserId): User
    {
        $adviser = User::teachers()->find($adviserId);

        if (! $adviser) {
            throw ValidationException::withMessages([
                'adviser_id' => __('Selected adviser must be a teacher.'),
            ]);
        }

        return $adviser;
    }

    private function resolveTechnicalAdviser(?int $technicalAdviserId): ?User
    {
        if (! $technicalAdviserId) {
            return null;
        }

        $technicalAdviser = User::teachers()->find($technicalAdviserId);

        if (! $technicalAdviser) {
            throw ValidationException::withMessages([
                'technical_adviser_id' => __('Selected technical adviser must be a teacher.'),
            ]);
        }

        return $technicalAdviser;
    }

    private function downloadApprovalForm(Request $request, ThesisTitle $thesisTitle, string $level)
    {
        $this->ensureCanView($request, $thesisTitle);

        abort_unless(in_array($level, ['undergrad', 'postgrad'], true), 404);

        $thesisTitle->load([
            'adviser',
            'technicalAdviser',
            'members',
            'panel.chairman',
            'panel.memberOne',
            'panel.memberTwo',
            'user',
            'theses' => fn ($query) => $query->latest('created_at'),
        ]);

        $courseName = $this->resolveCourseName($request, $thesisTitle) ?? '_________________________';
        $studentName = optional($thesisTitle->user)->name ?? '_________________________';
        $participantNames = $this->buildParticipantNames($thesisTitle);
        $participantsLine = $this->formatParticipantsLine($participantNames);
        $adviserName = optional($thesisTitle->adviser)->name ?? '_________________________';
        $technicalAdviserName = optional($thesisTitle->technicalAdviser)->name ?? '_________________________';
        if ($studentName === '_________________________' && ! empty($participantNames)) {
            $studentName = $participantNames[0];
        }
        $finalDefenseDate = $this->formatDefenseDate($thesisTitle->final_defense_at);
        $panel = optional($thesisTitle->panel);
        $chairmanName = optional($panel?->chairman)->name ?? '_________________________';
        $memberOneName = optional($panel?->memberOne)->name ?? '_________________________';
        $memberTwoName = optional($panel?->memberTwo)->name ?? '_________________________';

        $view = $level === 'postgrad'
            ? 'approvals.postgrad'
            : 'approvals.undergrad';

        $viewData = [
            'courseName' => $courseName,
            'thesisTitle' => $thesisTitle->title ?? '_________________________',
            'adviserName' => $adviserName,
            'technicalAdviserName' => $technicalAdviserName,
            'finalDefenseDate' => $finalDefenseDate,
            'chairmanName' => $chairmanName,
            'memberOneName' => $memberOneName,
            'memberTwoName' => $memberTwoName,
        ];

        if ($level === 'postgrad') {
            $viewData = array_merge($viewData, [
                'studentName' => $studentName,
            ]);
        } else {
            $collegeName = $this->resolveCollegeName($request, $thesisTitle) ?? '________________';
            $viewData = array_merge($viewData, [
                'participantsLine' => $participantsLine,
                'deanName' => '________________',
                'deanTitle' => sprintf('Dean, %s', $collegeName),
            ]);
        }

        $pdf = Pdf::loadView($view, $viewData)->setPaper('A4', 'portrait');

        $filename = Str::slug($thesisTitle->title ?: 'thesis-title')."-{$level}-approval-form.pdf";

        return $pdf->download($filename);
    }

    /**
     * @return list<string>
     */
    private function buildParticipantNames(ThesisTitle $thesisTitle): array
    {
        $names = collect();

        $leaderName = optional($thesisTitle->user)->name;

        if ($leaderName) {
            $names->push($leaderName);
        }

        $memberNames = $thesisTitle->members
            ->pluck('name')
            ->filter()
            ->values();

        if ($memberNames->isNotEmpty()) {
            $names = $names->merge($memberNames);
        }

        return $names
            ->map(fn ($name) => is_string($name) ? trim($name) : null)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<string>  $names
     */
    private function formatParticipantsLine(array $names): string
    {
        $names = array_values(array_filter($names, fn ($name) => is_string($name) && trim($name) !== ''));

        $count = count($names);

        if ($count === 0) {
            return '_________________________';
        }

        if ($count === 1) {
            return $names[0];
        }

        if ($count === 2) {
            return $names[0].' and '.$names[1];
        }

        $last = array_pop($names);

        return implode(', ', $names).' and '.$last;
    }

    private function resolveCourseName(Request $request, ThesisTitle $thesisTitle): ?string
    {
        return $this->normalizeString(
            data_get($request->session()->get('step_auth'), 'user.student.course.name')
        );
    }

    private function resolveCollegeName(Request $request, ThesisTitle $thesisTitle): ?string
    {
        return $this->resolveStudentCollegeName($request);
    }

    private function formatDefenseDate(?CarbonInterface $date): string
    {
        if (! $date) {
            return '_________________________';
        }

        $date = $date->timezone(config('app.timezone'));

        $formatted = $date->format('F j, Y');

        if ($date->format('Hi') !== '0000') {
            $formatted .= ' '.$date->format('g:i A');
        }

        return $formatted;
    }

    private function normalizeString(mixed $value): ?string
    {
        if (is_string($value)) {
            $trimmed = trim($value);

            return $trimmed !== '' ? $trimmed : null;
        }

        return null;
    }

    private function resolveStudentCollegeName(Request $request): ?string
    {
        return $this->normalizeString(
            data_get($request->session()->get('step_auth'), 'user.student.college.name')
                ?? data_get($request->user()?->getAttributes(), 'student.college.name')
        );
    }

    private function resolveStaffCollegeName(Request $request): ?string
    {
        return $this->normalizeString(
            data_get($request->session()->get('step_auth'), 'user.staff.college.name')
                ?? data_get($request->user()?->getAttributes(), 'staff.college.name')
        );
    }

    private function deanCanViewCollege(Request $request, ThesisTitle $thesisTitle): bool
    {
        $collegeName = $this->resolveStaffCollegeName($request);

        if (! $collegeName) {
            return false;
        }

        return $this->collegeMatches($thesisTitle->college_name, $collegeName);
    }

    private function collegeMatches(?string $lhs, ?string $rhs): bool
    {
        if (! $lhs || ! $rhs) {
            return false;
        }

        return strcasecmp(trim($lhs), trim($rhs)) === 0;
    }

    private function downloadCertificate(Request $request, ThesisTitle $thesisTitle, string $type)
    {
        $this->ensureCanView($request, $thesisTitle);

        abort_unless(in_array($type, ['proposal', 'final'], true), 404);

        $thesisTitle->load([
            'adviser',
            'technicalAdviser',
            'members',
            'panel.chairman',
            'panel.memberOne',
            'panel.memberTwo',
            'user',
        ]);

        $certificateTitle = $type === 'proposal'
            ? 'Proposal Defense Eligibility Certificate'
            : 'Final Defense Eligibility Certificate';

        $defenseSchedule = $type === 'proposal'
            ? $thesisTitle->proposal_defense_at
            : $thesisTitle->final_defense_at;

        $pdf = Pdf::loadView('certificates.eligibility', [
            'certificateTitle' => $certificateTitle,
            'thesisTitle' => $thesisTitle,
            'defenseSchedule' => $defenseSchedule,
        ])->setPaper('A4', 'portrait');

        $fileSuffix = $type === 'proposal'
            ? 'proposal-defense-eligibility'
            : 'final-defense-eligibility';

        $filename = Str::slug($thesisTitle->title ?: 'thesis-title')."-{$fileSuffix}.pdf";

        return $pdf->download($filename);
    }
}
