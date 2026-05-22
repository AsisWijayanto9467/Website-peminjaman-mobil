import React, { useState, useEffect } from 'react';
import MainLayouts from '../../Layouts/MainLayouts';
import api from '../../../services/api';

export default function ValidationManagement() {
    // Data states
    const [validationList, setValidationList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showValidateModal, setShowValidateModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });
    const [selectedValidation, setSelectedValidation] = useState(null);
    const [validationDetail, setValidationDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form validate states
    const [validateForm, setValidateForm] = useState({
        validation_id: '',
        status: 'accepted',
        validator_notes: ''
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchValidationList();
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

    const formatBackendErrors = (errors) => {
        if (!errors) return '';
        if (typeof errors === 'string') return errors;
        if (typeof errors === 'object') {
            const messages = [];
            Object.keys(errors).forEach(key => {
                const fieldErrors = errors[key];
                if (Array.isArray(fieldErrors)) messages.push(...fieldErrors);
                else if (typeof fieldErrors === 'string') messages.push(fieldErrors);
            });
            return messages.join('\n');
        }
        return 'An error occurred';
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number || 0);
    };

    const fetchValidationList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/validator/validations");
            setValidationList(res.data.validations || []);
        } catch (err) {
            console.error("Failed to fetch validation list:", err);
            const errorMsg = err.response?.data?.message || "Failed to load validations";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchValidationDetail = async (id) => {
        try {
            const res = await api.get(`/validator/validations/${id}`);
            setValidationDetail(res.data.validation);
        } catch (err) {
            console.error("Failed to fetch validation detail:", err);
            showAlert('Error', err.response?.data?.message || 'Failed to load detail', 'error');
        }
    };

    // Filter validations
    const filteredValidations = validationList.filter(validation => {
        const searchLower = searchTerm.toLowerCase();
        return (
            validation.society?.name?.toLowerCase().includes(searchLower) ||
            validation.society?.id_card_number?.toLowerCase().includes(searchLower) ||
            validation.job?.toLowerCase().includes(searchLower) ||
            validation.society?.regional?.province?.toLowerCase().includes(searchLower) ||
            validation.society?.regional?.district?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredValidations.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredValidations.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // View detail
    const handleViewDetail = async (validation) => {
        setSelectedValidation(validation);
        await fetchValidationDetail(validation.id);
        setShowDetailModal(true);
    };

    // Open validate modal
    const handleOpenValidate = (validation, status) => {
        setSelectedValidation(validation);
        setValidateForm({
            validation_id: validation.id,
            status: status,
            validator_notes: ''
        });
        setFormErrors({});
        setShowValidateModal(true);
    };

    // Handle validate form input
    const handleValidateInputChange = (e) => {
        const { name, value } = e.target;
        setValidateForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Submit validation (approve/decline)
    const handleSubmitValidation = async (e) => {
        e.preventDefault();
        
        if (!validateForm.validator_notes || validateForm.validator_notes.trim().length < 5) {
            setFormErrors({ validator_notes: 'Notes must be at least 5 characters' });
            showAlert('Validation Error', 'Notes must be at least 5 characters', 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const res = await api.post("/validator/validations/validate", validateForm);
            
            setShowValidateModal(false);
            setSelectedValidation(null);
            showSuccessBanner(res.data.message || `Validation has been ${validateForm.status} successfully!`);
            fetchValidationList();
        } catch (err) {
            console.error("Validate error:", err);
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Error', formatBackendErrors(responseData.errors), 'error');
            } else if (responseData?.message) {
                showAlert('Error', responseData.message, 'error');
            } else {
                showAlert('Error', 'Failed to process validation', 'error');
            }
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
                        <p className="text-muted">Loading validations...</p>
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
                            <i className="fas fa-check-circle mr-2 text-success"></i>
                            Validation Management
                        </h4>
                        <p className="text-muted mb-0">
                            Review and process pending society validations
                            {validationList.length > 0 && (
                                <span className="badge badge-warning ml-2">{validationList.length} pending</span>
                            )}
                        </p>
                    </div>
                    <button className="btn btn-outline-primary" onClick={fetchValidationList} title="Refresh data">
                        <i className="fas fa-sync-alt mr-2"></i>Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Pending Validations</div>
                                        <div className="h4 mb-0 font-weight-bold">{validationList.length}</div>
                                        <small className="text-muted">needs your review</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-left-info shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Filtered</div>
                                        <div className="h4 mb-0 font-weight-bold">{filteredValidations.length}</div>
                                        <small className="text-muted">matching criteria</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-filter fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Showing</div>
                                        <div className="h4 mb-0 font-weight-bold">{currentItems.length}</div>
                                        <small className="text-muted">on this page</small>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-eye fa-2x text-gray-300"></i>
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
                                        placeholder="Search by name, ID card, job, or regional..."
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
                                    Showing {currentItems.length} of {filteredValidations.length} validations
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validation Table */}
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4">#</th>
                                        <th>Society Name</th>
                                        <th>ID Card Number</th>
                                        <th>Regional</th>
                                        <th>Job</th>
                                        <th className="text-right">Income</th>
                                        <th className="text-center pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-check-circle fa-3x text-muted mb-3 d-block"></i>
                                                {searchTerm ? 'No validations found matching your search' : 'No pending validations'}
                                                {!searchTerm && (
                                                    <p className="text-muted">All validations have been processed. Great job!</p>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((validation, index) => (
                                            <tr key={validation.id}>
                                                <td className="pl-4">{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <span className="font-weight-bold">
                                                        <i className="fas fa-user mr-2 text-primary"></i>
                                                        {validation.society?.name || 'N/A'}
                                                    </span>
                                                    <br />
                                                    <span className={`badge ${getGenderBadge(validation.society?.gender)} text-capitalize`}>
                                                        {validation.society?.gender === 'male' ? (
                                                            <><i className="fas fa-mars mr-1"></i>Male</>
                                                        ) : (
                                                            <><i className="fas fa-venus mr-1"></i>Female</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <code className="text-muted">{validation.society?.id_card_number || 'N/A'}</code>
                                                </td>
                                                <td>
                                                    <small>
                                                        {validation.society?.regional ? 
                                                            `${validation.society.regional.province}, ${validation.society.regional.district}` 
                                                            : 'N/A'
                                                        }
                                                    </small>
                                                </td>
                                                <td>
                                                    <span className="badge badge-secondary">{validation.job || 'N/A'}</span>
                                                </td>
                                                <td className="text-right font-weight-bold">
                                                    {formatRupiah(validation.income)}
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1" 
                                                        onClick={() => handleViewDetail(validation)} 
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-success mr-1" 
                                                        onClick={() => handleOpenValidate(validation, 'accepted')} 
                                                        title="Approve"
                                                    >
                                                        <i className="fas fa-check"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger" 
                                                        onClick={() => handleOpenValidate(validation, 'declined')} 
                                                        title="Decline"
                                                    >
                                                        <i className="fas fa-times"></i>
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
            {showDetailModal && validationDetail && (
                <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-info text-white">
                            <h5 className="modal-title"><i className="fas fa-info-circle mr-2"></i>Validation Detail</h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setValidationDetail(null); }}>
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
                                    <tr><th width="35%">Name</th><td>{validationDetail.society?.name || 'N/A'}</td></tr>
                                    <tr><th>ID Card Number</th><td>{validationDetail.society?.id_card_number || 'N/A'}</td></tr>
                                    <tr><th>Born Date</th><td>{validationDetail.society?.born_date || 'N/A'}</td></tr>
                                    <tr><th>Gender</th><td className="text-capitalize">{validationDetail.society?.gender || 'N/A'}</td></tr>
                                    <tr><th>Address</th><td>{validationDetail.society?.address || 'N/A'}</td></tr>
                                    <tr><th>Regional</th><td>{validationDetail.society?.regional ? `${validationDetail.society.regional.province}, ${validationDetail.society.regional.district}` : 'N/A'}</td></tr>
                                </tbody>
                            </table>

                            {/* Validation Info */}
                            <h6 className="font-weight-bold text-primary mb-3">
                                <i className="fas fa-clipboard-check mr-2"></i>Validation Information
                            </h6>
                            <table className="table table-bordered table-sm mb-4">
                                <tbody>
                                    <tr><th width="35%">Job</th><td>{validationDetail.job || 'N/A'}</td></tr>
                                    <tr><th>Job Description</th><td>{validationDetail.job_description || 'N/A'}</td></tr>
                                    <tr><th>Income</th><td className="font-weight-bold">{formatRupiah(validationDetail.income)}</td></tr>
                                    <tr><th>Status</th><td><span className={`badge badge-${validationDetail.status === 'accepted' ? 'success' : validationDetail.status === 'declined' ? 'danger' : 'warning'}`}>{validationDetail.status}</span></td></tr>
                                    {validationDetail.reason_accepted && (
                                        <tr><th>Reason</th><td>{validationDetail.reason_accepted}</td></tr>
                                    )}
                                    {validationDetail.validator_notes && (
                                        <tr><th>Validator Notes</th><td>{validationDetail.validator_notes}</td></tr>
                                    )}
                                    {validationDetail.validator && (
                                        <tr><th>Validated By</th><td>{validationDetail.validator.name}</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Timestamps */}
                            <div className="row">
                                <div className="col-md-6">
                                    <small className="text-muted">Created: {validationDetail.created_at ? new Date(validationDetail.created_at).toLocaleString('id-ID') : '-'}</small>
                                </div>
                                <div className="col-md-6 text-right">
                                    <small className="text-muted">Updated: {validationDetail.updated_at ? new Date(validationDetail.updated_at).toLocaleString('id-ID') : '-'}</small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); setValidationDetail(null); }}>
                                <i className="fas fa-times mr-2"></i>Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== VALIDATE MODAL ==================== */}
            {showValidateModal && selectedValidation && (
                <div className="modal-backdrop-custom" onClick={() => setShowValidateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className={`modal-header-custom ${validateForm.status === 'accepted' ? 'bg-success' : 'bg-danger'} text-white`}>
                            <h5 className="modal-title">
                                <i className={`fas fa-${validateForm.status === 'accepted' ? 'check' : 'times'}-circle mr-2`}></i>
                                {validateForm.status === 'accepted' ? 'Approve' : 'Decline'} Validation
                            </h5>
                            <button className="close-btn text-white" onClick={() => setShowValidateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitValidation}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    You are about to <strong>{validateForm.status}</strong> validation for:
                                    <br />
                                    <strong>{selectedValidation.society?.name}</strong> ({selectedValidation.society?.id_card_number})
                                </div>

                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-sticky-note mr-1"></i>
                                        Validator Notes <span className="text-danger">*</span>
                                    </label>
                                    <textarea 
                                        name="validator_notes" 
                                        className={`form-control ${formErrors.validator_notes ? 'is-invalid' : ''}`}
                                        value={validateForm.validator_notes}
                                        onChange={handleValidateInputChange}
                                        rows="4"
                                        placeholder={`Enter reason for ${validateForm.status === 'accepted' ? 'approving' : 'declining'} this validation (min. 5 characters)...`}
                                        required
                                    ></textarea>
                                    {formErrors.validator_notes && (
                                        <div className="invalid-feedback">{formErrors.validator_notes}</div>
                                    )}
                                    <small className="text-muted">
                                        {validateForm.validator_notes.length}/5 minimum characters
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowValidateModal(false)} disabled={submitting}>
                                    <i className="fas fa-times mr-2"></i>Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className={`btn ${validateForm.status === 'accepted' ? 'btn-success' : 'btn-danger'}`} 
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
                                    ) : (
                                        <><i className={`fas fa-${validateForm.status === 'accepted' ? 'check' : 'times'} mr-2`}></i>
                                        {validateForm.status === 'accepted' ? 'Approve' : 'Decline'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
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
                code { background-color: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
            `}</style>
        </MainLayouts>
    );
}