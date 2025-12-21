<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreThesisRequest extends FormRequest
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
            'chapter' => ['required', 'string', 'max:255'],
            'thesis_pdf' => ['required', 'file', 'mimes:doc,docx'],
        ];
    }

    /**
     * Custom validation messages for the request.
     */
    public function messages(): array
    {
        return [
            'thesis_pdf.required' => 'Attach your chapter before submitting.',
            'thesis_pdf.mimes' => 'Only DOC or DOCX files are accepted.',
            'thesis_pdf.uploaded' => 'Please upload a DOC or DOCX file within the size limit.',
        ];
    }
}
