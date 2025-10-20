<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlagiarismScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'thesis_id',
        'status',
        'document_path',
        'language',
        'country',
        'score',
        'source_count',
        'text_word_count',
        'total_plagiarism_words',
        'identical_word_count',
        'similar_word_count',
        'sources',
        'raw_response',
        'error_message',
        'scanned_at',
    ];

    protected $casts = [
        'score' => 'integer',
        'source_count' => 'integer',
        'text_word_count' => 'integer',
        'total_plagiarism_words' => 'integer',
        'identical_word_count' => 'integer',
        'similar_word_count' => 'integer',
        'sources' => 'array',
        'raw_response' => 'array',
        'scanned_at' => 'datetime',
    ];

    public function thesis(): BelongsTo
    {
        return $this->belongsTo(Thesis::class);
    }
}

