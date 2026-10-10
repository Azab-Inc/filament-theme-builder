<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['products', 'orders', 'customers'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->boolean('is_demo_fixture')->default(false);
            });
        }

        DB::table('products')->whereIn('sku', ['DEMO-CHAIR-001', 'DEMO-LAMP-001'])->update(['is_demo_fixture' => true]);
        DB::table('orders')->whereIn('number', ['DEMO-ORDER-1001', 'DEMO-ORDER-1002'])->update(['is_demo_fixture' => true]);
        DB::table('customers')->whereIn('email', ['avery@example.test', 'jordan@example.test'])->update(['is_demo_fixture' => true]);
    }

    public function down(): void
    {
        foreach (['products', 'orders', 'customers'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropColumn('is_demo_fixture');
            });
        }
    }
};
