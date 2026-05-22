import React, { useState, useEffect } from 'react';
import MainLayouts from '../../Layouts/MainLayouts';
import api from '../../../services/api';

export default function InstallmentValidatorReport() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/validator/reports/installments");
            setReport(res.data.report);
        } catch (err) {
            console.error("Failed to fetch installment report:", err);
            setError(err.response?.data?.message || "Failed to load installment report");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const res = await api.get("/validator/reports/installments", {
                params: { download: 'pdf' },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `installment-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

    const getApprovalRateColor = (rate) => {
        if (rate >= 70) return 'text-success';
        if (rate >= 40) return 'text-warning';
        return 'text-danger';
    };

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                        <p className="text-muted">Loading installment report...</p>
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
    const byCar = report?.by_car || [];

    // Filter car data
    const filteredCars = filter === 'all' 
        ? byCar 
        : byCar.filter(c => {
            if (filter === 'has_pending') return c.pending > 0;
            if (filter === 'high_approval') return c.total > 0 && (c.accepted / c.total) >= 0.7;
            if (filter === 'low_approval') return c.total > 0 && (c.accepted / c.total) < 0.4;
            if (filter === 'most_applied') return c.total >= 5;
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
                    {/* Total Applications */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Applications
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.total_applications?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-file-invoice fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accepted */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Accepted
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.accepted?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rejected */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-danger shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                            Rejected
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.rejected?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-times-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Pending
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.pending?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Approval Rate & Progress */}
                <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-pie mr-2"></i>
                                    Approval Rate
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <h1 className={`display-4 font-weight-bold ${getApprovalRateColor(summary.approval_rate)}`}>
                                    {summary.approval_rate || 0}%
                                </h1>
                                <p className="text-muted mb-0">Overall installment approval rate</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-bar mr-2"></i>
                                    Status Distribution
                                </h6>
                            </div>
                            <div className="card-body">
                                {summary.total_applications > 0 ? (
                                    <>
                                        {/* Accepted Bar */}
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-success">Accepted</span>
                                                <span className="text-sm">{summary.accepted || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ width: `${((summary.accepted || 0) / summary.total_applications) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        {/* Rejected Bar */}
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-danger">Rejected</span>
                                                <span className="text-sm">{summary.rejected || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div 
                                                    className="progress-bar bg-danger" 
                                                    style={{ width: `${((summary.rejected || 0) / summary.total_applications) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        {/* Pending Bar */}
                                        <div>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-warning">Pending</span>
                                                <span className="text-sm">{summary.pending || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div 
                                                    className="progress-bar bg-warning" 
                                                    style={{ width: `${((summary.pending || 0) / summary.total_applications) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-muted my-4">No data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Applications by Car */}
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="fas fa-car mr-2"></i>
                                Applications by Car
                            </h6>
                            <select 
                                className="form-control form-control-sm"
                                style={{ width: '220px' }}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Cars</option>
                                <option value="has_pending">Has Pending</option>
                                <option value="high_approval">High Approval (≥70%)</option>
                                <option value="low_approval">Low Approval (&lt;40%)</option>
                                <option value="most_applied">Most Applied (≥5)</option>
                            </select>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Brand</th>
                                        <th>Car Model</th>
                                        <th className="text-center">Total</th>
                                        <th className="text-center">Accepted</th>
                                        <th className="text-center">Rejected</th>
                                        <th className="text-center">Pending</th>
                                        <th className="text-center">Approval Rate</th>
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
                                        filteredCars.map((car, index) => {
                                            const rate = car.total > 0 
                                                ? ((car.accepted / car.total) * 100).toFixed(1) 
                                                : 0;
                                            return (
                                                <tr key={car.car_id || index}>
                                                    <td className="font-weight-bold">{car.brand}</td>
                                                    <td>{car.car_name}</td>
                                                    <td className="text-center">{car.total}</td>
                                                    <td className="text-center">
                                                        <span className="text-success font-weight-bold">
                                                            {car.accepted}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-danger font-weight-bold">
                                                            {car.rejected}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        {car.pending > 0 ? (
                                                            <span className="badge badge-warning">{car.pending}</span>
                                                        ) : (
                                                            <span className="text-muted">0</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`font-weight-bold ${getApprovalRateColor(rate)}`}>
                                                            {rate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card-footer bg-light">
                        <small className="text-muted">
                            <i className="fas fa-info-circle mr-1"></i>
                            Showing {filteredCars.length} of {byCar.length} cars
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
                .border-left-danger {
                    border-left: 4px solid #e74a3b !important;
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
                .progress {
                    border-radius: 10px;
                    background-color: #eaecf4;
                }
            `}</style>
        </MainLayouts>
    );
}