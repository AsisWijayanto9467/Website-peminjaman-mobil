import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayouts from '../Layouts/MainLayouts';
import api from '../../services/api';

export default function OfficerDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");
            
            // Fetch multiple reports in parallel untuk ringkasan
            const [carsRes, paymentsRes, societiesRes, validationsRes, applicationsRes] = await Promise.all([
                api.get("/officer/reports/cars"),
                api.get("/officer/reports/payments"),
                api.get("/officer/reports/societies"),
                api.get("/officer/reports/validations"),
                api.get("/officer/reports/applications")
            ]);

            setDashboardData({
                cars: carsRes.data.report,
                payments: paymentsRes.data.report,
                societies: societiesRes.data.report,
                validations: validationsRes.data.report,
                applications: applicationsRes.data.report
            });

        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError(err.response?.data?.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getApprovalRateColor = (rate) => {
        if (rate >= 70) return 'text-success';
        if (rate >= 40) return 'text-warning';
        return 'text-danger';
    };

    const getCollectionRateColor = (rate) => {
        if (rate >= 80) return 'text-success';
        if (rate >= 50) return 'text-warning';
        return 'text-danger';
    };

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                        <p className="text-muted">Loading dashboard...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    if (error && !dashboardData) {
        return (
            <MainLayouts>
                <div className="container-fluid">
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                        <button className="btn btn-sm btn-outline-danger ml-3" onClick={fetchDashboardData}>
                            <i className="fas fa-redo mr-1"></i> Retry
                        </button>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    const carsSummary = dashboardData?.cars?.summary || {};
    const paymentsSummary = dashboardData?.payments?.summary || {};
    const societiesSummary = dashboardData?.societies?.summary || {};
    const validationsSummary = dashboardData?.validations?.summary || {};
    const applicationsSummary = dashboardData?.applications?.summary || {};

    return (
        <MainLayouts>
            <div className="container-fluid">
                {/* Page Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1 font-weight-bold">
                            <i className="fas fa-tachometer-alt mr-2 text-primary"></i>
                            Officer Dashboard
                        </h4>
                        <p className="text-muted mb-0">Overview of system statistics and performance</p>
                    </div>
                    <div>
                        <button 
                            className="btn btn-outline-primary" 
                            onClick={fetchDashboardData}
                            title="Refresh data"
                        >
                            <i className="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Row 1 - Key Metrics */}
                <div className="row">
                    {/* Total Cars */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Cars
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {carsSummary.total_cars?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">
                                            {carsSummary.total_brands || 0} brands · {carsSummary.total_tenors || 0} tenors
                                        </small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-car fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Societies */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Total Societies
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {societiesSummary.total_societies?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">
                                            {societiesSummary.applied_installment || 0} applied for installment
                                        </small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-users fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validation Stats */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Validations
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {validationsSummary.total_validations?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">
                                            <span className="text-success">{validationsSummary.accepted || 0} accepted</span>
                                            {' · '}
                                            <span className="text-danger">{validationsSummary.declined || 0} declined</span>
                                            {' · '}
                                            <span className="text-warning">{validationsSummary.pending || 0} pending</span>
                                        </small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clipboard-check fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Applications Stats */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Applications
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {applicationsSummary.total_applications?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">
                                            <span className="text-success">{applicationsSummary.accepted || 0} accepted</span>
                                            {' · '}
                                            <span className="text-danger">{applicationsSummary.rejected || 0} rejected</span>
                                            {' · '}
                                            <span className="text-warning">{applicationsSummary.pending || 0} pending</span>
                                        </small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-file-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2 - Rates & Payment Info */}
                <div className="row">
                    {/* Acceptance & Approval Rates */}
                    <div className="col-xl-4 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-pie mr-2"></i>
                                    Approval Rates
                                </h6>
                            </div>
                            <div className="card-body">
                                {/* Validation Acceptance Rate */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="text-sm font-weight-bold">Validation Acceptance</span>
                                        <span className={`font-weight-bold ${getApprovalRateColor(validationsSummary.acceptance_rate)}`}>
                                            {validationsSummary.acceptance_rate || 0}%
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div 
                                            className="progress-bar bg-success" 
                                            style={{ width: `${validationsSummary.acceptance_rate || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Application Approval Rate */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="text-sm font-weight-bold">Application Approval</span>
                                        <span className={`font-weight-bold ${getApprovalRateColor(applicationsSummary.approval_rate)}`}>
                                            {applicationsSummary.approval_rate || 0}%
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div 
                                            className="progress-bar bg-info" 
                                            style={{ width: `${applicationsSummary.approval_rate || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Payment Collection Rate */}
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="text-sm font-weight-bold">Payment Collection</span>
                                        <span className={`font-weight-bold ${getCollectionRateColor(paymentsSummary.collection_rate)}`}>
                                            {paymentsSummary.collection_rate || 0}%
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div 
                                            className={`progress-bar ${(paymentsSummary.collection_rate || 0) >= 80 ? 'bg-success' : (paymentsSummary.collection_rate || 0) >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                            style={{ width: `${paymentsSummary.collection_rate || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="col-xl-4 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-money-bill-wave mr-2"></i>
                                    Payment Summary
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="mb-4 text-center">
                                    <h2 className="font-weight-bold text-success mb-0">
                                        {formatCurrency(paymentsSummary.total_paid)}
                                    </h2>
                                    <small className="text-muted">Total Paid Amount</small>
                                </div>
                                
                                <div className="row text-center">
                                    <div className="col-4">
                                        <h5 className="font-weight-bold text-success mb-0">
                                            {paymentsSummary.paid_count?.toLocaleString() || 0}
                                        </h5>
                                        <small className="text-muted">Paid</small>
                                    </div>
                                    <div className="col-4">
                                        <h5 className="font-weight-bold text-danger mb-0">
                                            {paymentsSummary.unpaid_count?.toLocaleString() || 0}
                                        </h5>
                                        <small className="text-muted">Unpaid</small>
                                    </div>
                                    <div className="col-4">
                                        <h5 className="font-weight-bold text-warning mb-0">
                                            {paymentsSummary.late_count?.toLocaleString() || 0}
                                        </h5>
                                        <small className="text-muted">Late</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-xl-4 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-bolt mr-2"></i>
                                    Quick Actions
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/brand" className="btn btn-outline-primary btn-block text-left py-2">
                                            <i className="fas fa-trademark mr-2"></i>
                                            Brands
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/regional" className="btn btn-outline-success btn-block text-left py-2">
                                            <i className="fas fa-map-marker-alt mr-2"></i>
                                            Regionals
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/cars" className="btn btn-outline-info btn-block text-left py-2">
                                            <i className="fas fa-car mr-2"></i>
                                            Cars
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/tenor" className="btn btn-outline-warning btn-block text-left py-2">
                                            <i className="fas fa-calendar-alt mr-2"></i>
                                            Tenors
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/application/report" className="btn btn-outline-danger btn-block text-left py-2">
                                            <i className="fas fa-file-alt mr-2"></i>
                                            Applications
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/validation/report" className="btn btn-outline-secondary btn-block text-left py-2">
                                            <i className="fas fa-clipboard-check mr-2"></i>
                                            Validations
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/payments/report" className="btn btn-outline-success btn-block text-left py-2">
                                            <i className="fas fa-money-bill-wave mr-2"></i>
                                            Payments
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/officer/society/report" className="btn btn-outline-primary btn-block text-left py-2">
                                            <i className="fas fa-users mr-2"></i>
                                            Societies
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3 - Validation & Application Status Distribution */}
                <div className="row">
                    {/* Validation Status Distribution */}
                    <div className="col-xl-6 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-bar mr-2"></i>
                                    Validation Status Distribution
                                </h6>
                            </div>
                            <div className="card-body">
                                {validationsSummary.total_validations > 0 ? (
                                    <>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-success">Accepted</span>
                                                <span className="text-sm">{validationsSummary.accepted || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div className="progress-bar bg-success" 
                                                    style={{ width: `${((validationsSummary.accepted || 0) / validationsSummary.total_validations) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-danger">Declined</span>
                                                <span className="text-sm">{validationsSummary.declined || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div className="progress-bar bg-danger" 
                                                    style={{ width: `${((validationsSummary.declined || 0) / validationsSummary.total_validations) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-warning">Pending</span>
                                                <span className="text-sm">{validationsSummary.pending || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div className="progress-bar bg-warning" 
                                                    style={{ width: `${((validationsSummary.pending || 0) / validationsSummary.total_validations) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-muted my-4">No validation data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Application Status Distribution */}
                    <div className="col-xl-6 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-bar mr-2"></i>
                                    Application Status Distribution
                                </h6>
                            </div>
                            <div className="card-body">
                                {applicationsSummary.total_applications > 0 ? (
                                    <>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-success">Accepted</span>
                                                <span className="text-sm">{applicationsSummary.accepted || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div className="progress-bar bg-success" 
                                                    style={{ width: `${((applicationsSummary.accepted || 0) / applicationsSummary.total_applications) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-danger">Rejected</span>
                                                <span className="text-sm">{applicationsSummary.rejected || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div className="progress-bar bg-danger" 
                                                    style={{ width: `${((applicationsSummary.rejected || 0) / applicationsSummary.total_applications) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-sm font-weight-bold text-warning">Pending</span>
                                                <span className="text-sm">{applicationsSummary.pending || 0}</span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div className="progress-bar bg-warning" 
                                                    style={{ width: `${((applicationsSummary.pending || 0) / applicationsSummary.total_applications) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-muted my-4">No application data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center mt-2 mb-4">
                    <small className="text-muted">
                        <i className="fas fa-sync-alt mr-1"></i>
                        Last updated: {new Date().toLocaleString('id-ID')}
                        {' | '}
                        <button className="btn btn-link btn-sm p-0" onClick={fetchDashboardData}>
                            <i className="fas fa-redo mr-1"></i>Refresh
                        </button>
                    </small>
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
                .text-gray-800 {
                    color: #5a5c69 !important;
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
                .progress {
                    border-radius: 10px;
                    background-color: #eaecf4;
                }
            `}</style>
        </MainLayouts>
    );
}