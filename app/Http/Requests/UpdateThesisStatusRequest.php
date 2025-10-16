<?php

namespace App\Http\Requests;

use App\Enums\ThesisStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateThesisStatusRequest extends FormRequest
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
            'status' => ['required', Rule::in(ThesisStatus::values())],
        ];
    }

    public function status(): ThesisStatus
    {
        $validated = $this->validated();

        $status = $validated['status'] ?? null;

        return $status instanceof ThesisStatus ? $status : ThesisStatus::from($status);
    }
}
