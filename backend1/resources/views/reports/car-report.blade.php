<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Car Report</title>
    <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h2>Car & Tenor Report</h2>
    <p>Generated: {{ $data['generated_at'] }}</p>
    <table>
        <thead><tr><th>Car</th><th>Brand</th><th>Price</th><th>Tenors</th></tr></thead>
        <tbody>
            @foreach($data['cars'] as $car)
            <tr>
                <td>{{ $car['car'] }}</td>
                <td>{{ $car['brand'] }}</td>
                <td>Rp {{ number_format($car['price']) }}</td>
                <td>{{ count($car['tenors']) }} options</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
