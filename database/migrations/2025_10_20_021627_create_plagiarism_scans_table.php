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
        Schema::create('plagiarism_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->string('document_path');
            $table->string('language', 8)->default('en');
            $table->string('country', 8)->default('us');
            $table->unsignedTinyInteger('score')->nullable();
            $table->unsignedInteger('source_count')->nullable();
            $table->unsignedInteger('text_word_count')->nullable();
            $table->unsignedInteger('total_plagiarism_words')->nullable();
            $table->unsignedInteger('identical_word_count')->nullable();
            $table->unsignedInteger('similar_word_count')->nullable();
            $table->json('sources')->nullable();
            $table->json('raw_response')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plagiarism_scans');
    }
};
