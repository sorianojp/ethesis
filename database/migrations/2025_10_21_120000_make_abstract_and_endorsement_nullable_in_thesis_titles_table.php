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
            $table->string('abstract_pdf')->nullable()->change();
            $table->string('endorsement_pdf')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('thesis_titles', function (Blueprint $table) {
            $table->string('abstract_pdf')->nullable(false)->change();
            $table->string('endorsement_pdf')->nullable(false)->change();
        });
    }
};
