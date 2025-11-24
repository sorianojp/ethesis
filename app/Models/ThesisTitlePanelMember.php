<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThesisTitlePanelMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'thesis_title_panel_id',
        'user_id',
    ];

    public function panel(): BelongsTo
    {
        return $this->belongsTo(ThesisTitlePanel::class, 'thesis_title_panel_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
