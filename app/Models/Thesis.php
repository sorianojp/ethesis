<?php

namespace App\Models;

use App\Enums\ThesisStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Thesis extends Model
{
    use HasFactory;

    protected $fillable = [
        'thesis_title_id',
        'chapter',
        'thesis_pdf',
        'post_grad',
        'status',
        'rejection_remark',
    ];

    protected $casts = [
        'status' => ThesisStatus::class,
        'post_grad' => 'boolean',
    ];

    public function thesisTitle(): BelongsTo
    {
        return $this->belongsTo(ThesisTitle::class);
    }

    public function plagiarismScans(): HasMany
    {
        return $this->hasMany(PlagiarismScan::class);
    }

    public function latestPlagiarismScan(): HasOne
    {
        return $this->hasOne(PlagiarismScan::class)->latestOfMany();
    }
}
