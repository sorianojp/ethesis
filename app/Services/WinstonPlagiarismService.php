<?php

namespace App\Services;

use App\Models\PlagiarismScan;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WinstonPlagiarismService
{
    public function __construct(
        private readonly string $token,
        private readonly string $endpoint,
        private readonly string $defaultLanguage = 'en',
        private readonly string $defaultCountry = 'us',
    ) {
    }

    public static function make(): self
    {
        $token = (string) config('services.winston_ai.token');
        $endpoint = (string) config('services.winston_ai.plagiarism_endpoint', 'https://api.gowinston.ai/v2/plagiarism');
        $language = (string) config('services.winston_ai.default_language', 'en');
        $country = (string) config('services.winston_ai.default_country', 'us');

        return new self($token, $endpoint, $language, $country);
    }

    public function scan(PlagiarismScan $scan, string $documentUrl, array $overrides = []): PlagiarismScan
    {
        if ($this->token === '') {
            $scan->update([
                'status' => 'failed',
                'error_message' => 'Missing Winston AI token. Set the WINSTON_AI_API_TOKEN environment variable.',
            ]);

            return $scan;
        }

        $payload = [
            'file' => $documentUrl,
            'language' => $overrides['language'] ?? $scan->language ?? $this->defaultLanguage,
            'country' => $overrides['country'] ?? $scan->country ?? $this->defaultCountry,
        ];

        try {
            $response = Http::withToken($this->token)
                ->acceptJson()
                ->throw()
                ->post($this->endpoint, $payload);
        } catch (RequestException $exception) {
            $scan->update([
                'status' => 'failed',
                'error_message' => $exception->response?->body() ?: $exception->getMessage(),
            ]);

            return $scan;
        } catch (Throwable $exception) {
            Log::error('Unexpected Winston AI plagiarism scan failure.', [
                'scan_id' => $scan->id,
                'exception' => $exception,
            ]);

            $scan->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
            ]);

            return $scan;
        }

        $data = $response->json();

        $result = Arr::get($data, 'result', []);
        $scanTime = Arr::get($data, 'scanInformation.scanTime');

        $scan->update([
            'status' => 'completed',
            'score' => Arr::get($result, 'score'),
            'source_count' => Arr::get($result, 'sourceCounts'),
            'text_word_count' => Arr::get($result, 'textWordCounts'),
            'total_plagiarism_words' => Arr::get($result, 'totalPlagiarismWords'),
            'identical_word_count' => Arr::get($result, 'identicalWordCounts'),
            'similar_word_count' => Arr::get($result, 'similarWordCounts'),
            'sources' => Arr::get($data, 'sources'),
            'raw_response' => $data,
            'scanned_at' => $scanTime ? CarbonImmutable::parse($scanTime) : now(),
            'error_message' => null,
        ]);

        return $scan;
    }
}

