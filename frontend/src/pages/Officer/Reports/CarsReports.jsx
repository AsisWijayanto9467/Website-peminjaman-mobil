import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function CarsReports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [expandedCar, setExpandedCar] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/officer/reports/cars");
            setReport(res.data.report);
        } catch (err) {
            console.error("Failed to fetch car report:", err);
            setError(err.response?.data?.message || "Failed to load car report");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const res = await api.get("/officer/reports/cars", {
                params: { download: 'pdf' },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `car-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download PDF:", err);
            alert("Failed to download PDF report");
        } finally {
            setDownloading(false);
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number || 0);
    };

    const getApplicationBadge = (count) => {
        if (count >= 10) return 'badge-success';
        if (count >= 5) return 'badge-warning';
        if (count > 0) return 'badge-info';
        return 'badge-secondary';
    };

    const toggleExpandCar = (index) => {
        if (expandedCar === index) {
            setExpandedCar(null);
        } else {
            setExpandedCar(index);
        }
    };

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                        <p className="text-muted">Loading car report...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    if (error && !report) {
        return (
            <MainLayouts>
                <div className="container-fluid">
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                        <button className="btn btn-sm btn-outline-danger ml-3" onClick={fetchReport}>
                            <i className="fas fa-redo mr-1"></i> Retry
                        </button>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    const summary = report?.summary || {};
    const cars = report?.cars || [];

    // Filter cars
    const filteredCars = filter === 'all' 
        ? cars 
        : cars.filter(car => {
            if (filter === 'has_tenors') return car.tenors && car.tenors.length > 0;
            if (filter === 'no_tenors') return !car.tenors || car.tenors.length === 0;
            if (filter === 'has_applications') return car.total_applications > 0;
            if (filter === 'popular') return car.total_applications >= 5;
            if (filter === 'high_price') return car.price >= 300000000;
            return true;
        });

    return (
        <MainLayouts>
            <div className="container-fluid">
                {/* Page Header */}
                <div className="d-flex justify-content-end align-items-center mb-4">
                    
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-outline-primary" 
                            onClick={fetchReport}
                            title="Refresh report"
                        >
                            <i className="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </button>
                        <button 
                            className="btn btn-danger" 
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-file-pdf mr-2"></i>
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    {/* Total Cars */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Cars
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.total_cars?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-car-side fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Brands */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Total Brands
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.total_brands?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-tags fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Tenors */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Total Tenors
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.total_tenors?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-calendar-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Avg Price */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Avg Car Price
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold">
                                            {cars.length > 0 
                                                ? formatRupiah(cars.reduce((sum, c) => sum + (c.price || 0), 0) / cars.length)
                                                : 'Rp 0'
                                            }
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-money-bill-wave fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cars Table with Expandable Tenors */}
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="fas fa-list mr-2"></i>
                                Car Inventory List
                            </h6>
                            <select 
                                className="form-control form-control-sm"
                                style={{ width: '220px' }}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Cars</option>
                                <option value="has_tenors">Has Tenors</option>
                                <option value="no_tenors">No Tenors</option>
                                <option value="has_applications">Has Applications</option>
                                <option value="popular">Popular (≥5 apps)</option>
                                <option value="high_price">High Price (≥300M)</option>
                            </select>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4" style={{ width: '40px' }}></th>
                                        <th>Car Model</th>
                                        <th>Brand</th>
                                        <th className="text-right">Price</th>
                                        <th className="text-center">Tenors</th>
                                        <th className="text-center">Applications</th>
                                        <th className="text-center pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCars.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                <i className="fas fa-inbox fa-2x text-muted mb-2 d-block"></i>
                                                No car data found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCars.map((car, index) => (
                                            <React.Fragment key={index}>
                                                {/* Main Row */}
                                                <tr 
                                                    style={{ cursor: car.tenors && car.tenors.length > 0 ? 'pointer' : 'default' }}
                                                    onClick={() => car.tenors && car.tenors.length > 0 && toggleExpandCar(index)}
                                                >
                                                    <td className="pl-4">
                                                        {car.tenors && car.tenors.length > 0 && (
                                                            <i className={`fas fa-chevron-${expandedCar === index ? 'down' : 'right'} text-muted`}></i>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="font-weight-bold">{car.car}</span>
                                                        <br />
                                                        <small className="text-muted">
                                                            {car.description?.substring(0, 60)}{car.description?.length > 60 ? '...' : ''}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-primary">{car.brand}</span>
                                                    </td>
                                                    <td className="text-right font-weight-bold">
                                                        {formatRupiah(car.price)}
                                                    </td>
                                                    <td className="text-center">
                                                        {car.tenors && car.tenors.length > 0 ? (
                                                            <span className="badge badge-info">{car.tenors.length}</span>
                                                        ) : (
                                                            <span className="badge badge-warning">0</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge ${getApplicationBadge(car.total_applications)}`}>
                                                            {car.total_applications || 0}
                                                        </span>
                                                    </td>
                                                    <td className="text-center pr-4">
                                                        {car.tenors && car.tenors.length > 0 && (
                                                            <button 
                                                                className="btn btn-sm btn-outline-info"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleExpandCar(index);
                                                                }}
                                                                title="View Tenors"
                                                            >
                                                                <i className={`fas fa-${expandedCar === index ? 'eye-slash' : 'eye'} mr-1`}></i>
                                                                {expandedCar === index ? 'Hide' : 'Tenors'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Expanded Tenor Row */}
                                                {expandedCar === index && car.tenors && car.tenors.length > 0 && (
                                                    <tr key={`tenor-${index}`}>
                                                        <td colSpan="7" className="bg-light p-0">
                                                            <div className="p-3">
                                                                <h6 className="font-weight-bold text-info mb-2">
                                                                    <i className="fas fa-calendar-alt mr-2"></i>
                                                                    Available Tenors for {car.brand} - {car.car}
                                                                </h6>
                                                                <div className="table-responsive">
                                                                    <table className="table table-sm table-bordered bg-white mb-0">
                                                                        <thead className="thead-light">
                                                                            <tr>
                                                                                <th className="text-center">Month</th>
                                                                                <th>Description</th>
                                                                                <th className="text-right">Monthly Installment</th>
                                                                                <th className="text-right">Total Payment</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {car.tenors.map((tenor, tIndex) => (
                                                                                <tr key={tIndex}>
                                                                                    <td className="text-center">
                                                                                        <span className="badge badge-info" style={{ fontSize: '0.9rem', padding: '6px 10px' }}>
                                                                                            {tenor.month} months
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>{tenor.description}</td>
                                                                                    <td className="text-right font-weight-bold">
                                                                                        {formatRupiah(tenor.nominal)}
                                                                                    </td>
                                                                                    <td className="text-right font-weight-bold text-success">
                                                                                        {formatRupiah(tenor.nominal * tenor.month)}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card-footer bg-light">
                        <small className="text-muted">
                            <i className="fas fa-info-circle mr-1"></i>
                            Showing {filteredCars.length} of {cars.length} cars · 
                            Click on row to expand tenor details
                        </small>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx="true">{`
                .border-left-primary {
                    border-left: 4px solid #4e73df !important;
                }
                .border-left-success {
                    border-left: 4px solid #1cc88a !important;
                }
                .border-left-info {
                    border-left: 4px solid #36b9cc !important;
                }
                .border-left-warning {
                    border-left: 4px solid #f6c23e !important;
                }
                .text-xs {
                    font-size: 0.7rem;
                }
                .text-gray-300 {
                    color: #dddfeb !important;
                }
                .card {
                    border: none;
                    border-radius: 0.35rem;
                    transition: transform 0.2s ease;
                }
                .card:hover {
                    transform: translateY(-2px);
                }
                .table th {
                    border-top: none;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .table tr:hover {
                    background-color: #f8f9fc;
                }
                .bg-light {
                    background-color: #f8f9fc !important;
                }
            `}</style>
        </MainLayouts>
    );
}