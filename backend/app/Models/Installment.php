<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    protected $table = "installments";

    protected $fillable = [
        "brand_id",
        "cars",
        "description",
        "price"
    ];

    public function brand() {
        return $this->belongsTo(Brand::class);
    }

    public function AvailableMonths() {
        return $this->hasMany(AvailableMonth::class);
    }

    public function InstallmentApplySocieties() {
        return $this->hasMany(InstallmentApplySociety::class);
    }

    public function InstallmentApplyStatuses() {
        return $this->hasMany(InstallmentApplyStatus::class);
    }
}
