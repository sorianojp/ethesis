<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreThesisTitleRequest;
use App\Http\Requests\UpdateThesisTitleRequest;
use App\Models\Thesis;
use App\Models\ThesisTitle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ThesisTitleController extends Controller
{
    public function index(Request $request): Response
    {
        $thesisTitles = ThesisTitle::query()
            ->withCount('theses')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ThesisTitle $title) => [
                'id' => $title->id,
                'title' => $title->title,
                'theses_count' => $title->theses_count,
                'abstract_pdf_url' => $this->fileUrl($title->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($title->endorsement_pdf),
                'created_at' => optional($title->created_at)->toIso8601String(),
            ]);

        return Inertia::render('thesis-titles/index', [
            'thesisTitles' => $thesisTitles,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('thesis-titles/create');
    }

    public function store(StoreThesisTitleRequest $request): RedirectResponse
    {
        $data = $request->validated();

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
            'title' => $data['title'],
            'abstract_pdf' => $abstractPath,
            'endorsement_pdf' => $endorsementPath,
        ]);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function show(Request $request, ThesisTitle $thesisTitle): Response
    {
        $this->ensureOwnership($request, $thesisTitle);

        $thesisTitle->load(['theses' => fn ($query) => $query->latest()]);

        return Inertia::render('thesis-titles/show', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
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
        ]);
    }

    public function edit(Request $request, ThesisTitle $thesisTitle): Response
    {
        $this->ensureOwnership($request, $thesisTitle);

        return Inertia::render('thesis-titles/edit', [
            'thesisTitle' => [
                'id' => $thesisTitle->id,
                'title' => $thesisTitle->title,
                'abstract_pdf_url' => $this->fileUrl($thesisTitle->abstract_pdf),
                'endorsement_pdf_url' => $this->fileUrl($thesisTitle->endorsement_pdf),
            ],
        ]);
    }

    public function update(UpdateThesisTitleRequest $request, ThesisTitle $thesisTitle): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle);

        $data = $request->validated();

        $update = [
            'title' => $data['title'],
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

        $thesisTitle->load('theses');

        foreach ($thesisTitle->theses as $thesis) {
            $this->deleteFromSpaces($thesis->thesis_pdf);
        }

        $this->deleteFromSpaces($thesisTitle->abstract_pdf);
        $this->deleteFromSpaces($thesisTitle->endorsement_pdf);

        $thesisTitle->delete();

        return redirect()->route('thesis-titles.index');
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
}
