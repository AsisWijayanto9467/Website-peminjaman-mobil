<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    protected $table = "installment";

    protected $fillable = [
        "brand_id",
        "cars",
        "description",
        "price"
    ];

    public function brand() {
        return $this->belongSto(Brand::class);
    }

    public function availableMonths() {
        return $this->hasMany(AvailableMonth::class);
    }

    public function installmentApplySocieties() {
        return $this->hasMany(InstallmentApplySociety::class);
    }

    public function installmentApplyStatuses() {
        return $this->hasMany(installmentApplyStatus::class);
    }
}
