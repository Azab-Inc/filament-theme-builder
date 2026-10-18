<?php

use App\Http\Controllers\LocalThemeRelay\BootstrapController;
use App\Http\Controllers\LocalThemeRelay\OperationPayloadController;
use App\Http\Controllers\LocalThemeRelay\OperationPreviewController;
use App\Http\Controllers\LocalThemeRelay\OperationResultController;
use App\Http\Controllers\LocalThemeRelay\PairingController;
use App\Http\Controllers\LocalThemeRelay\SessionController;
use App\Http\Middleware\ValidateLocalThemeRelay;
use Illuminate\Support\Facades\Route;

Route::prefix('local-theme/relay')->middleware(ValidateLocalThemeRelay::class)->group(function (): void {
    Route::get('bootstrap', BootstrapController::class);
    Route::post('pairings', [PairingController::class, 'create']);
    Route::get('pairings/{id}', [PairingController::class, 'status']);
    Route::post('pairings/{id}/approve', [PairingController::class, 'approve']);
    Route::post('sessions/poll', [SessionController::class, 'poll']);
    Route::post('sessions/heartbeat', [SessionController::class, 'heartbeat']);
    Route::post('sessions/disconnect', [SessionController::class, 'disconnect']);
    Route::get('operations/{id}/payload', [OperationPayloadController::class, 'payload']);
    Route::post('operations/{id}/receipt', [OperationPayloadController::class, 'receipt']);
    Route::post('operations/{id}/preview', [OperationPreviewController::class, 'preview']);
    Route::post('operations/{id}/authorize-apply', [OperationPreviewController::class, 'authorizeApply']);
    Route::post('operations/{id}/result', [OperationResultController::class, 'publish']);
    Route::get('operations/{id}/result', [OperationResultController::class, 'status']);
});
