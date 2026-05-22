import React, { useState, useEffect } from 'react';
import MainLayouts from '../../Layouts/MainLayouts';
import api from '../../../services/api';

export default function ApplicationManagement() {
    // Data states
    const [applicationList, setApplicationList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchApplicationList();
    }, []);

    // Alert & Success Banner
    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
    };


    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number || 0);
    };

    const fetchApplicationList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/validator/applications");
            setApplicationList(res.data.applications || []);
        } catch (err) {
            console.error("Failed to fetch application list:", err);
            const errorMsg = err.response?.data?.message || "Failed to load applications";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Filter applications
    const filteredApplications = applicationList.filter(app => {
        const searchLower = searchTerm.toLowerCase();
        return (
            app.society?.name?.toLowerCase().includes(searchLower) ||
            app.society?.id_card_number?.toLowerCase().includes(searchLower) ||
            app.car?.name?.toLowerCase().includes(searchLower) ||
            app.car?.brand?.toLowerCase().includes(searchLower) ||
            app.society?.regional?.province?.toLowerCase().includes(searchLower) ||
            app.society?.regional?.district?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // View detail
    const handleViewDetail = (application) => {
        setSelectedApplication(application);
        setShowDetailModal(true);
    };

    // Open approve modal
    const handleOpenApprove = (application) => {
        setSelectedApplication(application);
        setShowApproveModal(true);
    };

    // Approve application
    const handleApproveApplication = async () => {
        setSubmitting(true);
        try {
            const res = await api.post("/validator/applications/approve", {
                application_id: selectedApplication.id
            });
            
            setShowApproveModal(false);
            setSelectedApplication(null);
            showSuccessBanner(res.data.message || 'Application approved and payment schedule generated!');
            fetchApplicationList();
        } catch (err) {
            console.error("Approve error:", err);
            const responseData = err.response?.data;
            if (responseData?.message) {
                showAlert('Error', responseData.message, 'error');
            } else {
                showAlert('Error', 'Failed to approve application', 'error');
            }
            setShowApproveModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    const getGenderBadge = (gender) => {
        return gender === 'male' ? 'badge-primary' : 'badge-info';
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-times-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            default: return '#17a2b8';
        }
    };

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                        <p className="text-muted">Loading applications...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid">
                {/* Success Banner */}
                {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="fas fa-check-circle mr-2"></i>
                        <strong>Success!</strong> {success}
                        <button type="button" className="close" onClick={() => setSuccess("")}>
                            <span>&times;</span>
                        </button>
                    </div>
                )}
                
                {/* Error Banner */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                        <button type="button" className="close" onClick={() => setError("")}>
                            <span>&times;</span>
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-1 font-weight-bold">
                            <i className="fas fa-file-alt mr-2 text-info"></i>
                            Application Management
                        </h4>
                        <p className="text-muted mb-0">
                            Review and approve pending installment applications
                            {applicationList.length > 0 && (
                                <span className="badge badge-warning ml-2">{applicationList.length} pending</span>
                            )}
                        </p>
                    </div>
                    <button className="btn btn-outline-primary" onClick={fetchApplicationList} title="Refresh data">
                        <i className="fas fa-sync-alt mr-2"></i>Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Apps</div>
                                        <div className="h4 mb-0 font-weight-bold">{applicationList.length}</div>
                                        <small className="text-muted">needs your review</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-hourglass-half fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Total Cars</div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {[...new Set(applicationList.map(a => a.car?.id))].length}
                                        </div>
                                        <small className="text-muted">unique cars applied</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-car fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Avg Tenor</div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {applicationList.length > 0 
                                                ? Math.round(applicationList.reduce((sum, a) => sum + (a.tenor?.month || 0), 0) / applicationList.length)
                                                : 0
                                            } months
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-calendar-alt fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Filtered</div>
                                        <div className="h4 mb-0 font-weight-bold">{filteredApplications.length}</div>
                                        <small className="text-muted">matching criteria</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-filter fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white">
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Search by society name, ID card, car name, brand, or regional..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                    {searchTerm && (
                                        <div className="input-group-append">
                                            <button className="btn btn-outline-secondary" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-4 text-md-right mt-2 mt-md-0">
                                <small className="text-muted">
                                    Showing {currentItems.length} of {filteredApplications.length} applications
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Application Table */}
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4">#</th>
                                        <th>Society</th>
                                        <th>Car</th>
                                        <th className="text-center">Tenor</th>
                                        <th className="text-right">Monthly</th>
                                        <th className="text-right">Total</th>
                                        <th className="text-center pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-file-alt fa-3x text-muted mb-3 d-block"></i>
                                                {searchTerm ? 'No applications found matching your search' : 'No pending applications'}
                                                {!searchTerm && (
                                                    <p className="text-muted">All applications have been processed. Great job!</p>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((app, index) => (
                                            <tr key={app.id}>
                                                <td className="pl-4">{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <span className="font-weight-bold">
                                                        <i className="fas fa-user mr-2 text-primary"></i>
                                                        {app.society?.name || 'N/A'}
                                                    </span>
                                                    <br />
                                                    <small className="text-muted">{app.society?.id_card_number || 'N/A'}</small>
                                                    <br />
                                                    <span className={`badge ${getGenderBadge(app.society?.gender)} text-capitalize`}>
                                                        {app.society?.gender === 'male' ? 'Male' : 'Female'}
                                                    </span>
                                                    {' · '}
                                                    <small>{app.society?.regional?.district || 'N/A'}</small>
                                                </td>
                                                <td>
                                                    <span className="badge badge-primary">{app.car?.brand || 'N/A'}</span>
                                                    <br />
                                                    <span className="font-weight-bold">{app.car?.name || 'N/A'}</span>
                                                    <br />
                                                    <small className="text-muted">{formatRupiah(app.car?.price)}</small>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge badge-info" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                                        {app.tenor?.month || 0} months
                                                    </span>
                                                </td>
                                                <td className="text-right font-weight-bold">
                                                    {formatRupiah(app.tenor?.nominal_per_month)}
                                                </td>
                                                <td className="text-right font-weight-bold text-success">
                                                    {formatRupiah((app.tenor?.nominal_per_month || 0) * (app.tenor?.month || 0))}
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1" 
                                                        onClick={() => handleViewDetail(app)} 
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-success" 
                                                        onClick={() => handleOpenApprove(app)} 
                                                        title="Approve Application"
                                                    >
                                                        <i className="fas fa-check mr-1"></i> Approve
                                                    </button>
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
                                        const showPage = pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
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

            {/* ==================== ALERT MODAL ==================== */}
            {showAlertModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowAlertModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body-custom text-center py-4">
                            <div className="mb-3">
                                <i className={`fas ${getAlertIcon(alertModalConfig.type)}`} style={{ fontSize: '64px', color: getAlertColor(alertModalConfig.type) }}></i>
                            </div>
                            <h5 style={{ color: getAlertColor(alertModalConfig.type) }}>{alertModalConfig.title}</h5>
                            <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{alertModalConfig.message}</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-primary px-4" onClick={() => { setShowAlertModal(false); if (alertModalConfig.onConfirm) alertModalConfig.onConfirm(); }}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && selectedApplication && (
                <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-info text-white">
                            <h5 className="modal-title"><i className="fas fa-info-circle mr-2"></i>Application Detail</h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setSelectedApplication(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            {/* Society Info */}
                            <h6 className="font-weight-bold text-primary mb-3">
                                <i className="fas fa-user mr-2"></i>Society Information
                            </h6>
                            <table className="table table-bordered table-sm mb-4">
                                <tbody>
                                    <tr><th width="35%">Name</th><td>{selectedApplication.society?.name || 'N/A'}</td></tr>
                                    <tr><th>ID Card Number</th><td>{selectedApplication.society?.id_card_number || 'N/A'}</td></tr>
                                    <tr><th>Gender</th><td className="text-capitalize">{selectedApplication.society?.gender || 'N/A'}</td></tr>
                                    <tr><th>Address</th><td>{selectedApplication.society?.address || 'N/A'}</td></tr>
                                    <tr><th>Regional</th><td>{selectedApplication.society?.regional ? `${selectedApplication.society.regional.province}, ${selectedApplication.society.regional.district}` : 'N/A'}</td></tr>
                                </tbody>
                            </table>

                            {/* Car Info */}
                            <h6 className="font-weight-bold text-primary mb-3">
                                <i className="fas fa-car mr-2"></i>Car Information
                            </h6>
                            <table className="table table-bordered table-sm mb-4">
                                <tbody>
                                    <tr><th width="35%">Brand</th><td><span className="badge badge-primary">{selectedApplication.car?.brand || 'N/A'}</span></td></tr>
                                    <tr><th>Car Model</th><td className="font-weight-bold">{selectedApplication.car?.name || 'N/A'}</td></tr>
                                    <tr><th>Price</th><td className="font-weight-bold">{formatRupiah(selectedApplication.car?.price)}</td></tr>
                                </tbody>
                            </table>

                            {/* Tenor Info */}
                            <h6 className="font-weight-bold text-primary mb-3">
                                <i className="fas fa-calendar-alt mr-2"></i>Tenor Information
                            </h6>
                            <table className="table table-bordered table-sm mb-4">
                                <tbody>
                                    <tr><th width="35%">Duration</th><td><span className="badge badge-info">{selectedApplication.tenor?.month || 0} months</span></td></tr>
                                    <tr><th>Monthly Installment</th><td className="font-weight-bold">{formatRupiah(selectedApplication.tenor?.nominal_per_month)}</td></tr>
                                    <tr><th>Total Payment</th><td className="font-weight-bold text-success">{formatRupiah((selectedApplication.tenor?.nominal_per_month || 0) * (selectedApplication.tenor?.month || 0))}</td></tr>
                                </tbody>
                            </table>

                            {/* Notes */}
                            {selectedApplication.notes && (
                                <div className="mb-3">
                                    <h6 className="font-weight-bold text-primary">
                                        <i className="fas fa-sticky-note mr-2"></i>Notes
                                    </h6>
                                    <p className="text-muted">{selectedApplication.notes}</p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="row">
                                <div className="col-md-6">
                                    <small className="text-muted">Applied: {selectedApplication.created_at ? new Date(selectedApplication.created_at).toLocaleString('id-ID') : '-'}</small>
                                </div>
                                <div className="col-md-6 text-right">
                                    <small className="text-muted">Status: <span className="badge badge-warning">pending</span></small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); setSelectedApplication(null); }}>
                                <i className="fas fa-times mr-2"></i>Close
                            </button>
                            <button 
                                className="btn btn-success" 
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleOpenApprove(selectedApplication);
                                }}
                            >
                                <i className="fas fa-check mr-2"></i>Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== APPROVE CONFIRMATION MODAL ==================== */}
            {showApproveModal && selectedApplication && (
                <div className="modal-backdrop-custom" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-success text-white">
                            <h5 className="modal-title"><i className="fas fa-check-circle mr-2"></i>Approve Application</h5>
                            <button className="close-btn text-white" onClick={() => setShowApproveModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-check-circle text-success" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Confirm Approval?</h5>
                            <p className="text-muted">
                                You are about to approve the application for:
                            </p>
                            <div className="border rounded p-3 bg-light mb-3">
                                <strong>{selectedApplication.society?.name}</strong>
                                <br />
                                <small className="text-muted">{selectedApplication.car?.brand} - {selectedApplication.car?.name}</small>
                                <br />
                                <span className="badge badge-info">{selectedApplication.tenor?.month || 0} months</span>
                                {' · '}
                                <strong>{formatRupiah(selectedApplication.tenor?.nominal_per_month)}/month</strong>
                            </div>
                            <p className="text-muted mb-0">
                                <i className="fas fa-info-circle mr-1"></i>
                                A payment schedule will be automatically generated.
                            </p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowApproveModal(false)} disabled={submitting}>
                                <i className="fas fa-times mr-2"></i>Cancel
                            </button>
                            <button className="btn btn-success" onClick={handleApproveApplication} disabled={submitting}>
                                {submitting ? (
                                    <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
                                ) : (
                                    <><i className="fas fa-check mr-2"></i>Yes, Approve</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CUSTOM MODAL STYLES ==================== */}
            <style jsx="true">{`
                .modal-backdrop-custom { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
                .modal-custom { background: white; border-radius: 8px; width: 600px; max-width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
                .modal-sm-custom { width: 450px; }
                .modal-header-custom { padding: 16px 20px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
                .modal-body-custom { padding: 20px; }
                .modal-footer-custom { padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px; }
                .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; color: #666; }
                .close-btn:hover { color: #333; }
                .card { border: none; border-radius: 0.35rem; transition: transform 0.2s ease; }
                .card:hover { transform: translateY(-2px); }
                .table th { border-top: none; font-size: 0.85rem; text-transform: uppercase; }
                .border-left-primary { border-left: 4px solid #4e73df !important; }
                .border-left-success { border-left: 4px solid #1cc88a !important; }
                .border-left-info { border-left: 4px solid #36b9cc !important; }
                .border-left-warning { border-left: 4px solid #f6c23e !important; }
                .text-xs { font-size: 0.7rem; }
                .text-gray-300 { color: #dddfeb !important; }
            `}</style>
        </MainLayouts>
    );
}