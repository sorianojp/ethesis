<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('thesis_titles', function (Blueprint $table) {
            $table->dateTime('proposal_defense_at')->nullable()->after('endorsement_pdf');
            $table->dateTime('final_defense_at')->nullable()->after('proposal_defense_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('thesis_titles', function (Blueprint $table) {
            $table->dropColumn(['proposal_defense_at', 'final_defense_at']);
        });
    }
};
