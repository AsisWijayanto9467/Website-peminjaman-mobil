<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; margin-bottom: 20px; }
        .summary { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Validation Report</h2>
        <p>Generated: {{ $data['generated_at'] }} by {{ $data['generated_by'] }}</p>
    </div>
    <div class="summary">
        <h3>Summary</h3>
        <p>Total: {{ $data['summary']['total_validations'] }}</p>
        <p>Accepted: {{ $data['summary']['accepted'] }}</p>
        <p>Declined: {{ $data['summary']['declined'] }}</p>
        <p>Pending: {{ $data['summary']['pending'] }}</p>
        <p>Rate: {{ $data['summary']['acceptance_rate'] }}%</p>
    </div>
</body>
</html>
