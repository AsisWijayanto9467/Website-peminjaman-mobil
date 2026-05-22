import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayouts from '../Layouts/MainLayouts';
import api from '../../services/api';

export default function ValidatorDashboard() {
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
            
            // Fetch validations and applications reports in parallel
            const [validationsRes, applicationsRes] = await Promise.all([
                api.get("/validator/reports/validations"),
                api.get("/validator/reports/installments")
            ]);

            setDashboardData({
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

    const validationsSummary = dashboardData?.validations?.summary || {};
    const applicationsSummary = dashboardData?.applications?.summary || {};

    return (
        <MainLayouts>
            <div className="container-fluid">
                {/* Page Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1 font-weight-bold">
                            <i className="fas fa-tachometer-alt mr-2 text-success"></i>
                            Validator Dashboard
                        </h4>
                        <p className="text-muted mb-0">
                            Overview of validations and applications
                            {dashboardData?.validations?.generated_by && (
                                <span> · Welcome, <strong>{dashboardData.validations.generated_by}</strong></span>
                            )}
                        </p>
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
                    {/* Total Validations */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Validations
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {validationsSummary.total_validations?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accepted Validations */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Accepted
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {validationsSummary.accepted?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">
                                            {validationsSummary.acceptance_rate || 0}% acceptance rate
                                        </small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Declined Validations */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-danger shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                            Declined
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {validationsSummary.declined?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-times-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Validations */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Pending
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {validationsSummary.pending?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">needs your attention</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2 - Application Stats */}
                <div className="row">
                    {/* Total Applications */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Total Applications
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {applicationsSummary.total_applications?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-file-invoice fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accepted Applications */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Approved
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {applicationsSummary.accepted?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">
                                            {applicationsSummary.approval_rate || 0}% approval rate
                                        </small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-thumbs-up fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rejected Applications */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-danger shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                            Rejected
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {applicationsSummary.rejected?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-thumbs-down fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Applications */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Pending Approval
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {applicationsSummary.pending?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">needs your review</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-hourglass-half fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3 - Rates & Status Distribution */}
                <div className="row">
                    {/* Acceptance & Approval Rates */}
                    <div className="col-xl-4 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-success">
                                    <i className="fas fa-chart-pie mr-2"></i>
                                    Performance Rates
                                </h6>
                            </div>
                            <div className="card-body text-center">
                                {/* Validation Acceptance Rate */}
                                <div className="mb-4">
                                    <h1 className={`display-4 font-weight-bold ${getApprovalRateColor(validationsSummary.acceptance_rate)}`}>
                                        {validationsSummary.acceptance_rate || 0}%
                                    </h1>
                                    <p className="text-muted mb-0">Validation Acceptance Rate</p>
                                    <small className="text-muted">
                                        {validationsSummary.accepted || 0} of {validationsSummary.total_validations || 0} validations
                                    </small>
                                </div>
                                <hr />
                                {/* Application Approval Rate */}
                                <div>
                                    <h1 className={`display-4 font-weight-bold ${getApprovalRateColor(applicationsSummary.approval_rate)}`}>
                                        {applicationsSummary.approval_rate || 0}%
                                    </h1>
                                    <p className="text-muted mb-0">Application Approval Rate</p>
                                    <small className="text-muted">
                                        {applicationsSummary.accepted || 0} of {applicationsSummary.total_applications || 0} applications
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validation Status Distribution */}
                    <div className="col-xl-4 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-bar mr-2"></i>
                                    Validation Status
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
                    <div className="col-xl-4 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-info">
                                    <i className="fas fa-chart-bar mr-2"></i>
                                    Application Status
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

                {/* Row 4 - Pending Items Alert & Quick Actions */}
                <div className="row">
                    {/* Pending Items Alert */}
                    <div className="col-xl-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-warning">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    Items Needing Attention
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    <div className="col-6 mb-3">
                                        <div className="border rounded p-3 bg-light">
                                            <h3 className="font-weight-bold text-warning mb-0">
                                                {validationsSummary.pending?.toLocaleString() || 0}
                                            </h3>
                                            <small className="text-muted">Pending Validations</small>
                                            <br />
                                            <Link to="/validator/validations" className="btn btn-sm btn-outline-warning mt-2">
                                                <i className="fas fa-arrow-right mr-1"></i> Process
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <div className="border rounded p-3 bg-light">
                                            <h3 className="font-weight-bold text-warning mb-0">
                                                {applicationsSummary.pending?.toLocaleString() || 0}
                                            </h3>
                                            <small className="text-muted">Pending Applications</small>
                                            <br />
                                            <Link to="/validator/applications" className="btn btn-sm btn-outline-warning mt-2">
                                                <i className="fas fa-arrow-right mr-1"></i> Review
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                {(validationsSummary.pending > 0 || applicationsSummary.pending > 0) && (
                                    <div className="alert alert-warning mb-0">
                                        <i className="fas fa-bell mr-2"></i>
                                        You have <strong>{(validationsSummary.pending || 0) + (applicationsSummary.pending || 0)}</strong> pending items that need your attention.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-xl-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-success">
                                    <i className="fas fa-bolt mr-2"></i>
                                    Quick Actions
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <Link to="/validator/validations" className="btn btn-outline-success btn-block text-left py-3">
                                            <i className="fas fa-check-circle mr-2"></i>
                                            Manage Validations
                                            {validationsSummary.pending > 0 && (
                                                <span className="badge badge-warning ml-2">{validationsSummary.pending}</span>
                                            )}
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/validator/applications" className="btn btn-outline-info btn-block text-left py-3">
                                            <i className="fas fa-file-alt mr-2"></i>
                                            Manage Applications
                                            {applicationsSummary.pending > 0 && (
                                                <span className="badge badge-warning ml-2">{applicationsSummary.pending}</span>
                                            )}
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/validator/validation/report" className="btn btn-outline-primary btn-block text-left py-3">
                                            <i className="fas fa-clipboard-check mr-2"></i>
                                            Validation Reports
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link to="/validator/installment/report" className="btn btn-outline-secondary btn-block text-left py-3">
                                            <i className="fas fa-chart-bar mr-2"></i>
                                            Installment Reports
                                        </Link>
                                    </div>
                                </div>
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
                .border-left-danger {
                    border-left: 4px solid #e74a3b !important;
                }
                .border-left-warning {
                    border-left: 4px solid #f6c23e !important;
                }
                .border-left-info {
                    border-left: 4px solid #36b9cc !important;
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