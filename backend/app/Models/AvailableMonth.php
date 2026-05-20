<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AvailableMonth extends Model
{
    protected $table = "available_months";


    protected $fillable = [
        "installment_id",
        "month",
        "description",
        "nominal"
    ];

    public function installment() {
        return $this->belongsTo(Installment::class);
    }

    public function InstallmentApplySocieties() {
        return $this->hasMany(InstallmentApplySociety::class);
    }

    public function InstallmentApplyStatuses() {
        return $this->hasMany(InstallmentApplyStatus::class);
    }
}
