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
                'different:member_one_id',
                'different:member_two_id',
            ],
            'member_one_id' => [
                'nullable',
                'integer',
                'exists:users,id',
                'different:member_two_id',
            ],
            'member_two_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'chairman_id' => $this->normalize($this->input('chairman_id')),
            'member_one_id' => $this->normalize($this->input('member_one_id')),
            'member_two_id' => $this->normalize($this->input('member_two_id')),
        ]);
    }

    /**
     * @return array<string, int|null>
     */
    public function panelMembers(): array
    {
        $validated = $this->validated();

        return [
            'chairman_id' => isset($validated['chairman_id']) ? (int) $validated['chairman_id'] : null,
            'member_one_id' => isset($validated['member_one_id']) ? (int) $validated['member_one_id'] : null,
            'member_two_id' => isset($validated['member_two_id']) ? (int) $validated['member_two_id'] : null,
        ];
    }

    private function normalize(mixed $value): mixed
    {
        if ($value === '' || $value === 'null') {
            return null;
        }

        return $value;
    }
}
