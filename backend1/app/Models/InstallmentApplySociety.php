<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstallmentApplySociety extends Model
{
    protected $table = "installment_apply_societies";

    protected $fillable = [
        "notes",
        "available_month_id",
        "date",
        "society_id",
        "installment_id"
    ];

    public function society() {
        return $this->belongsTo(Society::class);
    }

    public function installment() {
        return $this->belongsTo(Installment::class);
    }

    public function installmentApplyStatuses() {
        return $this->hasMany(installmentApplyStatus::class);
    }
}
