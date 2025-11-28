<?php

namespace App\Jobs;

use App\Enums\ThesisStatus;
use App\Models\PlagiarismScan;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessPlagiarismScan implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    private const REJECTION_THRESHOLD_PERCENT = 10;

    public function __construct(
        private readonly PlagiarismScan $scan
    ) {}

    public function handle(): void
    {
        $token = config('services.winston.token');

        if (! $token) {
            $this->scan->update([
                'status' => 'failed',
                'error_message' => 'Missing Winston API token configuration.',
            ]);

            return;
        }

        $filePath = $this->scan->document_path;

        if (! $filePath) {
            $this->scan->update([
                'status' => 'failed',
                'error_message' => 'No document path provided for plagiarism scan.',
            ]);

            return;
        }

        $fileUrl = $this->resolveFileUrl($filePath);

        if (! $fileUrl) {
            $this->scan->update([
                'status' => 'failed',
                'error_message' => 'Unable to resolve document URL for plagiarism scan.',
            ]);

            return;
        }

        $payload = [
            'file' => $fileUrl,
            'language' => $this->scan->language,
            'country' => $this->scan->country,
        ];

        try {
            $response = Http::withToken($token)
                ->timeout(config('services.winston.timeout', 60))
                ->acceptJson()
                ->asJson()
                ->post(config('services.winston.plagiarism_endpoint'), $payload);
        } catch (Throwable $exception) {
            $this->scan->update([
                'status' => 'failed',
                'error_message' => 'Failed to call Winston API: '.$exception->getMessage(),
            ]);

            return;
        }

        if (! $response->successful()) {
            $this->scan->update([
                'status' => 'failed',
                'error_message' => sprintf(
                    'Winston API responded with HTTP %s: %s',
                    $response->status(),
                    $response->body()
                ),
            ]);

            return;
        }

        $data = $response->json();

        $score = Arr::get($data, 'result.score');

        $this->scan->update([
            'status' => 'completed',
            'score' => $score,
            'source_count' => Arr::get($data, 'result.sourceCounts'),
            'text_word_count' => Arr::get($data, 'result.textWordCounts'),
            'total_plagiarism_words' => Arr::get($data, 'result.totalPlagiarismWords'),
            'identical_word_count' => Arr::get($data, 'result.identicalWordCounts'),
            'similar_word_count' => Arr::get($data, 'result.similarWordCounts'),
            'sources' => Arr::get($data, 'sources'),
            'raw_response' => $data,
            'error_message' => null,
            'scanned_at' => now(),
        ]);

        $this->rejectThesisWhenScoreExceedsThreshold($score);
    }

    private function resolveFileUrl(string $path): ?string
    {
        try {
            return Storage::disk('spaces')->url($path);
        } catch (Throwable) {
            return null;
        }
    }

    private function rejectThesisWhenScoreExceedsThreshold(mixed $score): void
    {
        if (! is_numeric($score)) {
            return;
        }

        $numericScore = (float) $score;

        if ($numericScore < 1) {
            $numericScore *= 100;
        }

        if ($numericScore < self::REJECTION_THRESHOLD_PERCENT) {
            return;
        }

        $thesis = $this->scan->thesis;

        if (! $thesis) {
            return;
        }

        $attributes = ['status' => ThesisStatus::REJECTED];

        if (! $thesis->rejection_remark) {
            $attributes['rejection_remark'] = sprintf(
                'Automatically rejected due to plagiarism score of %d%%.',
                (int) round($numericScore)
            );
        }

        $thesis->update($attributes);
    }
}
