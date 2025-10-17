<?php

namespace App\Models;

use App\Enums\ThesisStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Thesis extends Model
{
    use HasFactory;

    protected $fillable = [
        'thesis_title_id',
        'chapter',
        'thesis_pdf',
        'status',
        'rejection_remark',
    ];

    protected $casts = [
        'status' => ThesisStatus::class,
    ];

    public function thesisTitle(): BelongsTo
    {
        return $this->belongsTo(ThesisTitle::class);
    }
}
