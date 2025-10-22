<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ThesisTitleController;
use App\Http\Controllers\ThesisController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('thesis-titles/advisees', [ThesisTitleController::class, 'advisees'])->name('thesis-titles.advisees');
    Route::resource('thesis-titles', ThesisTitleController::class);
    Route::resource('thesis-titles.theses', ThesisController::class);
    Route::patch('thesis-titles/{thesis_title}/theses/{thesis}/status', [ThesisController::class, 'updateStatus'])
        ->name('thesis-titles.theses.status');
    Route::patch('thesis-titles/{thesis_title}/panel', [ThesisTitleController::class, 'updatePanel'])
        ->name('thesis-titles.panel.update');
    Route::patch('thesis-titles/{thesis_title}/schedule', [ThesisTitleController::class, 'updateSchedule'])
        ->name('thesis-titles.schedule.update');
    Route::get('thesis-titles/{thesis_title}/certificates/proposal', [ThesisTitleController::class, 'downloadProposalCertificate'])
        ->name('thesis-titles.certificates.proposal');
    Route::get('thesis-titles/{thesis_title}/certificates/final', [ThesisTitleController::class, 'downloadFinalCertificate'])
        ->name('thesis-titles.certificates.final');
    Route::get('thesis-titles/{thesis_title}/approval-forms/undergrad', [ThesisTitleController::class, 'downloadUndergradApprovalForm'])
        ->name('thesis-titles.approval-forms.undergrad');
    Route::get('thesis-titles/{thesis_title}/approval-forms/postgrad', [ThesisTitleController::class, 'downloadPostgradApprovalForm'])
        ->name('thesis-titles.approval-forms.postgrad');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
