<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Society extends Model
{
    use HasApiTokens;

    protected $table = "societies";

    protected $fillable = [
        "id_card_number",
        "password",
        "name",
        "born_date",
        "gender",
        "address",
        "regional_id",
        "login_tokens",
        "updated_at"
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'born_date' => 'date',
        ];
    }

    const CREATED_AT = null;
    const UPDATED_AT = 'updated_at';

    public function regional() {
        return $this->belongsTo(Regional::class);
    }

    public function validations() {
        return $this->hasMany(Validation::class);
    }

    public function InstallmentApplySocieties() {
        return $this->hasMany(InstallmentApplySociety::class);
    }

    public function InstallmentApplyStatuses() {
        return $this->hasMany(InstallmentApplyStatus::class);
    }

    public function InstallmentPayments() {
        return $this->hasMany(InstallmentPayment::class);
    }
}
