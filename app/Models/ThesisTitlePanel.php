<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThesisTitlePanel extends Model
{
    use HasFactory;

    protected $fillable = [
        'thesis_title_id',
        'chairman_id',
        'member_one_id',
        'member_two_id',
    ];

    public function thesisTitle(): BelongsTo
    {
        return $this->belongsTo(ThesisTitle::class);
    }

    public function chairman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chairman_id');
    }

    public function memberOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_one_id');
    }

    public function memberTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_two_id');
    }
}

