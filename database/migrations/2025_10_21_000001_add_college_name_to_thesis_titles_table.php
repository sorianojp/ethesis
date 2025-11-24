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
            $table->string('college_name')->nullable()->after('adviser_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('thesis_titles', function (Blueprint $table) {
            $table->dropColumn('college_name');
        });
    }
};
