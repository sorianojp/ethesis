<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class UpdateThesisTitleScheduleRequest extends FormRequest
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
            'proposal_defense_at' => [
                'nullable',
                'date',
            ],
            'final_defense_at' => [
                'nullable',
                'date',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'proposal_defense_at' => $this->normalize($this->input('proposal_defense_at')),
            'final_defense_at' => $this->normalize($this->input('final_defense_at')),
        ]);
    }

    /**
     * @return array<string, Carbon|null>
     */
    public function schedulePayload(): array
    {
        $validated = $this->validated();

        return [
            'proposal_defense_at' => $this->toAppTimezone($validated['proposal_defense_at'] ?? null),
            'final_defense_at' => $this->toAppTimezone($validated['final_defense_at'] ?? null),
        ];
    }

    private function normalize(mixed $value): mixed
    {
        if ($value === '' || $value === 'null') {
            return null;
        }

        return $value;
    }

    private function toAppTimezone(?string $value): ?Carbon
    {
        if ($value === null) {
            return null;
        }

        return Carbon::parse($value, config('app.timezone'))
            ->setTimezone(config('app.timezone'));
    }
}
