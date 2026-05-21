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
        Schema::create('installment_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId("installment_apply_society_id")->constrained("installment_apply_societies")->cascadeOnDelete();
            $table->foreignId("society_id")->constrained("societies")->cascadeOnDelete();
            $table->integer("payment_amount");
            $table->integer("month_number");
            $table->enum("status", ["paid", "unpaid", "late"])->default("unpaid");
            $table->date("due_date");
            $table->date("paid_date")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installment_payments');
    }
};
