<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstallmentApplyStatus extends Model
{
    protected $table = "installment_apply_status";

    protected $fillable = [
        "date",
        "society_id",
        "installment_id",
        "available_month_id",
        "installment_apply_societies_id",
        "status"
    ];

    protected $casts = [
        "date" => "date"
    ];

    public function society() {
        return $this->belongsTo(Society::class);
    }

    public function installment() {
        return $this->belongsTo(Installment::class);
    }

    public function availableMonth() {
        return $this->belongsTo(AvailableMonth::class);
    }

    public function installmentApplySociety() {
        return $this->belongsTo(InstallmentApplySociety::class);
    }
}
