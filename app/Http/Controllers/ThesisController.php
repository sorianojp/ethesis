<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreThesisRequest;
use App\Http\Requests\UpdateThesisRequest;
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

        $thesisTitle->theses()->create([
            'chapter' => $data['chapter'],
            'thesis_pdf' => $path,
        ]);

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
        ];

        if ($request->hasFile('thesis_pdf')) {
            $this->deleteFromSpaces($thesis->thesis_pdf);
            $update['thesis_pdf'] = $this->uploadPdf(
                $request->file('thesis_pdf'),
                $request->user()->id,
                'theses/'.$thesisTitle->id
            );
        }

        $thesis->update($update);

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    public function destroy(Request $request, ThesisTitle $thesisTitle, Thesis $thesis): RedirectResponse
    {
        $this->ensureOwnership($request, $thesisTitle, $thesis);

        $this->deleteFromSpaces($thesis->thesis_pdf);

        $thesis->delete();

        return redirect()->route('thesis-titles.show', $thesisTitle);
    }

    private function ensureOwnership(Request $request, ThesisTitle $thesisTitle, ?Thesis $thesis = null): void
    {
        abort_unless($request->user() && $request->user()->id === $thesisTitle->user_id, 403);

        if ($thesis && $thesis->thesis_title_id !== $thesisTitle->id) {
            abort(404);
        }
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
}
