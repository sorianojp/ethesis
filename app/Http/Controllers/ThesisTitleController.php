<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreThesisTitleRequest;
use App\Http\Requests\UpdateThesisTitleRequest;
use App\Models\Thesis;
use App\Models\ThesisTitle;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ThesisTitleController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        if ($this->userIsTeacher($request->user()) && ! $this->userHasRole($request->user(), 'Student')) {
            return redirect()->route('thesis-titles.advisees');
        }

        $thesisTitles = ThesisTitle::query()
            ->withCount('theses')
            ->with('adviser')
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
                'theses_count' => $title->theses_count,
                'abstract_pdf_url' => $this->fileUrl($title->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($title->endorsement_pdf),
                'created_at' => optional($title->created_at)->toIso8601String(),
            ]);

        return Inertia::render('thesis-titles/index', [
            'thesisTitles' => $thesisTitles,
            'permissions' => [
                'create' => ! $this->userIsTeacher($request->user()) || $this->userHasRole($request->user(), 'Student'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureStudent($request);

        $teachers = User::teachers()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('thesis-titles/create', [
            'teachers' => $teachers,
        ]);
    }

    public function store(StoreThesisTitleRequest $request): RedirectResponse
    {
        $this->ensureStudent($request);

        $data = $request->validated();

        $adviser = $this->resolveAdviser((int) $data['adviser_id']);

        $abstractPath = $this->uploadPdf(
            $request->file('abstract_pdf'),
            $request->user()->id,
            'abstracts'
        );

        $endorsementPath = $this->uploadPdf(
            $request->file('endorsement_pdf'),
            $request->user()->id,
            'endorsements'
        );

        $thesisTitle = ThesisTitle::create([
            'user_id' => $request->user()->id,
            'adviser_id' => $adviser->id,
            'title' => $data['title'],
            'abstract_pdf' => $abstractPath,
            'endorsement_pdf' => $endorsementPath,
        ]);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function show(Request $request, ThesisTitle $thesisTitle): Response
    {
        $this->ensureCanView($request, $thesisTitle);

        $thesisTitle->load([
            'theses' => fn ($query) => $query->latest(),
            'adviser',
        ]);

        $canManage = (int) $request->user()->id === (int) $thesisTitle->user_id;

        return Inertia::render('thesis-titles/show', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
                'adviser' => $thesisTitle->adviser ? [
                    'id' => $thesisTitle->adviser->id,
                    'name' => $thesisTitle->adviser->name,
                ] : null,
                'abstract_pdf_url' => $this->fileUrl($thesisTitle->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($thesisTitle->endorsement_pdf),
                'created_at' => optional($thesisTitle->created_at)->toIso8601String(),
                'theses' => $thesisTitle->theses->map(fn (Thesis $thesis) => [
                    'id' => $thesis->id,
                    'chapter' => $thesis->chapter,
                    'thesis_pdf_url' => $this->fileUrl($thesis->thesis_pdf),
                    'created_at' => optional($thesis->created_at)->toIso8601String(),
                ]),
            ],
            'permissions' => [
                'manage' => $canManage,
            ],
        ]);
    }

    public function edit(Request $request, ThesisTitle $thesisTitle): Response
    {
        $this->ensureOwnership($request, $thesisTitle);
        $this->ensureStudent($request);

        $teachers = User::teachers()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('thesis-titles/edit', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
                'adviser' => $thesisTitle->adviser ? [
                    'id' => $thesisTitle->adviser->id,
                    'name' => $thesisTitle->adviser->name,
                ] : null,
                'abstract_pdf_url' => $this->fileUrl($thesisTitle->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($thesisTitle->endorsement_pdf),
            ],
            'teachers' => $teachers,
        ]);
    }

    public function update(UpdateThesisTitleRequest $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle);
        $this->ensureStudent($request);

        $data = $request->validated();

        $adviser = $this->resolveAdviser((int) $data['adviser_id']);

        $update = [
            'title' => $data['title'],
            'adviser_id' => $adviser->id,
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

        abort(403);
    }

    private function ensureTeacher(Request $request): void
    {
        $user = $request->user();

        abort_unless($this->userIsTeacher($user), 403);
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

}
