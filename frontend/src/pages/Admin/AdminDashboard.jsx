import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import MainLayouts from '../Layouts/MainLayouts';

export default function AdminDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/dashboard");
            setDashboard(res.data.dashboard);
        } catch (err) {
            console.error("Failed to fetch dashboard:", err);
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

    if (error && !dashboard) {
        return (
            <MainLayouts>
                <div className="container-fluid">
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                        <button className="btn btn-sm btn-outline-danger ml-3" onClick={fetchDashboard}>
                            <i className="fas fa-redo mr-1"></i> Retry
                        </button>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid">
                {/* Page Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1 font-weight-bold">Admin Dashboard</h4>
                        <p className="text-muted mb-0">System overview and statistics</p>
                    </div>
                    <div>
                        <button 
                            className="btn btn-outline-primary" 
                            onClick={fetchDashboard}
                            title="Refresh data"
                        >
                            <i className="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards Row 1 */}
                <div className="row">
                    {/* Total Societies */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Societies
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {dashboard?.total_societies?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-users fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Validators */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Total Validators
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {dashboard?.total_validators?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-user-check fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Cars */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Total Cars
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-gray-800">
                                            {dashboard?.total_cars?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-car fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="col-xl-3 col-md-6 mb-4">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Total Revenue
                                        </div>
                                        <div className="h5 mb-0 font-weight-bold text-gray-800">
                                            {formatCurrency(dashboard?.total_revenue)}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Row 2 */}
                <div className="row">
                    {/* Pending Validations */}
                    <div className="col-xl-6 col-md-6 mb-4">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-clock mr-2"></i>
                                    Pending Items
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-sm font-weight-bold">Pending Validations</span>
                                        <span className="badge badge-warning badge-pill" style={{ fontSize: '0.9rem' }}>
                                            {dashboard?.pending_validations || 0}
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div 
                                            className="progress-bar bg-warning" 
                                            style={{ 
                                                width: dashboard?.total_societies ? 
                                                    `${(dashboard.pending_validations / dashboard.total_societies) * 100}%` : '0%' 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-sm font-weight-bold">Pending Applications</span>
                                        <span className="badge badge-danger badge-pill" style={{ fontSize: '0.9rem' }}>
                                            {dashboard?.pending_applications || 0}
                                        </span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div 
                                            className="progress-bar bg-danger" 
                                            style={{ 
                                                width: dashboard?.total_cars ? 
                                                    `${(dashboard.pending_applications / dashboard.total_cars) * 100}%` : '0%' 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-xl-6 col-md-6 mb-4">
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
                                        <Link 
                                            to="/admin/reports/validations" 
                                            className="btn btn-outline-primary btn-block text-left py-3"
                                        >
                                            <i className="fas fa-clipboard-check mr-2"></i>
                                            Validation Reports
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link 
                                            to="/admin/reports/installments" 
                                            className="btn btn-outline-success btn-block text-left py-3"
                                        >
                                            <i className="fas fa-file-invoice-dollar mr-2"></i>
                                            Installment Reports
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link 
                                            to="/admin/staff" 
                                            className="btn btn-outline-info btn-block text-left py-3"
                                        >
                                            <i className="fas fa-users-cog mr-2"></i>
                                            Staff Management
                                        </Link>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <Link 
                                            to="/validations" 
                                            className="btn btn-outline-warning btn-block text-left py-3"
                                        >
                                            <i className="fas fa-tasks mr-2"></i>
                                            Manage Validations
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                .badge-pill {
                    padding-right: 0.6em;
                    padding-left: 0.6em;
                }
            `}</style>
        </MainLayouts>
    );
}