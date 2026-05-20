<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstallmentApplyStatus extends Model
{
    protected $table ="installment_apply_statuses";

    protected $fillable = [
        "date",
        "society_id",
        "installment_id",
        "available_month_id",
        "installment_apply_society_id",
        "status",
        "updated_at",
        "created_at"
    ];

    public function society() {
        return $this->belongsTo(Society::class);
    }

    public function installment() {
        return $this->belongsTo(Installment::class);
    }

    public function AvailableMonth() {
        return $this->belongsTo(AvailableMonth::class);
    }

    public function InstallmentApplySociety() {
        return $this->belongsTo(InstallmentApplySociety::class);
    }
}
