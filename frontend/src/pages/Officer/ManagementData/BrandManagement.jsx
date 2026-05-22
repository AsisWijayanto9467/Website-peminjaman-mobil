import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function BrandManagement() {
    // Data states
    const [brandList, setBrandList] = useState([]);
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
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [brandDetail, setBrandDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        brand: ''
    });
    
    const [editFormData, setEditFormData] = useState({
        brand: ''
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchBrandList();
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

    const fetchBrandList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/officer/brands");
            
            // Backend mengembalikan format { brands: [...] }
            setBrandList(res.data.brands || []);
        } catch (err) {
            console.error("Failed to fetch brand list:", err);
            const errorMsg = err.response?.data?.message || "Failed to load brand data";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrandDetail = async (id) => {
        try {
            const res = await api.get(`/officer/brands/${id}`);
            setBrandDetail(res.data.brand);
        } catch (err) {
            console.error("Failed to fetch brand detail:", err);
            const errorMsg = err.response?.data?.message || 'Failed to load brand detail';
            showAlert('Error', errorMsg, 'error');
        }
    };

    // Filter brand based on search term
    const filteredBrands = brandList.filter(brand => {
        const searchLower = searchTerm.toLowerCase();
        return brand.brand?.toLowerCase().includes(searchLower);
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBrands.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Reset form
    const resetForm = () => {
        setFormData({ brand: '' });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({ brand: '' });
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

    // Validasi form
    const validateForm = (data) => {
        const errors = {};
        
        if (!data.brand || data.brand.trim() === '') {
            errors.brand = 'Brand name is required';
        } else if (data.brand.trim().length < 2) {
            errors.brand = 'Brand name must be at least 2 characters';
        }
        
        return errors;
    };

    // Create brand
    const handleCreateBrand = async (e) => {
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
            const res = await api.post("/officer/brands", formData);
            
            // TUTUP MODAL LANGSUNG
            setShowCreateModal(false);
            resetForm();
            
            // TAMPILKAN SUCCESS BANNER
            showSuccessBanner(res.data.message || 'Brand added successfully!');
            
            // REFRESH DATA
            fetchBrandList();
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
                showAlert('Error', 'Failed to add brand. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Open edit modal
    const handleEditClick = (brand) => {
        setSelectedBrand(brand);
        setEditFormData({
            brand: brand.brand || ''
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update brand
    const handleUpdateBrand = async (e) => {
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
            const res = await api.put(`/officer/brands/${selectedBrand.id}`, editFormData);
            
            // TUTUP MODAL LANGSUNG
            setShowEditModal(false);
            setSelectedBrand(null);
            resetEditForm();
            
            // TAMPILKAN SUCCESS BANNER
            showSuccessBanner(res.data.message || 'Brand updated successfully!');
            
            // REFRESH DATA
            fetchBrandList();
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
                showAlert('Error', 'Failed to update brand', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Delete brand
    const handleDeleteClick = (brand) => {
        setSelectedBrand(brand);
        setShowDeleteModal(true);
    };

    const handleDeleteBrand = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/officer/brands/${selectedBrand.id}`);
            
            // TUTUP MODAL LANGSUNG
            setShowDeleteModal(false);
            setSelectedBrand(null);
            
            // TAMPILKAN SUCCESS BANNER
            showSuccessBanner(res.data.message || 'Brand deleted successfully!');
            
            // REFRESH DATA
            fetchBrandList();
        } catch (err) {
            console.error("Delete error:", err);
            
            const responseData = err.response?.data;
            const errorMsg = responseData?.message || 'Failed to delete brand';
            
            showAlert('Error', errorMsg, 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (brand) => {
        setSelectedBrand(brand);
        await fetchBrandDetail(brand.id);
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
                        <p className="text-muted">Loading brand data...</p>
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
                            <i className="fas fa-trademark mr-2 text-primary"></i>
                            Brand Management
                        </h4>
                        <p className="text-muted mb-0">Manage car brands</p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                        }}
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Brand
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
                                            Total Brands
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">{brandList.length}</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-tags fa-2x text-gray-300"></i>
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
                                            Filtered Brands
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {filteredBrands.length}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-filter fa-2x text-gray-300"></i>
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
                                            Page
                                        </div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {currentPage} / {totalPages || 1}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-file-alt fa-2x text-gray-300"></i>
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
                                        placeholder="Search brand name..."
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
                                    onClick={fetchBrandList}
                                    title="Refresh data"
                                >
                                    <i className="fas fa-sync-alt mr-2"></i>
                                    Refresh
                                </button>
                                <small className="text-muted">
                                    Showing {currentItems.length} of {filteredBrands.length} brands
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Brand Table */}
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4">#</th>
                                        <th>Brand Logo</th>
                                        <th>Brand Name</th>
                                        <th className="text-center">Cars Count</th>
                                        <th>Created</th>
                                        <th>Updated</th>
                                        <th className="text-center pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-trademark fa-3x text-muted mb-3 d-block"></i>
                                                {searchTerm ? 'No brands found matching your search' : 'No brand data found'}
                                                {!searchTerm && (
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary mt-2 d-block mx-auto"
                                                        onClick={() => {
                                                            resetForm();
                                                            setShowCreateModal(true);
                                                        }}
                                                    >
                                                        <i className="fas fa-plus mr-1"></i> Add First Brand
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((brand, index) => (
                                            <tr key={brand.id}>
                                                <td className="pl-4">{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <div 
                                                        className="bg-light rounded d-flex align-items-center justify-content-center"
                                                        style={{ 
                                                            width: '45px', 
                                                            height: '45px',
                                                            fontSize: '1.2rem',
                                                            fontWeight: 'bold',
                                                            color: '#4e73df'
                                                        }}
                                                    >
                                                        {brand.brand?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="font-weight-bold">
                                                        <i className="fas fa-car text-primary mr-2"></i>
                                                        {brand.brand}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge badge-secondary">
                                                        {brand.installments_count || brand.cars_count || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {brand.created_at 
                                                            ? new Date(brand.created_at).toLocaleDateString('id-ID', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })
                                                            : '-'
                                                        }
                                                    </small>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {brand.updated_at 
                                                            ? new Date(brand.updated_at).toLocaleDateString('id-ID', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })
                                                            : '-'
                                                        }
                                                    </small>
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1"
                                                        onClick={() => handleViewDetail(brand)}
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-warning mr-1"
                                                        onClick={() => handleEditClick(brand)}
                                                        title="Edit Brand"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteClick(brand)}
                                                        title="Delete Brand"
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
                                        const showPage = 
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                                        
                                        if (showPage) {
                                            return (
                                                <li key={index} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => paginate(pageNum)}>
                                                        {pageNum}
                                                    </button>
                                                </li>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return (
                                                <li key={index} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
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
                                <i 
                                    className={`fas ${getAlertIcon(alertModalConfig.type)}`}
                                    style={{ fontSize: '64px', color: getAlertColor(alertModalConfig.type) }}
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
                                    if (alertModalConfig.onConfirm) alertModalConfig.onConfirm();
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CREATE BRAND MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-plus-circle mr-2"></i>
                                Add New Brand
                            </h5>
                            <button className="close-btn text-white" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateBrand}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-trademark text-primary mr-1"></i>
                                        Brand Name <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="brand" 
                                        className={`form-control ${formErrors.brand ? 'is-invalid' : ''}`}
                                        value={formData.brand}
                                        onChange={handleInputChange}
                                        placeholder="Enter brand name (e.g., Toyota, Honda)"
                                        required
                                    />
                                    {formErrors.brand && (
                                        <div className="invalid-feedback">{formErrors.brand}</div>
                                    )}
                                    <small className="text-muted">Brand name must be unique</small>
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
                                            Save Brand
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT BRAND MODAL ==================== */}
            {showEditModal && selectedBrand && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-warning">
                            <h5 className="modal-title">
                                <i className="fas fa-edit mr-2"></i>
                                Edit Brand
                            </h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateBrand}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Editing: <strong>{selectedBrand.brand}</strong>
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-trademark text-primary mr-1"></i>
                                        Brand Name <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="brand" 
                                        className={`form-control ${formErrors.brand ? 'is-invalid' : ''}`}
                                        value={editFormData.brand}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter brand name"
                                        required
                                    />
                                    {formErrors.brand && (
                                        <div className="invalid-feedback">{formErrors.brand}</div>
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
                                            Update Brand
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
            {showDeleteModal && selectedBrand && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-trash mr-2"></i>
                                Delete Brand
                            </h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Delete Brand?</h5>
                            <p className="text-muted">
                                You are about to delete brand <strong>{selectedBrand.brand}</strong>.
                            </p>
                            {(selectedBrand.installments_count > 0 || selectedBrand.cars_count > 0) && (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    This brand has <strong>{selectedBrand.installments_count || selectedBrand.cars_count || 0}</strong> associated cars and cannot be deleted.
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
                                onClick={handleDeleteBrand}
                                disabled={submitting || (selectedBrand.installments_count > 0 || selectedBrand.cars_count > 0)}
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
            {showDetailModal && brandDetail && (
                <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-info text-white">
                            <h5 className="modal-title">
                                <i className="fas fa-info-circle mr-2"></i>
                                Brand Details
                            </h5>
                            <button className="close-btn text-white" onClick={() => {
                                setShowDetailModal(false);
                                setBrandDetail(null);
                            }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center">
                            <div 
                                className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: '80px', height: '80px', fontSize: '2rem', fontWeight: 'bold', color: '#4e73df' }}
                            >
                                {brandDetail.brand?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <h4 className="font-weight-bold mb-2">{brandDetail.brand}</h4>
                            <span className="badge badge-info">ID: #{brandDetail.id}</span>
                            
                            <hr />
                            
                            <div className="row">
                                <div className="col-6">
                                    <small className="text-muted d-block">Created</small>
                                    <strong>
                                        {brandDetail.created_at 
                                            ? new Date(brandDetail.created_at).toLocaleString('id-ID')
                                            : '-'
                                        }
                                    </strong>
                                </div>
                                <div className="col-6">
                                    <small className="text-muted d-block">Updated</small>
                                    <strong>
                                        {brandDetail.updated_at 
                                            ? new Date(brandDetail.updated_at).toLocaleString('id-ID')
                                            : '-'
                                        }
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setBrandDetail(null);
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