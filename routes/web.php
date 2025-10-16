<?php

use App\Http\Controllers\ThesisTitleController;
use App\Http\Controllers\ThesisController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('thesis-titles/advisees', [ThesisTitleController::class, 'advisees'])->name('thesis-titles.advisees');
    Route::resource('thesis-titles', ThesisTitleController::class);
    Route::resource('thesis-titles.theses', ThesisController::class);
    Route::patch('thesis-titles/{thesis_title}/theses/{thesis}/status', [ThesisController::class, 'updateStatus'])
        ->name('thesis-titles.theses.status');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
