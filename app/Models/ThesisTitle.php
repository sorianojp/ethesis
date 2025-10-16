<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ThesisTitle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'adviser_id',
        'title',
        'abstract_pdf',
        'endorsement_pdf',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function theses(): HasMany
    {
        return $this->hasMany(Thesis::class);
    }
}
