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
        Schema::create('thesis_title_panels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thesis_title_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('chairman_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('member_one_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('member_two_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique('thesis_title_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('thesis_title_panels');
    }
};
