<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateThesisTitlePanelRequest extends FormRequest
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
            'chairman_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
            'member_ids' => ['array'],
            'member_ids.*' => ['nullable', 'integer', 'exists:users,id', 'distinct'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'chairman_id' => $this->normalize($this->input('chairman_id')),
            'member_ids' => $this->normalizeArray($this->input('member_ids', [])),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function panelMembers(): array
    {
        $validated = $this->validated();

        return [
            'chairman_id' => isset($validated['chairman_id']) ? (int) $validated['chairman_id'] : null,
            'member_ids' => collect($validated['member_ids'] ?? [])
                ->filter(fn ($id) => $id !== null && $id !== '')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all(),
        ];
    }

    private function normalize(mixed $value): mixed
    {
        if ($value === '' || $value === 'null') {
            return null;
        }

        return $value;
    }

    /**
     * @param  mixed  $value
     * @return list<int|null|string>
     */
    private function normalizeArray(mixed $value): array
    {
        if (is_array($value)) {
            return collect($value)
                ->values()
                ->map(function ($item) {
                    if ($item === '' || $item === 'null') {
                        return null;
                    }

                    return $item;
                })
                ->all();
        }

        return [];
    }
}
