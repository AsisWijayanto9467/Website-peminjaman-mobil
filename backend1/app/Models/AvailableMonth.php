<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AvailableMonth extends Model
{
    protected $table = "available_month";

    protected $fillable = [
        "installment_id",
        "month",
        "description",
        "nominal"
    ];

    public function installment() {
        return $this->belongsTo(Installment::class);
    }

    public function installmentApplyStatuses() {
        return $this->hasMany(installmentApplyStatus::class);
    }
}
