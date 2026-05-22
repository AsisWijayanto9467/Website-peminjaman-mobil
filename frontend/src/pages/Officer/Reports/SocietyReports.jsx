import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function SocietyReports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/officer/reports/societies");
            setReport(res.data.report);
        } catch (err) {
            console.error("Failed to fetch society report:", err);
            setError(err.response?.data?.message || "Failed to load society report");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const res = await api.get("/officer/reports/societies", {
                params: { download: 'pdf' },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `society-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

    const getValidationStatusBadge = (status) => {
        switch (status) {
            case 'accepted': return 'badge-success';
            case 'declined': return 'badge-danger';
            case 'pending': return 'badge-warning';
            default: return 'badge-secondary';
        }
    };

    const getGenderBadge = (gender) => {
        return gender === 'male' ? 'badge-primary' : 'badge-info';
    };

    const getApprovalRateColor = (rate) => {
        if (rate >= 70) return 'text-success';
        if (rate >= 40) return 'text-warning';
        return 'text-danger';
    };

    // ✅ Conditional returns SETELAH semua hooks
    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                        <p className="text-muted">Loading society report...</p>
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
    const societies = report?.societies || [];

    // Filter societies
    const filteredSocieties = societies.filter(society => {
        const matchesSearch = searchTerm === '' || 
            society.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            society.id_card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            society.regional?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            society.job?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || society.validation_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredSocieties.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSocieties.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Calculate rates
    const validationRate = summary.total_societies > 0 
        ? ((summary.validated || 0) / summary.total_societies) * 100 
        : 0;
    
    const applicationRate = summary.total_societies > 0 
        ? ((summary.applied_installment || 0) / summary.total_societies) * 100 
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
                    {/* Total Societies */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Societies
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {summary.total_societies?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">registered & validated</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-users fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validated */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Validated
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-success">
                                            {summary.validated?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">accepted validations</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Validation */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                            Pending Validation
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-warning">
                                            {summary.pending_validation?.toLocaleString() || 0}
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

                    {/* Applied Installment */}
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Applied Installment
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold text-info">
                                            {summary.applied_installment?.toLocaleString() || 0}
                                        </div>
                                        <small className="text-muted">submitted applications</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-file-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rates & Statistics */}
                <div className="row mb-4">
                    {/* Validation Rate */}
                    <div className="col-xl-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-chart-pie mr-2"></i>
                                    Validation & Application Rates
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    {/* Validation Rate */}
                                    <div className="col-md-6 text-center mb-3 mb-md-0">
                                        <h1 className={`display-4 font-weight-bold ${getApprovalRateColor(validationRate)}`}>
                                            {validationRate.toFixed(1)}%
                                        </h1>
                                        <p className="text-muted mb-0">Validation Acceptance Rate</p>
                                        <small className="text-muted">
                                            {summary.validated || 0} / {summary.total_societies || 0} societies
                                        </small>
                                        <div className="progress mt-2" style={{ height: '8px' }}>
                                            <div 
                                                className="progress-bar bg-success" 
                                                style={{ width: `${validationRate}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Application Rate */}
                                    <div className="col-md-6 text-center">
                                        <h1 className={`display-4 font-weight-bold ${getApprovalRateColor(applicationRate)}`}>
                                            {applicationRate.toFixed(1)}%
                                        </h1>
                                        <p className="text-muted mb-0">Installment Application Rate</p>
                                        <small className="text-muted">
                                            {summary.applied_installment || 0} / {summary.total_societies || 0} societies
                                        </small>
                                        <div className="progress mt-2" style={{ height: '8px' }}>
                                            <div 
                                                className="progress-bar bg-info" 
                                                style={{ width: `${applicationRate}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div className="col-xl-6 mb-3">
                        <div className="card shadow-sm h-100">
                            <div className="card-header bg-white py-3">
                                <h6 className="m-0 font-weight-bold text-primary">
                                    <i className="fas fa-list-check mr-2"></i>
                                    Society Status Summary
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    <div className="col-4 mb-3">
                                        <div className="border rounded p-3 bg-light">
                                            <h3 className="font-weight-bold text-primary mb-0">
                                                {summary.total_societies?.toLocaleString() || 0}
                                            </h3>
                                            <small className="text-muted">Total</small>
                                        </div>
                                    </div>
                                    <div className="col-4 mb-3">
                                        <div className="border rounded p-3 bg-light">
                                            <h3 className="font-weight-bold text-success mb-0">
                                                {summary.validated?.toLocaleString() || 0}
                                            </h3>
                                            <small className="text-muted">Validated</small>
                                        </div>
                                    </div>
                                    <div className="col-4 mb-3">
                                        <div className="border rounded p-3 bg-light">
                                            <h3 className="font-weight-bold text-warning mb-0">
                                                {summary.pending_validation?.toLocaleString() || 0}
                                            </h3>
                                            <small className="text-muted">Pending</small>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="border rounded p-3 bg-light">
                                            <h4 className="font-weight-bold text-info mb-0">
                                                {summary.applied_installment?.toLocaleString() || 0}
                                            </h4>
                                            <small className="text-muted">Applied for Installment</small>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="border rounded p-3 bg-light">
                                            <h4 className="font-weight-bold text-secondary mb-0">
                                                {(summary.total_societies || 0) - (summary.applied_installment || 0)}
                                            </h4>
                                            <small className="text-muted">Not Applied</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-6 mb-2 mb-md-0">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white">
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Search by name, ID card, regional, or job..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <div className="input-group-append">
                                            <button className="btn btn-outline-secondary" onClick={() => setSearchTerm("")}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-3 mb-2 mb-md-0">
                                <select 
                                    className="form-control"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="declined">Declined</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div className="col-md-3 text-md-right">
                                <small className="text-muted">
                                    Showing {currentItems.length} of {filteredSocieties.length} societies
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Society Table */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4">#</th>
                                        <th>Name</th>
                                        <th>ID Card Number</th>
                                        <th>Gender</th>
                                        <th>Regional</th>
                                        <th>Validation</th>
                                        <th>Job</th>
                                        <th className="text-right">Income</th>
                                        <th className="text-center">Apps</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4">
                                                <i className="fas fa-users-slash fa-2x text-muted mb-2 d-block"></i>
                                                {searchTerm || statusFilter !== 'all' 
                                                    ? 'No societies found matching your filters' 
                                                    : 'No society data available'}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((society, index) => (
                                            <tr key={index}>
                                                <td className="pl-4">{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <span className="font-weight-bold">{society.name}</span>
                                                </td>
                                                <td>
                                                    <code className="text-muted">{society.id_card_number}</code>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getGenderBadge(society.gender)} text-capitalize`}>
                                                        {society.gender === 'male' ? (
                                                            <><i className="fas fa-mars mr-1"></i>Male</>
                                                        ) : (
                                                            <><i className="fas fa-venus mr-1"></i>Female</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small>{society.regional}</small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getValidationStatusBadge(society.validation_status)} text-capitalize`}>
                                                        {society.validation_status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-muted">{society.job}</span>
                                                </td>
                                                <td className="text-right font-weight-bold">
                                                    {formatRupiah(society.income)}
                                                </td>
                                                <td className="text-center">
                                                    {society.total_applications > 0 ? (
                                                        <span className="badge badge-info">
                                                            {society.total_applications}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <div className="card-footer bg-white">
                            <nav>
                                <ul className="pagination justify-content-center mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(1)}>
                                            <i className="fas fa-angle-double-left"></i>
                                        </button>
                                    </li>
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                            <i className="fas fa-angle-left"></i>
                                        </button>
                                    </li>
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        const showPage = pageNum === 1 || pageNum === totalPages || 
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                                        if (showPage) {
                                            return (
                                                <li key={index} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => paginate(pageNum)}>{pageNum}</button>
                                                </li>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <li key={index} className="page-item disabled"><span className="page-link">...</span></li>;
                                        }
                                        return null;
                                    })}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                            <i className="fas fa-angle-right"></i>
                                        </button>
                                    </li>
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(totalPages)}>
                                            <i className="fas fa-angle-double-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
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
                .border-left-warning {
                    border-left: 4px solid #f6c23e !important;
                }
                .border-left-info {
                    border-left: 4px solid #36b9cc !important;
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
                code {
                    background-color: #f8f9fa;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }
            `}</style>
        </MainLayouts>
    );
}