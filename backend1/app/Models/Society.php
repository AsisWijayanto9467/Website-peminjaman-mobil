<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Society extends Model
{
    use HasFactory, HasApiTokens;

    protected $table = "societies";

    protected $fillable = [
        "id_card_number",
        "name",
        "password",
        "born_date",
        "gander",
        "address",
        "regional_id",
        "login_tokens"
    ];

    public function regional() {
        return $this->belongsTo(Regional::class);
    }

    public function validations() {
        return $this->hasMany(Validation::class);
    }

    public function installmentApplySocieties() {
        return $this->hasMany(InstallmentApplySociety::class);
    }

    public function installmentApplyStatuses() {
        return $this->hasMany(installmentApplyStatus::class);
    }
}
