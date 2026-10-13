<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PanelBrandingUploadController;

Route::get('/health', fn () => response()->json(['status' => 'ok']));
Route::post('/branding-assets', [PanelBrandingUploadController::class, 'store']);
Route::get('/branding-assets/{reference}', [PanelBrandingUploadController::class, 'show'])->where('reference', '[a-f0-9]{64}/[a-f0-9]{40}\\.(jpg|jpeg|png|webp)');
