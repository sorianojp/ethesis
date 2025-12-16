<?php

namespace App\Http\Controllers;

use App\Enums\ThesisStatus;
use App\Http\Requests\StoreThesisRequest;
use App\Http\Requests\UpdateThesisRequest;
use App\Http\Requests\UpdateThesisStatusRequest;
use App\Models\Thesis;
use App\Models\ThesisTitle;
use App\Notifications\ThesisStatusUpdated;
use App\Notifications\ThesisUploaded;
use App\Services\WinstonPlagiarismService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\Notification as BaseNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ThesisController extends Controller
{
    public function index(Request $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function create(Request $request, ThesisTitle $thesisTitle): Response
    {
        $this->ensureOwnership($request, $thesisTitle);

        return Inertia::render('theses/create', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
            ],
        ]);
    }

    public function store(StoreThesisRequest $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle);

        $data = $request->validated();

        $path = $this->uploadPdf(
            $request->file('thesis_pdf'),
            $request->user()->id,
            'theses/'.$thesisTitle->id
        );

        $thesis = $thesisTitle->theses()->create([
            'chapter' => $data['chapter'],
            'thesis_pdf' => $path,
            'post_grad' => $this->determinePostGradFlag($request),
            'status' => ThesisStatus::PENDING,
        ]);

        $this->initiatePlagiarismScan($thesis, $path);
        $thesisTitle->loadMissing(['adviser', 'technicalAdviser', 'user']);
        $this->notifyAdvisers($thesisTitle, new ThesisUploaded($thesisTitle, $thesis));

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function show(Request $request, ThesisTitle $thesisTitle, Thesis $thesis): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle, $thesis);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function edit(Request $request, ThesisTitle $thesisTitle, Thesis $thesis): Response
    {
        $this->ensureOwnership($request, $thesisTitle, $thesis);

        return Inertia::render('theses/edit', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
            ],
            'thesis' => [
                'id' => $thesis->id,
                'chapter' => $thesis->chapter,
                'thesis_pdf_url' => $this->fileUrl($thesis->thesis_pdf),
            ],
        ]);
    }

    public function update(UpdateThesisRequest $request, ThesisTitle $thesisTitle, Thesis $thesis): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle, $thesis);

        $data = $request->validated();

        $update = [
            'chapter' => $data['chapter'],
            'post_grad' => $this->determinePostGradFlag($request),
        ];

        $newDocumentPath = null;

        if ($request->hasFile('thesis_pdf')) {
            $this->deleteFromSpaces($thesis->thesis_pdf);
            $newDocumentPath = $this->uploadPdf(
                $request->file('thesis_pdf'),
                $request->user()->id,
                'theses/'.$thesisTitle->id
            );
            $update['thesis_pdf'] = $newDocumentPath;
            $update['status'] = ThesisStatus::PENDING;
        }

        $thesis->update($update);

        if ($newDocumentPath) {
            $this->initiatePlagiarismScan($thesis, $newDocumentPath);
        }

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function updateStatus(UpdateThesisStatusRequest $request, ThesisTitle $thesisTitle, Thesis $thesis): RedirectResponse
    {
        $this->ensureAdviser($request, $thesisTitle);
        $this->ensureThesisBelongsToTitle($thesisTitle, $thesis);

        $status = $request->status();

        $thesis->update([
            'status' => $status,
            'rejection_remark' => $status === ThesisStatus::REJECTED ? $request->rejectionRemark() : null,
        ]);
        $thesisTitle->loadMissing(['user', 'members']);
        $notification = new ThesisStatusUpdated($thesis, $status);

        $this->notifyParticipants($thesisTitle, $notification);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function destroy(Request $request, ThesisTitle $thesisTitle, Thesis $thesis): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle, $thesis);

        $this->deleteFromSpaces($thesis->thesis_pdf);

        $thesis->delete();

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    private function notifyAdvisers(ThesisTitle $thesisTitle, BaseNotification $notification): void
    {
        $this->collectAdviserRecipients($thesisTitle)
            ->each(fn ($user) => $user->notify($notification));
    }

    private function notifyParticipants(ThesisTitle $thesisTitle, BaseNotification $notification): void
    {
        $participants = collect([$thesisTitle->user])
            ->merge($thesisTitle->members ?? collect())
            ->filter()
            ->unique(fn ($user) => $user->getKey());

        $participants->each(fn ($user) => $user->notify($notification));
    }

    private function collectAdviserRecipients(ThesisTitle $thesisTitle): Collection
    {
        return collect([$thesisTitle->adviser, $thesisTitle->technicalAdviser])
            ->filter()
            ->unique(fn ($user) => $user->getKey());
    }

    private function ensureOwnership(Request $request, ThesisTitle $thesisTitle, ?Thesis $thesis = null): void
    {
        abort_unless($request->user() && $request->user()->id === $thesisTitle->user_id, 403);

        if ($thesis) {
            $this->ensureThesisBelongsToTitle($thesisTitle, $thesis);
        }
    }

    private function ensureAdviser(Request $request, ThesisTitle $thesisTitle): void
    {
        abort_unless(
            $request->user()
            && $thesisTitle->adviser_id
            && $request->user()->id === (int) $thesisTitle->adviser_id,
            403
        );
    }

    private function ensureThesisBelongsToTitle(ThesisTitle $thesisTitle, Thesis $thesis): void
    {
        abort_unless($thesis->thesis_title_id === $thesisTitle->id, 404);
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

    private function determinePostGradFlag(Request $request): bool
    {
        $sessionValue = data_get($request->session()->get('step_auth'), 'user.student.course.post_grad');

        if ($sessionValue !== null) {
            return (int) $sessionValue === 1;
        }

        $user = $request->user();

        if ($user) {
            $userValue = data_get($user->getAttributes(), 'student.course.post_grad');

            if ($userValue !== null) {
                return (int) $userValue === 1;
            }
        }

        return false;
    }

    private function fileUrl(?string $path): ?string
    {
        return $path ? Storage::disk('spaces')->url($path) : null;
    }

    private function initiatePlagiarismScan(Thesis $thesis, string $documentPath): void
    {
        $scan = $thesis->plagiarismScans()->create([
            'status' => 'pending',
            'document_path' => $documentPath,
            'language' => config('services.winston_ai.default_language', 'en'),
            'country' => config('services.winston_ai.default_country', 'us'),
        ]);

        $documentUrl = $this->fileUrl($documentPath);

        if (! $documentUrl) {
            $scan->update([
                'status' => 'failed',
                'error_message' => 'Unable to resolve document URL for plagiarism scan.',
            ]);

            return;
        }

        WinstonPlagiarismService::make()->scan($scan, $documentUrl);
    }
}
