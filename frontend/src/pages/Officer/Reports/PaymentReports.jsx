import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function PaymentReports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/officer/reports/payments");
            setReport(res.data.report);
        } catch (err) {
            console.error("Failed to fetch payment report:", err);
            setError(err.response?.data?.message || "Failed to load payment report");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const res = await api.get("/officer/reports/payments", {
                params: { download: 'pdf' },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payment-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

    const getCollectionRateColor = (rate) => {
        if (rate >= 80) return 'text-success';
        if (rate >= 50) return 'text-warning';
        return 'text-danger';
    };

    const getCollectionRateBgColor = (rate) => {
        if (rate >= 80) return 'bg-success';
        if (rate >= 50) return 'bg-warning';
        return 'bg-danger';
    };

    const getPaidPercentage = (summary) => {
        if (!summary.total_payments || summary.total_payments === 0) return 0;
        return ((summary.paid_count || 0) / summary.total_payments) * 100;
    };

    const getUnpaidPercentage = (summary) => {
        if (!summary.total_payments || summary.total_payments === 0) return 0;
        return ((summary.unpaid_count || 0) / summary.total_payments) * 100;
    };

    const getLatePercentage = (summary) => {
        if (!summary.total_payments || summary.total_payments === 0) return 0;
        return ((summary.late_count || 0) / summary.total_payments) * 100;
    };

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                        <p className="text-muted">Loading payment report...</p>
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

                {/* Summary Cards Row 1 - Financial Overview */}
                <div className="row mb-4">
                    {/* Total Payments */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Payments
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.total_payments?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">installment records</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-receipt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Total Amount
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold">
                                            {formatRupiah(summary.total_amount)}
                                        </div>
                                        <small className="text-muted">all payment records</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-coins fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Paid */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Total Paid Amount
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold text-success">
                                            {formatRupiah(summary.total_paid)}
                                        </div>
                                        <small className="text-muted">collected payments</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Collection Rate */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body text-center">
                                <div className="text-xs font-weight-bold text-warning text-uppercase mb-2">
                                    Collection Rate
                                </div>
                                <h1 className={`display-4 font-weight-bold mb-0 ${getCollectionRateColor(summary.collection_rate)}`}>
                                    {summary.collection_rate || 0}%
                                </h1>
                                <small className="text-muted">payment collection rate</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Status Distribution */}
                <div className="row mb-4">
                    {/* Payment Status Cards */}
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-success">
                                    <i className="fas fa-check-circle mr-2"></i>
                                    Paid
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <h2 className="font-weight-bold text-success mb-2">
                                    {summary.paid_count?.toLocaleString() || 0}
                                </h2>
                                <p className="text-muted mb-0">Successfully paid installments</p>
                                <div className="progress mt-3" style={{ height: '10px' }}>
                                    <div 
                                        className="progress-bar bg-success" 
                                        style={{ width: `${getPaidPercentage(summary)}%` }}
                                    ></div>
                                </div>
                                <small className="text-muted mt-1 d-block">
                                    {getPaidPercentage(summary).toFixed(1)}% of total
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* Unpaid */}
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-danger">
                                    <i className="fas fa-times-circle mr-2"></i>
                                    Unpaid
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <h2 className="font-weight-bold text-danger mb-2">
                                    {summary.unpaid_count?.toLocaleString() || 0}
                                </h2>
                                <p className="text-muted mb-0">Outstanding installments</p>
                                <div className="progress mt-3" style={{ height: '10px' }}>
                                    <div 
                                        className="progress-bar bg-danger" 
                                        style={{ width: `${getUnpaidPercentage(summary)}%` }}
                                    ></div>
                                </div>
                                <small className="text-muted mt-1 d-block">
                                    {getUnpaidPercentage(summary).toFixed(1)}% of total
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* Late Payments */}
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-warning">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    Late Payments
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <h2 className="font-weight-bold text-warning mb-2">
                                    {summary.late_count?.toLocaleString() || 0}
                                </h2>
                                <p className="text-muted mb-0">Past due date payments</p>
                                <div className="progress mt-3" style={{ height: '10px' }}>
                                    <div 
                                        className="progress-bar bg-warning" 
                                        style={{ width: `${getLatePercentage(summary)}%` }}
                                    ></div>
                                </div>
                                <small className="text-muted mt-1 d-block">
                                    {getLatePercentage(summary).toFixed(1)}% of total
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collection Rate & Financial Summary */}
                <div className="row mb-4">
                    {/* Collection Rate Gauge */}
                    <div className="col-xl-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-pie mr-2"></i>
                                    Collection Rate Analysis
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                <div className="mb-4">
                                    <h1 className={`display-3 font-weight-bold ${getCollectionRateColor(summary.collection_rate)}`}>
                                        {summary.collection_rate || 0}%
                                    </h1>
                                    <p className="text-muted mb-0">Overall Payment Collection Rate</p>
                                </div>
                                
                                {/* Collection Rate Bar */}
                                <div className="progress mb-2" style={{ height: '20px', borderRadius: '10px' }}>
                                    <div 
                                        className={`progress-bar ${getCollectionRateBgColor(summary.collection_rate)}`}
                                        style={{ width: `${Math.min(summary.collection_rate || 0, 100)}%` }}
                                    >
                                        {summary.collection_rate > 0 && `${summary.collection_rate}%`}
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

                    {/* Financial Summary */}
                    <div className="col-xl-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-calculator mr-2"></i>
                                    Financial Summary
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-sm font-weight-bold">
                                            <i className="fas fa-coins text-info mr-2"></i>
                                            Total Amount (All Records)
                                        </span>
                                        <span className="font-weight-bold">{formatRupiah(summary.total_amount)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-sm font-weight-bold">
                                            <i className="fas fa-check-circle text-success mr-2"></i>
                                            Total Paid (Collected)
                                        </span>
                                        <span className="font-weight-bold text-success">{formatRupiah(summary.total_paid)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-sm font-weight-bold">
                                            <i className="fas fa-times-circle text-danger mr-2"></i>
                                            Outstanding Amount
                                        </span>
                                        <span className="font-weight-bold text-danger">
                                            {formatRupiah((summary.total_amount || 0) - (summary.total_paid || 0))}
                                        </span>
                                    </div>
                                </div>

                                <hr />

                                {/* Status Summary */}
                                <div className="row text-center">
                                    <div className="col-4">
                                        <h5 className="font-weight-bold text-success mb-0">
                                            {summary.paid_count?.toLocaleString() || 0}
                                        </h5>
                                        <small className="text-muted">Paid</small>
                                    </div>
                                    <div className="col-4">
                                        <h5 className="font-weight-bold text-danger mb-0">
                                            {summary.unpaid_count?.toLocaleString() || 0}
                                        </h5>
                                        <small className="text-muted">Unpaid</small>
                                    </div>
                                    <div className="col-4">
                                        <h5 className="font-weight-bold text-warning mb-0">
                                            {summary.late_count?.toLocaleString() || 0}
                                        </h5>
                                        <small className="text-muted">Late</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Status Overview */}
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                        <h6 className="m-0 font-weight-bold text-primary">
                            <i className="fas fa-chart-bar mr-2"></i>
                            Payment Status Distribution
                        </h6>
                    </div>
                    <div className="card-body">
                        {summary.total_payments > 0 ? (
                            <>
                                {/* Paid Bar */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="text-sm font-weight-bold text-success">
                                            <i className="fas fa-check-circle mr-1"></i> Paid
                                        </span>
                                        <span className="text-sm font-weight-bold">
                                            {summary.paid_count?.toLocaleString() || 0} payments
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                                        <div 
                                            className="progress-bar bg-success" 
                                            style={{ width: `${getPaidPercentage(summary)}%` }}
                                        >
                                            {getPaidPercentage(summary) > 10 && `${getPaidPercentage(summary).toFixed(1)}%`}
                                        </div>
                                    </div>
                                </div>

                                {/* Unpaid Bar */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="text-sm font-weight-bold text-danger">
                                            <i className="fas fa-times-circle mr-1"></i> Unpaid
                                        </span>
                                        <span className="text-sm font-weight-bold">
                                            {summary.unpaid_count?.toLocaleString() || 0} payments
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                                        <div 
                                            className="progress-bar bg-danger" 
                                            style={{ width: `${getUnpaidPercentage(summary)}%` }}
                                        >
                                            {getUnpaidPercentage(summary) > 10 && `${getUnpaidPercentage(summary).toFixed(1)}%`}
                                        </div>
                                    </div>
                                </div>

                                {/* Late Bar */}
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="text-sm font-weight-bold text-warning">
                                            <i className="fas fa-exclamation-triangle mr-1"></i> Late (Past Due)
                                        </span>
                                        <span className="text-sm font-weight-bold">
                                            {summary.late_count?.toLocaleString() || 0} payments
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '14px', borderRadius: '7px' }}>
                                        <div 
                                            className="progress-bar bg-warning" 
                                            style={{ width: `${getLatePercentage(summary)}%` }}
                                        >
                                            {getLatePercentage(summary) > 10 && `${getLatePercentage(summary).toFixed(1)}%`}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-muted my-4">
                                <i className="fas fa-inbox fa-2x d-block mb-2"></i>
                                No payment data available
                            </p>
                        )}
                    </div>
                    <div className="card-footer bg-light">
                        <small className="text-muted">
                            <i className="fas fa-info-circle mr-1"></i>
                            Total: {summary.total_payments?.toLocaleString() || 0} payment records · 
                            Collection Rate: {summary.collection_rate || 0}%
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
                .progress {
                    border-radius: 10px;
                    background-color: #eaecf4;
                }
            `}</style>
        </MainLayouts>
    );
}