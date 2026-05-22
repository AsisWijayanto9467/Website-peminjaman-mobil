<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallmentPayment extends Model
{
    use HasFactory;

    protected $table = "installment_payments";

    protected $fillable = [
        "installment_apply_society_id",
        "society_id",
        "payment_amount",
        "month_number",
        "status",
        "due_date",
        "paid_date"
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    public function installmentApplySociety() {
        return $this->belongsTo(InstallmentApplySociety::class, 'installment_apply_society_id');
    }

    public function society() {
        return $this->belongsTo(Society::class);
    }
}
