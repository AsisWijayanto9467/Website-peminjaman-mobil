import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function StaffManagement() {
    // Data states
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '',
        message: '',
        type: 'info', // info, success, warning, error
        onConfirm: null
    });
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [staffDetail, setStaffDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        id_card_number: '',
        password: '',
        password_confirmation: '',
        born_date: '',
        gender: 'male',
        address: '',
        role: 'validator'
    });
    
    const [editFormData, setEditFormData] = useState({
        name: '',
        id_card_number: '',
        born_date: '',
        gender: 'male',
        address: '',
        role: 'validator',
        old_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchStaffList();
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

    // Fungsi untuk menampilkan error dari backend
    const showBackendError = (err, defaultMessage = 'An error occurred') => {
        const responseData = err.response?.data;
        let errorMessage = defaultMessage;
        
        if (responseData) {
            // Jika ada validation errors (object)
            if (responseData.errors) {
                if (typeof responseData.errors === 'object') {
                    errorMessage = Object.values(responseData.errors)
                        .flat()
                        .join('\n');
                } else {
                    errorMessage = responseData.errors;
                }
            } 
            // Jika ada message
            else if (responseData.message) {
                errorMessage = responseData.message;
            }
        }
        
        showAlert('Error', errorMessage, 'error');
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

    const fetchStaffList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/admin/validators");
            setStaffList(res.data.validators || []);
        } catch (err) {
            console.error("Failed to fetch staff list:", err);
            const errorMsg = err.response?.data?.message || "Failed to load staff list";
            setError(errorMsg);
            showAlert('Error', errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffDetail = async (id) => {
        try {
            const res = await api.get(`/admin/validators/${id}`);
            setStaffDetail(res.data.validator);
        } catch (err) {
            console.error("Failed to fetch staff detail:", err);
            showBackendError(err, 'Failed to load staff detail');
        }
    };

    // Filter staff based on search term
    const filteredStaff = staffList.filter(staff => {
        const searchLower = searchTerm.toLowerCase();
        return (
            staff.name?.toLowerCase().includes(searchLower) ||
            staff.id_card_number?.toLowerCase().includes(searchLower) ||
            staff.role?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            id_card_number: '',
            password: '',
            password_confirmation: '',
            born_date: '',
            gender: 'male',
            address: '',
            role: 'validator'
        });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({
            name: '',
            id_card_number: '',
            born_date: '',
            gender: 'male',
            address: '',
            role: 'validator',
            old_password: '',
            new_password: '',
            new_password_confirmation: ''
        });
        setFormErrors({});
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error untuk field yang diubah
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
    const validateCreateForm = () => {
        const errors = {};
        
        if (!formData.id_card_number || formData.id_card_number.length < 16) {
            errors.id_card_number = 'ID Card Number must be 16 digits';
        }
        if (!formData.password || formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = 'Passwords do not match';
        }
        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'Name is required';
        }
        if (!formData.born_date) {
            errors.born_date = 'Born date is required';
        }
        if (!formData.gender || !['male', 'female'].includes(formData.gender)) {
            errors.gender = 'Gender is required';
        }
        if (!formData.address || formData.address.trim() === '') {
            errors.address = 'Address is required';
        }
        if (!formData.role || !['validator', 'officer'].includes(formData.role)) {
            errors.role = 'Role is required';
        }
        
        return errors;
    };

    // Create staff
    const handleCreateStaff = async (e) => {
        e.preventDefault();
        
        // Validasi client-side
        const validationErrors = validateCreateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            const errorMessages = Object.values(validationErrors).join('\n');
            showAlert('Validation Error', errorMessages, 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            // Kirim data tanpa password_confirmation
            const dataToSend = {
                id_card_number: formData.id_card_number,
                password: formData.password,
                name: formData.name,
                born_date: formData.born_date,
                gender: formData.gender,
                address: formData.address,
                role: formData.role
            };
            
            console.log("Sending create request:", dataToSend);
            const res = await api.post("/admin/users", dataToSend);
            console.log("Create success:", res.data);
            
            showAlert(
                'Success', 
                res.data.message || 'Staff account created successfully',
                'success',
                () => {
                    setShowCreateModal(false);
                    resetForm();
                    fetchStaffList();
                }
            );
        } catch (err) {
            console.error("Create error:", err);
            console.error("Response:", err.response?.data);
            
            const responseData = err.response?.data;
            
            if (responseData?.errors) {
                // Validation errors dari backend
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
                showAlert('Error', 'Failed to create staff. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Open edit modal
    const handleEditClick = (staff) => {
        setSelectedStaff(staff);
        setEditFormData({
            name: staff.name || '',
            id_card_number: staff.id_card_number || '',
            born_date: '',
            gender: 'male',
            address: '',
            role: staff.role || 'validator',
            old_password: '',
            new_password: '',
            new_password_confirmation: ''
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update staff
    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        // Hanya kirim field yang diisi
        const updateData = {};
        if (editFormData.name) updateData.name = editFormData.name;
        if (editFormData.id_card_number) updateData.id_card_number = editFormData.id_card_number;
        if (editFormData.born_date) updateData.born_date = editFormData.born_date;
        if (editFormData.gender) updateData.gender = editFormData.gender;
        if (editFormData.address) updateData.address = editFormData.address;
        if (editFormData.role) updateData.role = editFormData.role;
        if (editFormData.new_password) {
            updateData.old_password = editFormData.old_password;
            updateData.new_password = editFormData.new_password;
            updateData.new_password_confirmation = editFormData.new_password_confirmation;
        }

        console.log("Update data:", updateData);

        try {
            const res = await api.put(`/admin/validator/${selectedStaff.id}`, updateData);
            console.log("Update success:", res.data);
            
            showAlert(
                'Success',
                res.data.message || 'Staff updated successfully',
                'success',
                () => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                    resetEditForm();
                    fetchStaffList();
                }
            );
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
                showAlert('Error', 'Failed to update staff', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Delete staff
    const handleDeleteClick = (staff) => {
        setSelectedStaff(staff);
        setShowDeleteModal(true);
    };

    const handleDeleteStaff = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/admin/validator/${selectedStaff.id}`);
            console.log("Delete success:", res.data);
            
            showAlert(
                'Success',
                res.data.message || 'Staff deleted successfully',
                'success',
                () => {
                    setShowDeleteModal(false);
                    setSelectedStaff(null);
                    fetchStaffList();
                }
            );
        } catch (err) {
            console.error("Delete error:", err);
            
            const responseData = err.response?.data;
            const errorMsg = responseData?.message || 'Failed to delete staff';
            
            showAlert('Error', errorMsg, 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (staff) => {
        setSelectedStaff(staff);
        await fetchStaffDetail(staff.id);
        setShowDetailModal(true);
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: 'badge-danger',
            officer: 'badge-primary',
            validator: 'badge-success'
        };
        return badges[role] || 'badge-secondary';
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
                        <p className="text-muted">Loading staff data...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid">
                {/* Success & Error Messages Banner */}
                {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="fas fa-check-circle mr-2"></i>
                        {success}
                        <button type="button" className="close" onClick={() => setSuccess("")}>
                            <span>&times;</span>
                        </button>
                    </div>
                )}
                
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
                        <h4 className="mb-1 font-weight-bold">Staff Management</h4>
                        <p className="text-muted mb-0">Manage officers and validators</p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                        }}
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Staff
                    </button>
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
                                        placeholder="Search by name, ID card number, or role..."
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
                                <small className="text-muted">
                                    Showing {currentItems.length} of {filteredStaff.length} staff members
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Staff Table */}
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>#</th>
                                        <th>ID Card Number</th>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th className="text-center">Total Validations</th>
                                        <th className="text-center">Recent</th>
                                        <th>Created</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-4">
                                                <i className="fas fa-users-slash fa-2x text-muted mb-2 d-block"></i>
                                                {searchTerm ? 'No staff found matching your search' : 'No staff members found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((staff, index) => (
                                            <tr key={staff.id}>
                                                <td>{indexOfFirstItem + index + 1}</td>
                                                <td className="font-weight-bold">{staff.id_card_number}</td>
                                                <td>{staff.name}</td>
                                                <td>
                                                    <span className={`badge ${getRoleBadge(staff.role)} text-capitalize`}>
                                                        {staff.role}
                                                    </span>
                                                </td>
                                                <td className="text-center">{staff.total_validations || 0}</td>
                                                <td className="text-center">{staff.recent_validations || 0}</td>
                                                <td>{new Date(staff.created_at).toLocaleDateString()}</td>
                                                <td className="text-center">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1"
                                                        onClick={() => handleViewDetail(staff)}
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-warning mr-1"
                                                        onClick={() => handleEditClick(staff)}
                                                        title="Edit Staff"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteClick(staff)}
                                                        title="Delete Staff"
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
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav className="mt-4">
                        <ul className="pagination justify-content-center">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => paginate(currentPage - 1)}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                            </li>
                            
                            {[...Array(totalPages)].map((_, index) => (
                                <li 
                                    key={index} 
                                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                                >
                                    <button 
                                        className="page-link"
                                        onClick={() => paginate(index + 1)}
                                    >
                                        {index + 1}
                                    </button>
                                </li>
                            ))}
                            
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => paginate(currentPage + 1)}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>

            {/* ==================== ALERT MODAL ==================== */}
            {showAlertModal && (
                <div className="modal-backdrop-custom" onClick={() => {
                    setShowAlertModal(false);
                    if (alertModalConfig.onConfirm && alertModalConfig.type === 'success') {
                        alertModalConfig.onConfirm();
                    }
                }}>
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
                                    if (alertModalConfig.onConfirm && alertModalConfig.type === 'success') {
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

            {/* ==================== CREATE STAFF MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom">
                            <h5 className="modal-title">
                                <i className="fas fa-user-plus mr-2"></i>
                                Add New Staff
                            </h5>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateStaff}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label>
                                        ID Card Number <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="id_card_number" 
                                        className={`form-control ${formErrors.id_card_number ? 'is-invalid' : ''}`}
                                        value={formData.id_card_number}
                                        onChange={handleInputChange}
                                        placeholder="ID should be 16 number long"
                                        maxLength="16"
                                        required
                                    />
                                    {formErrors.id_card_number && (
                                        <div className="invalid-feedback">{formErrors.id_card_number}</div>
                                    )}
                                    <small className="text-muted">Must be 16 digits</small>
                                </div>
                                
                                <div className="form-group">
                                    <label>Password <span className="text-danger">*</span></label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter password (min 6 characters)"
                                        required
                                    />
                                    {formErrors.password && (
                                        <div className="invalid-feedback">{formErrors.password}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Confirm Password <span className="text-danger">*</span></label>
                                    <input 
                                        type="password" 
                                        name="password_confirmation" 
                                        className={`form-control ${formErrors.password_confirmation ? 'is-invalid' : ''}`}
                                        value={formData.password_confirmation}
                                        onChange={handleInputChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    {formErrors.password_confirmation && (
                                        <div className="invalid-feedback">{formErrors.password_confirmation}</div>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>Full Name <span className="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        required
                                    />
                                    {formErrors.name && (
                                        <div className="invalid-feedback">{formErrors.name}</div>
                                    )}
                                </div>
                                
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Born Date <span className="text-danger">*</span></label>
                                            <input 
                                                type="date" 
                                                name="born_date" 
                                                className={`form-control ${formErrors.born_date ? 'is-invalid' : ''}`}
                                                value={formData.born_date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            {formErrors.born_date && (
                                                <div className="invalid-feedback">{formErrors.born_date}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Gender <span className="text-danger">*</span></label>
                                            <select 
                                                name="gender" 
                                                className={`form-control ${formErrors.gender ? 'is-invalid' : ''}`}
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                            {formErrors.gender && (
                                                <div className="invalid-feedback">{formErrors.gender}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Address <span className="text-danger">*</span></label>
                                    <textarea 
                                        name="address" 
                                        className={`form-control ${formErrors.address ? 'is-invalid' : ''}`}
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows="2"
                                        placeholder="Enter address"
                                        required
                                    ></textarea>
                                    {formErrors.address && (
                                        <div className="invalid-feedback">{formErrors.address}</div>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>Role <span className="text-danger">*</span></label>
                                    <select 
                                        name="role" 
                                        className={`form-control ${formErrors.role ? 'is-invalid' : ''}`}
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >
                                        <option value="validator">Validator</option>
                                        <option value="officer">Officer</option>
                                    </select>
                                    {formErrors.role && (
                                        <div className="invalid-feedback">{formErrors.role}</div>
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
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Create Staff
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT STAFF MODAL ==================== */}
            {showEditModal && selectedStaff && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom">
                            <h5 className="modal-title">
                                <i className="fas fa-edit mr-2"></i>
                                Edit Staff: {selectedStaff.name}
                            </h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateStaff}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        className="form-control"
                                        value={editFormData.name}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>ID Card Number</label>
                                    <input 
                                        type="text" 
                                        name="id_card_number" 
                                        className="form-control"
                                        value={editFormData.id_card_number}
                                        onChange={handleEditInputChange}
                                        placeholder="ID should be 16 number long"
                                        maxLength="16"
                                    />
                                </div>
                                
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Born Date</label>
                                            <input 
                                                type="date" 
                                                name="born_date" 
                                                className="form-control"
                                                value={editFormData.born_date}
                                                onChange={handleEditInputChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Gender</label>
                                            <select 
                                                name="gender" 
                                                className="form-control"
                                                value={editFormData.gender}
                                                onChange={handleEditInputChange}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea 
                                        name="address" 
                                        className="form-control"
                                        value={editFormData.address}
                                        onChange={handleEditInputChange}
                                        rows="2"
                                        placeholder="Enter address"
                                    ></textarea>
                                </div>
                                
                                <div className="form-group">
                                    <label>Role</label>
                                    <select 
                                        name="role" 
                                        className="form-control"
                                        value={editFormData.role}
                                        onChange={handleEditInputChange}
                                    >
                                        <option value="validator">Validator</option>
                                        <option value="officer">Officer</option>
                                    </select>
                                </div>
                                
                                <hr />
                                <h6 className="text-muted">Change Password (optional)</h6>
                                
                                <div className="form-group">
                                    <label>Old Password</label>
                                    <input 
                                        type="password" 
                                        name="old_password" 
                                        className="form-control"
                                        value={editFormData.old_password}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter old password"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input 
                                        type="password" 
                                        name="new_password" 
                                        className="form-control"
                                        value={editFormData.new_password}
                                        onChange={handleEditInputChange}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        name="new_password_confirmation" 
                                        className="form-control"
                                        value={editFormData.new_password_confirmation}
                                        onChange={handleEditInputChange}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button 
                                    type="button" 
                                    className="btn btn-light" 
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                >
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
                                            Update Staff
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
            {showDeleteModal && selectedStaff && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Are you sure?</h5>
                            <p className="text-muted">
                                You are about to delete <strong>{selectedStaff.name}</strong> ({selectedStaff.role}).
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button 
                                className="btn btn-light" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDeleteStaff}
                                disabled={submitting}
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
            {showDetailModal && staffDetail && (
                <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom">
                            <h5 className="modal-title">
                                <i className="fas fa-user mr-2"></i>
                                Staff Details
                            </h5>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <table className="table table-bordered">
                                <tbody>
                                    <tr>
                                        <th width="30%">Name</th>
                                        <td>{staffDetail.name}</td>
                                    </tr>
                                    <tr>
                                        <th>ID Card Number</th>
                                        <td>{staffDetail.id_card_number}</td>
                                    </tr>
                                    <tr>
                                        <th>Role</th>
                                        <td>
                                            <span className={`badge ${getRoleBadge(staffDetail.role)} text-capitalize`}>
                                                {staffDetail.role}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Total Validations</th>
                                        <td>{staffDetail.statistics?.total_validations || 0}</td>
                                    </tr>
                                    <tr>
                                        <th>Accepted</th>
                                        <td className="text-success">{staffDetail.statistics?.accepted || 0}</td>
                                    </tr>
                                    <tr>
                                        <th>Declined</th>
                                        <td className="text-danger">{staffDetail.statistics?.declined || 0}</td>
                                    </tr>
                                    <tr>
                                        <th>Pending</th>
                                        <td className="text-warning">{staffDetail.statistics?.pending || 0}</td>
                                    </tr>
                                    <tr>
                                        <th>Created</th>
                                        <td>{new Date(staffDetail.created_at).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
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
                }
                
                .table th {
                    border-top: none;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                }
            `}</style>
        </MainLayouts>
    );
}