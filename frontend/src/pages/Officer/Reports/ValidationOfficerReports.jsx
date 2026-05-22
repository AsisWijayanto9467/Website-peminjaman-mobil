import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function ValidationOfficerReports() {
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
            const res = await api.get("/officer/reports/validations");
            setReport(res.data.report);
        } catch (err) {
            console.error("Failed to fetch validation report:", err);
            setError(err.response?.data?.message || "Failed to load validation report");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const res = await api.get("/officer/reports/validations", {
                params: { download: 'pdf' },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `validation-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

    const getAcceptanceRateColor = (rate) => {
        if (rate >= 70) return 'text-success';
        if (rate >= 40) return 'text-warning';
        return 'text-danger';
    };

    const getAcceptanceRateBgColor = (rate) => {
        if (rate >= 70) return 'bg-success';
        if (rate >= 40) return 'bg-warning';
        return 'bg-danger';
    };

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                        <p className="text-muted">Loading validation report...</p>
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
    const byRegional = report?.by_regional || [];

    // Filter regional data
    const filteredRegionals = filter === 'all' 
        ? byRegional 
        : byRegional.filter(r => {
            if (filter === 'has_pending') return r.pending > 0;
            if (filter === 'high_acceptance') return r.total > 0 && (r.accepted / r.total) >= 0.7;
            if (filter === 'low_acceptance') return r.total > 0 && (r.accepted / r.total) < 0.4;
            if (filter === 'most_validations') return r.total >= 5;
            return true;
        });

    // Hitung persentase untuk progress bar
    const acceptedPercentage = summary.total_validations > 0 
        ? ((summary.accepted || 0) / summary.total_validations) * 100 
        : 0;
    const declinedPercentage = summary.total_validations > 0 
        ? ((summary.declined || 0) / summary.total_validations) * 100 
        : 0;
    const pendingPercentage = summary.total_validations > 0 
        ? ((summary.pending || 0) / summary.total_validations) * 100 
        : 0;

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
                    {/* Total Validations */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Validations
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.total_validations?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">all validation records</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
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
                                        <div className="h4 mb-0 font-weight-bold text-success">
                                            {summary.accepted?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">approved validations</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Declined */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-danger shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                            Declined
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-danger">
                                            {summary.declined?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">rejected validations</small>
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
                                        <div className="h4 mb-0 font-weight-bold text-warning">
                                            {summary.pending?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">awaiting validation</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acceptance Rate & Status Distribution */}
                <div className="row mb-4">
                    {/* Acceptance Rate */}
                    <div className="col-xl-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-pie mr-2"></i>
                                    Acceptance Rate
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <div className="mb-4">
                                    <h1 className={`display-3 font-weight-bold ${getAcceptanceRateColor(summary.acceptance_rate)}`}>
                                        {summary.acceptance_rate || 0}%
                                    </h1>
                                    <p className="text-muted mb-0">Overall Validation Acceptance Rate</p>
                                </div>
                                
                                {/* Acceptance Rate Bar */}
                                <div className="progress mb-2" style={{ height: '20px', borderRadius: '10px' }}>
                                    <div 
                                        className={`progress-bar ${getAcceptanceRateBgColor(summary.acceptance_rate)}`}
                                        style={{ width: `${Math.min(summary.acceptance_rate || 0, 100)}%` }}
                                    >
                                        {summary.acceptance_rate > 0 && `${summary.acceptance_rate}%`}
                                    </div>
                                </div>
                                
                                {/* Target Indicators */}
                                <div className="d-flex justify-content-between mt-2">
                                    <small className="text-danger">0%</small>
                                    <small className="text-warning">50%</small>
                                    <small className="text-success">100%</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="col-xl-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-bar mr-2"></i>
                                    Status Distribution
                                </h6>
                            </div>
                            <div className="card-body">
                                {summary.total_validations > 0 ? (
                                    <>
                                        {/* Accepted Bar */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="text-sm font-weight-bold text-success">
                                                    <i className="fas fa-check-circle mr-1"></i> Accepted
                                                </span>
                                                <span className="text-sm font-weight-bold">
                                                    {summary.accepted?.toLocaleString() || 0} validations
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ width: `${acceptedPercentage}%` }}
                                                >
                                                    {acceptedPercentage > 10 && `${acceptedPercentage.toFixed(1)}%`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Declined Bar */}
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="text-sm font-weight-bold text-danger">
                                                    <i className="fas fa-times-circle mr-1"></i> Declined
                                                </span>
                                                <span className="text-sm font-weight-bold">
                                                    {summary.declined?.toLocaleString() || 0} validations
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                                                <div 
                                                    className="progress-bar bg-danger" 
                                                    style={{ width: `${declinedPercentage}%` }}
                                                >
                                                    {declinedPercentage > 10 && `${declinedPercentage.toFixed(1)}%`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pending Bar */}
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="text-sm font-weight-bold text-warning">
                                                    <i className="fas fa-clock mr-1"></i> Pending
                                                </span>
                                                <span className="text-sm font-weight-bold">
                                                    {summary.pending?.toLocaleString() || 0} validations
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                                                <div 
                                                    className="progress-bar bg-warning" 
                                                    style={{ width: `${pendingPercentage}%` }}
                                                >
                                                    {pendingPercentage > 10 && `${pendingPercentage.toFixed(1)}%`}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-muted my-4">
                                        <i className="fas fa-inbox fa-2x d-block mb-2"></i>
                                        No validation data available
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-success">
                                    <i className="fas fa-check-circle mr-2"></i>
                                    Accepted Validations
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <h2 className="font-weight-bold text-success mb-2">
                                    {summary.accepted?.toLocaleString() || 0}
                                </h2>
                                <p className="text-muted mb-0">Successfully validated societies</p>
                                <div className="progress mt-3" style={{ height: '10px' }}>
                                    <div className="progress-bar bg-success" style={{ width: `${acceptedPercentage}%` }}></div>
                                </div>
                                <small className="text-muted mt-1 d-block">{acceptedPercentage.toFixed(1)}% of total</small>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-danger">
                                    <i className="fas fa-times-circle mr-2"></i>
                                    Declined Validations
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <h2 className="font-weight-bold text-danger mb-2">
                                    {summary.declined?.toLocaleString() || 0}
                                </h2>
                                <p className="text-muted mb-0">Rejected validation requests</p>
                                <div className="progress mt-3" style={{ height: '10px' }}>
                                    <div className="progress-bar bg-danger" style={{ width: `${declinedPercentage}%` }}></div>
                                </div>
                                <small className="text-muted mt-1 d-block">{declinedPercentage.toFixed(1)}% of total</small>
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-warning">
                                    <i className="fas fa-clock mr-2"></i>
                                    Pending Validations
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <h2 className="font-weight-bold text-warning mb-2">
                                    {summary.pending?.toLocaleString() || 0}
                                </h2>
                                <p className="text-muted mb-0">Awaiting validation process</p>
                                <div className="progress mt-3" style={{ height: '10px' }}>
                                    <div className="progress-bar bg-warning" style={{ width: `${pendingPercentage}%` }}></div>
                                </div>
                                <small className="text-muted mt-1 d-block">{pendingPercentage.toFixed(1)}% of total</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validations by Regional */}
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="fas fa-map-marker-alt mr-2"></i>
                                Validations by Regional
                            </h6>
                            <select 
                                className="form-control form-control-sm"
                                style={{ width: '240px' }}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Regionals</option>
                                <option value="has_pending">Has Pending</option>
                                <option value="high_acceptance">High Acceptance (≥70%)</option>
                                <option value="low_acceptance">Low Acceptance (&lt;40%)</option>
                                <option value="most_validations">Most Validations (≥5)</option>
                            </select>
                        </div>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Province</th>
                                        <th>District</th>
                                        <th className="text-center">Total</th>
                                        <th className="text-center">Accepted</th>
                                        <th className="text-center">Declined</th>
                                        <th className="text-center">Pending</th>
                                        <th className="text-center">Acceptance Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRegionals.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                <i className="fas fa-inbox fa-2x text-muted mb-2 d-block"></i>
                                                No regional data found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRegionals.map((regional, index) => {
                                            const rate = regional.total > 0 
                                                ? ((regional.accepted / regional.total) * 100).toFixed(1) 
                                                : 0;
                                            return (
                                                <tr key={regional.regional_id || index}>
                                                    <td className="font-weight-bold">
                                                        <i className="fas fa-flag text-danger mr-2"></i>
                                                        {regional.province}
                                                    </td>
                                                    <td>
                                                        <i className="fas fa-city text-primary mr-2"></i>
                                                        {regional.district}
                                                    </td>
                                                    <td className="text-center font-weight-bold">
                                                        {regional.total}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-success font-weight-bold">
                                                            {regional.accepted}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="text-danger font-weight-bold">
                                                            {regional.declined}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        {regional.pending > 0 ? (
                                                            <span className="badge badge-warning">{regional.pending}</span>
                                                        ) : (
                                                            <span className="text-muted">0</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`font-weight-bold ${getAcceptanceRateColor(rate)}`}>
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
                            Showing {filteredRegionals.length} of {byRegional.length} regionals · 
                            Acceptance Rate: {summary.acceptance_rate || 0}%
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