<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Validation extends Model
{
    protected $table = "validations";

    protected $fillable = [
        "society_id",
        "validator_id",
        "status",
        "job",
        "job_description",
        "income",
        "reason_accepted",
        "validators_notes"
    ];

    public function society() {
        return $this->belongsTo(Society::class);
    }

    public function validator() {
        return $this->belongsTo(Validator::class);
    }
}
