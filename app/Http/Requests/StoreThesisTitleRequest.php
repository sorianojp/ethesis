<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreThesisTitleRequest extends FormRequest
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
            'adviser_id' => ['required', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'abstract_pdf' => ['nullable', 'file', 'mimes:pdf'],
            'endorsement_pdf' => ['nullable', 'file', 'mimes:pdf'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $adviserId = $this->integer('adviser_id');

                if ($adviserId && ! User::teachers()->whereKey($adviserId)->exists()) {
                    $validator->errors()->add('adviser_id', __('Selected adviser must be a teacher.'));
                }

                $memberIds = collect($this->input('member_ids', []))
                    ->filter(fn ($id) => $id !== null)
                    ->map(fn ($id) => (int) $id)
                    ->filter();

                if ($memberIds->isEmpty()) {
                    return;
                }

                $studentCount = User::students()
                    ->whereIn('id', $memberIds)
                    ->count();

                if ($studentCount !== $memberIds->unique()->count()) {
                    $validator->errors()->add('member_ids', __('All members must be students.'));
                }
            },
        ];
    }
}
