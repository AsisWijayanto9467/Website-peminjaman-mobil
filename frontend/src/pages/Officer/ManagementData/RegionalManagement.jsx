import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function RegionalManagement() {
    // Data states
    const [regionalList, setRegionalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });
    const [selectedRegional, setSelectedRegional] = useState(null);
    const [regionalDetail, setRegionalDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        province: '',
        district: ''
    });
    
    const [editFormData, setEditFormData] = useState({
        province: '',
        district: ''
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchRegionalList();
    }, []);

    // Fungsi untuk menampilkan alert modal
    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({
            title,
            message,
            type,
            onConfirm
        });
        setShowAlertModal(true);
    };

    // Fungsi untuk menampilkan success banner (auto close setelah 3 detik)
    const showSuccessBanner = (message) => {
        setSuccess(message);
        // Auto hide setelah 3 detik
        setTimeout(() => {
            setSuccess("");
        }, 3000);
    };

    // Fungsi untuk format error message dari backend
    const formatBackendErrors = (errors) => {
        if (!errors) return '';
        
        if (typeof errors === 'string') return errors;
        
        if (typeof errors === 'object') {
            const messages = [];
            Object.keys(errors).forEach(key => {
                const fieldErrors = errors[key];
                if (Array.isArray(fieldErrors)) {
                    messages.push(...fieldErrors);
                } else if (typeof fieldErrors === 'string') {
                    messages.push(fieldErrors);
                }
            });
            return messages.join('\n');
        }
        
        return 'An error occurred';
    };

    const fetchRegionalList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/officer/regionals");
            
            if (res.data.success) {
                setRegionalList(res.data.data || []);
            } else {
                setRegionalList([]);
            }
        } catch (err) {
            console.error("Failed to fetch regional list:", err);
            const errorMsg = err.response?.data?.message || "Failed to load regional data";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegionalDetail = async (id) => {
        try {
            const res = await api.get(`/officer/regionals/${id}`);
            if (res.data.success) {
                setRegionalDetail(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch regional detail:", err);
            const errorMsg = err.response?.data?.message || 'Failed to load regional detail';
            showAlert('Error', errorMsg, 'error');
        }
    };

    // Filter regional based on search term
    const filteredRegionals = regionalList.filter(regional => {
        const searchLower = searchTerm.toLowerCase();
        return (
            regional.province?.toLowerCase().includes(searchLower) ||
            regional.district?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredRegionals.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRegionals.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Reset form
    const resetForm = () => {
        setFormData({
            province: '',
            district: ''
        });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({
            province: '',
            district: ''
        });
        setFormErrors({});
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validasi form create
    const validateForm = (data) => {
        const errors = {};
        
        if (!data.province || data.province.trim() === '') {
            errors.province = 'Province is required';
        }
        if (!data.district || data.district.trim() === '') {
            errors.district = 'District is required';
        }
        
        return errors;
    };

    // Create regional
    const handleCreateRegional = async (e) => {
        e.preventDefault();
        
        // Validasi client-side
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            const errorMessages = Object.values(validationErrors).join('\n');
            showAlert('Validation Error', errorMessages, 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const res = await api.post("/officer/regionals", formData);
            
            if (res.data.success) {
                // TUTUP MODAL LANGSUNG
                setShowCreateModal(false);
                resetForm();
                
                // TAMPILKAN SUCCESS BANNER
                showSuccessBanner(res.data.message || 'Regional data added successfully!');
                
                // REFRESH DATA
                fetchRegionalList();
            } else {
                showAlert('Error', res.data.message || 'Failed to add regional data', 'error');
            }
        } catch (err) {
            console.error("Create error:", err);
            
            const responseData = err.response?.data;
            
            if (responseData?.errors) {
                if (typeof responseData.errors === 'object') {
                    setFormErrors(responseData.errors);
                    const errorMsg = formatBackendErrors(responseData.errors);
                    showAlert('Validation Error', errorMsg, 'warning');
                } else {
                    showAlert('Error', responseData.errors, 'error');
                }
            } else if (responseData?.message) {
                showAlert('Error', responseData.message, 'error');
            } else {
                showAlert('Error', 'Failed to add regional data. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Open edit modal
    const handleEditClick = (regional) => {
        setSelectedRegional(regional);
        setEditFormData({
            province: regional.province || '',
            district: regional.district || ''
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update regional
    const handleUpdateRegional = async (e) => {
        e.preventDefault();
        
        // Validasi client-side
        const validationErrors = validateForm(editFormData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            const errorMessages = Object.values(validationErrors).join('\n');
            showAlert('Validation Error', errorMessages, 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const res = await api.put(`/officer/regionals/${selectedRegional.id}`, editFormData);
            
            if (res.data.success) {
                // TUTUP MODAL LANGSUNG
                setShowEditModal(false);
                setSelectedRegional(null);
                resetEditForm();
                
                // TAMPILKAN SUCCESS BANNER
                showSuccessBanner(res.data.message || 'Regional data updated successfully!');
                
                // REFRESH DATA
                fetchRegionalList();
            } else {
                showAlert('Error', res.data.message || 'Failed to update regional data', 'error');
            }
        } catch (err) {
            console.error("Update error:", err);
            
            const responseData = err.response?.data;
            
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                const errorMsg = formatBackendErrors(responseData.errors);
                showAlert('Error', errorMsg, 'error');
            } else if (responseData?.message) {
                showAlert('Error', responseData.message, 'error');
            } else {
                showAlert('Error', 'Failed to update regional data', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Delete regional
    const handleDeleteClick = (regional) => {
        setSelectedRegional(regional);
        setShowDeleteModal(true);
    };

    const handleDeleteRegional = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/officer/regionals/${selectedRegional.id}`);
            
            if (res.data.success) {
                // TUTUP MODAL LANGSUNG
                setShowDeleteModal(false);
                setSelectedRegional(null);
                
                // TAMPILKAN SUCCESS BANNER
                showSuccessBanner(res.data.message || 'Regional data deleted successfully!');
                
                // REFRESH DATA
                fetchRegionalList();
            } else {
                showAlert('Error', res.data.message || 'Failed to delete regional data', 'error');
                setShowDeleteModal(false);
            }
        } catch (err) {
            console.error("Delete error:", err);
            
            const responseData = err.response?.data;
            const errorMsg = responseData?.message || 'Failed to delete regional data';
            
            showAlert('Error', errorMsg, 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (regional) => {
        setSelectedRegional(regional);
        await fetchRegionalDetail(regional.id);
        setShowDetailModal(true);
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
                        <p className="text-muted">Loading regional data...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid">
                {/* Success Banner - Auto close after 3 seconds */}
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
                            <i className="fas fa-map-marker-alt mr-2 text-danger"></i>
                            Regional Management
                        </h4>
                        <p className="text-muted mb-0">Manage province and district data</p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                        }}
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Regional
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                            Total Regionals
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">{regionalList.length}</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-map fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-left-success shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Provinces
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {[...new Set(regionalList.map(r => r.province))].length}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-flag fa-2x text-gray-300"></i>
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
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                            Total Societies
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {regionalList.reduce((sum, r) => sum + (r.societies_count || 0), 0)}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-users fa-2x text-gray-300"></i>
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
                            <div className="col-md-6">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white">
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Search by province or district..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                    {searchTerm && (
                                        <div className="input-group-append">
                                            <button 
                                                className="btn btn-outline-secondary" 
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 text-md-right mt-2 mt-md-0">
                                <button 
                                    className="btn btn-outline-primary mr-2" 
                                    onClick={fetchRegionalList}
                                    title="Refresh data"
                                >
                                    <i className="fas fa-sync-alt mr-2"></i>
                                    Refresh
                                </button>
                                <small className="text-muted">
                                    Showing {currentItems.length} of {filteredRegionals.length} regionals
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regional Table */}
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4">#</th>
                                        <th>Province</th>
                                        <th>District</th>
                                        <th className="text-center">Societies</th>
                                        <th>Created</th>
                                        <th>Updated</th>
                                        <th className="text-center pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-map-marked-alt fa-3x text-muted mb-3 d-block"></i>
                                                {searchTerm ? 'No regionals found matching your search' : 'No regional data found'}
                                                {!searchTerm && (
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary mt-2 d-block mx-auto"
                                                        onClick={() => {
                                                            resetForm();
                                                            setShowCreateModal(true);
                                                        }}
                                                    >
                                                        <i className="fas fa-plus mr-1"></i> Add First Regional
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((regional, index) => (
                                            <tr key={regional.id}>
                                                <td className="pl-4">{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <span className="font-weight-bold">
                                                        <i className="fas fa-flag text-danger mr-2"></i>
                                                        {regional.province}
                                                    </span>
                                                </td>
                                                <td>
                                                    <i className="fas fa-city text-primary mr-2"></i>
                                                    {regional.district}
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge badge-info">
                                                        {regional.societies_count || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {new Date(regional.created_at).toLocaleDateString('id-ID', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </small>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {new Date(regional.updated_at).toLocaleDateString('id-ID', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </small>
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1"
                                                        onClick={() => handleViewDetail(regional)}
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-warning mr-1"
                                                        onClick={() => handleEditClick(regional)}
                                                        title="Edit Regional"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteClick(regional)}
                                                        title="Delete Regional"
                                                    >
                                                        <i className="fas fa-trash"></i>
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
                                        <button 
                                            className="page-link" 
                                            onClick={() => paginate(1)}
                                        >
                                            <i className="fas fa-angle-double-left"></i>
                                        </button>
                                    </li>
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => paginate(currentPage - 1)}
                                        >
                                            <i className="fas fa-angle-left"></i>
                                        </button>
                                    </li>
                                    
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        const showPage = 
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                                        
                                        if (showPage) {
                                            return (
                                                <li 
                                                    key={index} 
                                                    className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                                                >
                                                    <button 
                                                        className="page-link"
                                                        onClick={() => paginate(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </li>
                                            );
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
                                            return (
                                                <li key={index} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
                                        }
                                        return null;
                                    })}
                                    
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => paginate(currentPage + 1)}
                                        >
                                            <i className="fas fa-angle-right"></i>
                                        </button>
                                    </li>
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link" 
                                            onClick={() => paginate(totalPages)}
                                        >
                                            <i className="fas fa-angle-double-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== ALERT MODAL (untuk error saja) ==================== */}
            {showAlertModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowAlertModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body-custom text-center py-4">
                            <div className="mb-3">
                                <i 
                                    className={`fas ${getAlertIcon(alertModalConfig.type)}`}
                                    style={{ 
                                        fontSize: '64px', 
                                        color: getAlertColor(alertModalConfig.type) 
                                    }}
                                ></i>
                            </div>
                            <h5 style={{ color: getAlertColor(alertModalConfig.type) }}>
                                {alertModalConfig.title}
                            </h5>
                            <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>
                                {alertModalConfig.message}
                            </p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button 
                                className="btn btn-primary px-4"
                                onClick={() => {
                                    setShowAlertModal(false);
                                    if (alertModalConfig.onConfirm) {
                                        alertModalConfig.onConfirm();
                                    }
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CREATE REGIONAL MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-plus-circle mr-2"></i>
                                Add New Regional
                            </h5>
                            <button className="close-btn text-white" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateRegional}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-flag text-danger mr-1"></i>
                                        Province <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="province" 
                                        className={`form-control ${formErrors.province ? 'is-invalid' : ''}`}
                                        value={formData.province}
                                        onChange={handleInputChange}
                                        placeholder="Enter province name (e.g., Jawa Barat)"
                                        required
                                    />
                                    {formErrors.province && (
                                        <div className="invalid-feedback">{formErrors.province}</div>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-city text-primary mr-1"></i>
                                        District <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="district" 
                                        className={`form-control ${formErrors.district ? 'is-invalid' : ''}`}
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        placeholder="Enter district name (e.g., Bandung)"
                                        required
                                    />
                                    {formErrors.district && (
                                        <div className="invalid-feedback">{formErrors.district}</div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button 
                                    type="button" 
                                    className="btn btn-light" 
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={submitting}
                                >
                                    <i className="fas fa-times mr-2"></i>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Save Regional
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT REGIONAL MODAL ==================== */}
            {showEditModal && selectedRegional && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-warning">
                            <h5 className="modal-title">
                                <i className="fas fa-edit mr-2"></i>
                                Edit Regional
                            </h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRegional}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Editing: <strong>{selectedRegional.province} - {selectedRegional.district}</strong>
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-flag text-danger mr-1"></i>
                                        Province <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="province" 
                                        className={`form-control ${formErrors.province ? 'is-invalid' : ''}`}
                                        value={editFormData.province}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter province name"
                                        required
                                    />
                                    {formErrors.province && (
                                        <div className="invalid-feedback">{formErrors.province}</div>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-city text-primary mr-1"></i>
                                        District <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="district" 
                                        className={`form-control ${formErrors.district ? 'is-invalid' : ''}`}
                                        value={editFormData.district}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter district name"
                                        required
                                    />
                                    {formErrors.district && (
                                        <div className="invalid-feedback">{formErrors.district}</div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button 
                                    type="button" 
                                    className="btn btn-light" 
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                >
                                    <i className="fas fa-times mr-2"></i>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-warning" 
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Update Regional
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
            {showDeleteModal && selectedRegional && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-trash mr-2"></i>
                                Delete Regional
                            </h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Delete Regional?</h5>
                            <p className="text-muted">
                                You are about to delete <strong>{selectedRegional.province} - {selectedRegional.district}</strong>.
                            </p>
                            {selectedRegional.societies_count > 0 && (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    This regional has <strong>{selectedRegional.societies_count}</strong> society members and cannot be deleted.
                                </div>
                            )}
                            <p className="text-danger mb-0">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button 
                                className="btn btn-light" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={submitting}
                            >
                                <i className="fas fa-times mr-2"></i>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDeleteRegional}
                                disabled={submitting || (selectedRegional.societies_count > 0)}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-trash mr-2"></i>
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && regionalDetail && (
                <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-info text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-info-circle mr-2"></i>
                                Regional Details
                            </h5>
                            <button className="close-btn text-white" onClick={() => {
                                setShowDetailModal(false);
                                setRegionalDetail(null);
                            }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            {/* Regional Info */}
                            <div className="row mb-4">
                                <div className="col-md-12">
                                    <div className="card bg-light">
                                        <div className="card-body text-center">
                                            <h4 className="font-weight-bold mb-1">
                                                <i className="fas fa-flag text-danger mr-2"></i>
                                                {regionalDetail.province}
                                            </h4>
                                            <h5 className="text-muted mb-0">
                                                <i className="fas fa-city text-primary mr-2"></i>
                                                {regionalDetail.district}
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Statistics */}
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <div className="card border-left-info shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                                Total Societies
                                            </div>
                                            <div className="h4 mb-0 font-weight-bold">
                                                {regionalDetail.societies?.length || regionalDetail.societies_count || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card border-left-primary shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                                Regional ID
                                            </div>
                                            <div className="h4 mb-0 font-weight-bold">#{regionalDetail.id}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Societies List */}
                            {regionalDetail.societies && regionalDetail.societies.length > 0 && (
                                <div>
                                    <h6 className="font-weight-bold text-primary mb-3">
                                        <i className="fas fa-users mr-2"></i>
                                        Society Members ({regionalDetail.societies.length})
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Name</th>
                                                    <th>ID Card Number</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {regionalDetail.societies.map((society) => (
                                                    <tr key={society.id}>
                                                        <td>{society.id}</td>
                                                        <td>{society.name}</td>
                                                        <td>{society.id_card_number}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="row mt-3">
                                <div className="col-md-6">
                                    <small className="text-muted">
                                        Created: {new Date(regionalDetail.created_at).toLocaleString('id-ID')}
                                    </small>
                                </div>
                                <div className="col-md-6 text-right">
                                    <small className="text-muted">
                                        Updated: {new Date(regionalDetail.updated_at).toLocaleString('id-ID')}
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setRegionalDetail(null);
                                }}
                            >
                                <i className="fas fa-times mr-2"></i>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CUSTOM MODAL STYLES ==================== */}
            <style jsx="true">{`
                .modal-backdrop-custom {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                }
                
                .modal-custom {
                    background: white;
                    border-radius: 8px;
                    width: 600px;
                    max-width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                
                .modal-sm-custom {
                    width: 450px;
                }
                
                .modal-header-custom {
                    padding: 16px 20px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-body-custom {
                    padding: 20px;
                }
                
                .modal-footer-custom {
                    padding: 16px 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    color: #666;
                }
                
                .close-btn:hover {
                    color: #333;
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
                }
                
                .border-left-primary {
                    border-left: 4px solid #4e73df !important;
                }
                .border-left-success {
                    border-left: 4px solid #1cc88a !important;
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
            `}</style>
        </MainLayouts>
    );
}