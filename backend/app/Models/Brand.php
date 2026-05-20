<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $table = "brands";

    protected $fillable = [
        "brand"
    ];

    public function installments() {
        return $this->hasMany(Installment::class);
    }
}
