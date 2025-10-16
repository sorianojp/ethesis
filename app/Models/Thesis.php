<?php

namespace App\Models;

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
    ];

    public function thesisTitle(): BelongsTo
    {
        return $this->belongsTo(ThesisTitle::class);
    }
}
