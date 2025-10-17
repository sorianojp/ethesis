<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ThesisTitle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'adviser_id',
        'title',
        'abstract_pdf',
        'endorsement_pdf',
        'proposal_defense_at',
        'final_defense_at',
    ];

    protected $casts = [
        'proposal_defense_at' => 'datetime',
        'final_defense_at' => 'datetime',
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

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function panel(): HasOne
    {
        return $this->hasOne(ThesisTitlePanel::class);
    }
}
