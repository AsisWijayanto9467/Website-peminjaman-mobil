import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function TenorManagement() {
    // Data states
    const [tenorList, setTenorList] = useState([]);
    const [carList, setCarList] = useState([]);
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
    const [selectedTenor, setSelectedTenor] = useState(null);
    const [tenorDetail, setTenorDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        installment_id: '',
        month: '',
        description: '',
        nominal: ''
    });
    
    const [editFormData, setEditFormData] = useState({
        installment_id: '',
        month: '',
        description: '',
        nominal: ''
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        setError("");
        try {
            const [tenorsRes, carsRes] = await Promise.all([
                api.get("/officer/tenors"),
                api.get("/officer/cars")
            ]);
            
            setTenorList(tenorsRes.data.tenors || []);
            setCarList(carsRes.data.cars || []);
            
            console.log("✅ Tenors loaded:", tenorsRes.data.tenors?.length || 0);
            console.log("✅ Cars loaded:", carsRes.data.cars?.length || 0);
        } catch (err) {
            console.error("❌ Failed to fetch initial data:", err);
            const errorMsg = err.response?.data?.message || "Failed to load data";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenorList = async () => {
        try {
            const res = await api.get("/officer/tenors");
            setTenorList(res.data.tenors || []);
        } catch (err) {
            console.error("Failed to fetch tenor list:", err);
            showAlert('Error', err.response?.data?.message || 'Failed to load tenor data', 'error');
        }
    };

    const fetchTenorDetail = async (id) => {
        try {
            const res = await api.get(`/officer/tenors/${id}`);
            setTenorDetail(res.data.tenor);
        } catch (err) {
            console.error("Failed to fetch tenor detail:", err);
            showAlert('Error', err.response?.data?.message || 'Failed to load tenor detail', 'error');
        }
    };

    // Alert & Success Banner
    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
    };

    // Format error dari backend
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

    // Format Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    // Filter tenors
    const filteredTenors = tenorList.filter(tenor => {
        const searchLower = searchTerm.toLowerCase();
        const carName = tenor.installment?.cars || tenor.installment?.car || '';
        const brandName = tenor.installment?.brand?.brand || '';
        return (
            carName.toLowerCase().includes(searchLower) ||
            brandName.toLowerCase().includes(searchLower) ||
            tenor.description?.toLowerCase().includes(searchLower) ||
            String(tenor.month).includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredTenors.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTenors.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Reset form
    const resetForm = () => {
        setFormData({ installment_id: '', month: '', description: '', nominal: '' });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({ installment_id: '', month: '', description: '', nominal: '' });
        setFormErrors({});
    };

    // Handle input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Validasi form
    const validateForm = (data, isEdit = false) => {
        const errors = {};
        if (!isEdit || data.installment_id) {
            if (!data.installment_id) errors.installment_id = 'Car is required';
        }
        if (!data.month || data.month === '') errors.month = 'Month is required';
        else if (isNaN(data.month) || Number(data.month) < 1) errors.month = 'Month must be at least 1';
        if (!data.description || data.description.trim() === '') errors.description = 'Description is required';
        if (!data.nominal || data.nominal === '') errors.nominal = 'Nominal is required';
        else if (isNaN(data.nominal) || Number(data.nominal) < 0) errors.nominal = 'Nominal must be a positive number';
        return errors;
    };

    // Create tenor
    const handleCreateTenor = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validation Error', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const dataToSend = {
                installment_id: Number(formData.installment_id),
                month: Number(formData.month),
                description: formData.description,
                nominal: Number(formData.nominal)
            };
            
            console.log("📤 Creating tenor:", dataToSend);
            const res = await api.post("/officer/tenors", dataToSend);
            console.log("✅ Tenor created:", res.data);
            
            setShowCreateModal(false);
            resetForm();
            showSuccessBanner(res.data.message || 'Tenor added successfully!');
            fetchTenorList();
        } catch (err) {
            console.error("❌ Create error:", err);
            const responseData = err.response?.data;
            if (responseData?.errors) {
                if (typeof responseData.errors === 'object') {
                    setFormErrors(responseData.errors);
                    showAlert('Validation Error', formatBackendErrors(responseData.errors), 'warning');
                } else {
                    showAlert('Error', responseData.errors, 'error');
                }
            } else if (responseData?.message) {
                showAlert('Error', responseData.message, 'error');
            } else {
                showAlert('Error', 'Failed to add tenor. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Open edit modal
    const handleEditClick = (tenor) => {
        setSelectedTenor(tenor);
        setEditFormData({
            installment_id: tenor.installment_id || '',
            month: tenor.month || '',
            description: tenor.description || '',
            nominal: tenor.nominal || ''
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update tenor
    const handleUpdateTenor = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(editFormData, true);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validation Error', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const dataToSend = {};
            if (editFormData.month) dataToSend.month = Number(editFormData.month);
            if (editFormData.description) dataToSend.description = editFormData.description;
            if (editFormData.nominal) dataToSend.nominal = Number(editFormData.nominal);
            
            console.log("📤 Updating tenor:", selectedTenor.id, dataToSend);
            const res = await api.put(`/officer/tenors/${selectedTenor.id}`, dataToSend);
            console.log("✅ Tenor updated:", res.data);
            
            setShowEditModal(false);
            setSelectedTenor(null);
            resetEditForm();
            showSuccessBanner(res.data.message || 'Tenor updated successfully!');
            fetchTenorList();
        } catch (err) {
            console.error("❌ Update error:", err);
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Error', formatBackendErrors(responseData.errors), 'error');
            } else if (responseData?.message) {
                showAlert('Error', responseData.message, 'error');
            } else {
                showAlert('Error', 'Failed to update tenor', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Delete tenor
    const handleDeleteClick = (tenor) => {
        setSelectedTenor(tenor);
        setShowDeleteModal(true);
    };

    const handleDeleteTenor = async () => {
        setSubmitting(true);
        try {
            console.log("🗑️ Deleting tenor:", selectedTenor.id);
            const res = await api.delete(`/officer/tenors/${selectedTenor.id}`);
            console.log("✅ Tenor deleted:", res.data);
            
            setShowDeleteModal(false);
            setSelectedTenor(null);
            showSuccessBanner(res.data.message || 'Tenor deleted successfully!');
            fetchTenorList();
        } catch (err) {
            console.error("❌ Delete error:", err);
            showAlert('Error', err.response?.data?.message || 'Failed to delete tenor', 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (tenor) => {
        setSelectedTenor(tenor);
        await fetchTenorDetail(tenor.id);
        setShowDetailModal(true);
    };

    // Open create modal
    const handleOpenCreateModal = () => {
        resetForm();
        if (carList.length === 0) {
            showAlert('Warning', 'No cars available. Please add cars first before adding tenors.', 'warning');
            return;
        }
        setShowCreateModal(true);
    };

    // Get car display name
    const getCarDisplayName = (tenor) => {
        const car = tenor.installment;
        if (!car) return 'Unknown Car';
        const brandName = car.brand?.brand || '';
        const carName = car.cars || car.car || '';
        return brandName ? `${brandName} - ${carName}` : carName;
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
                        <p className="text-muted">Loading tenor data...</p>
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
                            <i className="fas fa-calendar-alt mr-2 text-info"></i>
                            Tenor Management
                        </h4>
                        <p className="text-muted mb-0">Manage installment tenor options for cars</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                        <i className="fas fa-plus mr-2"></i>
                        Add Tenor
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Tenors</div>
                                        <div className="h4 mb-0 font-weight-bold">{tenorList.length}</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-list-ol fa-2x text-gray-300"></i>
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
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Cars with Tenor</div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {[...new Set(tenorList.map(t => t.installment_id))].length}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-car fa-2x text-gray-300"></i>
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
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Avg Months</div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {tenorList.length > 0 
                                                ? Math.round(tenorList.reduce((sum, t) => sum + (t.month || 0), 0) / tenorList.length)
                                                : 0
                                            }
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-clock fa-2x text-gray-300"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-warning shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Total Cars</div>
                                        <div className="h4 mb-0 font-weight-bold">{carList.length}</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-car-side fa-2x text-gray-300"></i>
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
                                        placeholder="Search by car name, month, or description..."
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
                            <div className="col-md-6 text-md-right mt-2 mt-md-0">
                                <button className="btn btn-outline-primary mr-2" onClick={fetchInitialData} title="Refresh data">
                                    <i className="fas fa-sync-alt mr-2"></i>Refresh
                                </button>
                                <small className="text-muted">
                                    Showing {currentItems.length} of {filteredTenors.length} tenors
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tenor Table */}
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4">#</th>
                                        <th>Car</th>
                                        <th className="text-center">Month</th>
                                        <th>Description</th>
                                        <th className="text-right">Nominal</th>
                                        <th className="text-center pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <i className="fas fa-calendar-alt fa-3x text-muted mb-3 d-block"></i>
                                                {searchTerm ? 'No tenors found matching your search' : 'No tenor data found'}
                                                {!searchTerm && (
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary mt-2 d-block mx-auto"
                                                        onClick={handleOpenCreateModal}
                                                    >
                                                        <i className="fas fa-plus mr-1"></i> Add First Tenor
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((tenor, index) => (
                                            <tr key={tenor.id}>
                                                <td className="pl-4">{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <span className="font-weight-bold">
                                                        <i className="fas fa-car text-primary mr-2"></i>
                                                        {getCarDisplayName(tenor)}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge badge-info" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                                        {tenor.month} months
                                                    </span>
                                                </td>
                                                <td>
                                                    <span>{tenor.description}</span>
                                                </td>
                                                <td className="text-right font-weight-bold">
                                                    {formatRupiah(tenor.nominal)}
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button className="btn btn-sm btn-info mr-1" onClick={() => handleViewDetail(tenor)} title="View Details">
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-warning mr-1" onClick={() => handleEditClick(tenor)} title="Edit Tenor">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(tenor)} title="Delete Tenor">
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

            {/* ==================== CREATE TENOR MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-primary text-white">
                            <h5 className="modal-title"><i className="fas fa-plus-circle mr-2"></i>Add New Tenor</h5>
                            <button className="close-btn text-white" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateTenor}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label><i className="fas fa-car text-primary mr-1"></i>Select Car <span className="text-danger">*</span></label>
                                    <select 
                                        name="installment_id" 
                                        className={`form-control ${formErrors.installment_id ? 'is-invalid' : ''}`}
                                        value={formData.installment_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">-- Select Car --</option>
                                        {carList.map(car => (
                                            <option key={car.id} value={car.id}>
                                                {car.brand} - {car.car} ({formatRupiah(car.price)})
                                            </option>
                                        ))}
                                    </select>
                                    {carList.length === 0 && (
                                        <small className="text-warning">
                                            <i className="fas fa-exclamation-triangle mr-1"></i>
                                            No cars available. Please add cars first.
                                        </small>
                                    )}
                                    {formErrors.installment_id && <div className="invalid-feedback">{formErrors.installment_id}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-calendar text-primary mr-1"></i>Month <span className="text-danger">*</span></label>
                                    <input type="number" name="month" className={`form-control ${formErrors.month ? 'is-invalid' : ''}`}
                                        value={formData.month} onChange={handleInputChange}
                                        placeholder="Enter month duration (e.g., 12)" min="1" required />
                                    {formErrors.month && <div className="invalid-feedback">{formErrors.month}</div>}
                                    <small className="text-muted">Number of months for this installment</small>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-align-left text-primary mr-1"></i>Description <span className="text-danger">*</span></label>
                                    <textarea name="description" className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        value={formData.description} onChange={handleInputChange}
                                        rows="2" placeholder="Enter tenor description" required></textarea>
                                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-money-bill-wave text-primary mr-1"></i>Nominal <span className="text-danger">*</span></label>
                                    <input type="number" name="nominal" className={`form-control ${formErrors.nominal ? 'is-invalid' : ''}`}
                                        value={formData.nominal} onChange={handleInputChange}
                                        placeholder="Enter monthly installment amount" min="0" required />
                                    {formErrors.nominal && <div className="invalid-feedback">{formErrors.nominal}</div>}
                                    <small className="text-muted">Monthly payment amount in Rupiah (IDR)</small>
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                                    <i className="fas fa-times mr-2"></i>Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : <><i className="fas fa-save mr-2"></i>Save Tenor</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT TENOR MODAL ==================== */}
            {showEditModal && selectedTenor && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-warning">
                            <h5 className="modal-title"><i className="fas fa-edit mr-2"></i>Edit Tenor</h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTenor}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Editing tenor for: <strong>{getCarDisplayName(selectedTenor)} ({selectedTenor.month} months)</strong>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-calendar text-primary mr-1"></i>Month</label>
                                    <input type="number" name="month" className={`form-control ${formErrors.month ? 'is-invalid' : ''}`}
                                        value={editFormData.month} onChange={handleEditInputChange}
                                        placeholder="Enter month duration" min="1" />
                                    {formErrors.month && <div className="invalid-feedback">{formErrors.month}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-align-left text-primary mr-1"></i>Description</label>
                                    <textarea name="description" className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        value={editFormData.description} onChange={handleEditInputChange}
                                        rows="2" placeholder="Enter tenor description"></textarea>
                                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-money-bill-wave text-primary mr-1"></i>Nominal</label>
                                    <input type="number" name="nominal" className={`form-control ${formErrors.nominal ? 'is-invalid' : ''}`}
                                        value={editFormData.nominal} onChange={handleEditInputChange}
                                        placeholder="Enter monthly installment amount" min="0" />
                                    {formErrors.nominal && <div className="invalid-feedback">{formErrors.nominal}</div>}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)} disabled={submitting}>
                                    <i className="fas fa-times mr-2"></i>Cancel
                                </button>
                                <button type="submit" className="btn btn-warning" disabled={submitting}>
                                    {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Updating...</> : <><i className="fas fa-save mr-2"></i>Update Tenor</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
            {showDeleteModal && selectedTenor && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white">
                            <h5 className="modal-title"><i className="fas fa-trash mr-2"></i>Delete Tenor</h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Delete Tenor?</h5>
                            <p className="text-muted">
                                You are about to delete <strong>{selectedTenor.month} months</strong> tenor for <strong>{getCarDisplayName(selectedTenor)}</strong>.
                            </p>
                            <p className="text-danger mb-0">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
                                <i className="fas fa-times mr-2"></i>Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteTenor} disabled={submitting}>
                                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</> : <><i className="fas fa-trash mr-2"></i>Delete</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && tenorDetail && (
                <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-info text-white">
                            <h5 className="modal-title"><i className="fas fa-info-circle mr-2"></i>Tenor Details</h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setTenorDetail(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="card bg-light mb-4">
                                <div className="card-body text-center">
                                    <h3 className="font-weight-bold text-info mb-2">{tenorDetail.month} Months</h3>
                                    <h5 className="text-success mb-0">{formatRupiah(tenorDetail.nominal)}</h5>
                                    <small className="text-muted">per month</small>
                                </div>
                            </div>
                            <div className="mb-3">
                                <h6 className="font-weight-bold text-primary"><i className="fas fa-align-left mr-2"></i>Description</h6>
                                <p className="text-muted">{tenorDetail.description}</p>
                            </div>
                            <div className="mb-3">
                                <h6 className="font-weight-bold text-primary"><i className="fas fa-car mr-2"></i>Car</h6>
                                <p className="text-muted">{tenorDetail.installment?.brand?.brand} - {tenorDetail.installment?.cars || tenorDetail.installment?.car}</p>
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <div className="card border-left-primary shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Tenor ID</div>
                                            <div className="h5 mb-0 font-weight-bold">#{tenorDetail.id}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card border-left-info shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Total Payment</div>
                                            <div className="h5 mb-0 font-weight-bold text-success">
                                                {formatRupiah(tenorDetail.nominal * tenorDetail.month)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-md-6">
                                    <small className="text-muted">Created: {tenorDetail.created_at ? new Date(tenorDetail.created_at).toLocaleString('id-ID') : '-'}</small>
                                </div>
                                <div className="col-md-6 text-right">
                                    <small className="text-muted">Updated: {tenorDetail.updated_at ? new Date(tenorDetail.updated_at).toLocaleString('id-ID') : '-'}</small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); setTenorDetail(null); }}>
                                <i className="fas fa-times mr-2"></i>Close
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