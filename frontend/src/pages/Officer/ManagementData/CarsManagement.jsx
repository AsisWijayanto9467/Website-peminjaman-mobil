import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function CarsManagement() {
    // Data states
    const [carList, setCarList] = useState([]);
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
    const [selectedCar, setSelectedCar] = useState(null);
    const [carDetail, setCarDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        brand_id: '',
        cars: '',
        description: '',
        price: ''
    });
    
    const [editFormData, setEditFormData] = useState({
        brand_id: '',
        cars: '',
        description: '',
        price: ''
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchCarList();
        fetchBrandList();
    }, []);

    // Fungsi untuk menampilkan alert modal
    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    // Fungsi untuk menampilkan success banner
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

    const fetchCarList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/officer/cars");
            setCarList(res.data.cars || []);
        } catch (err) {
            console.error("Failed to fetch car list:", err);
            const errorMsg = err.response?.data?.message || "Failed to load car data";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrandList = async () => {
        try {
            const res = await api.get("/officer/brands");
            setBrandList(res.data.brands || []);
        } catch (err) {
            console.error("Failed to fetch brand list:", err);
        }
    };

    const fetchCarDetail = async (id) => {
        try {
            const res = await api.get(`/officer/cars/${id}`);
            setCarDetail(res.data.car);
        } catch (err) {
            console.error("Failed to fetch car detail:", err);
            const errorMsg = err.response?.data?.message || 'Failed to load car detail';
            showAlert('Error', errorMsg, 'error');
        }
    };

    // Filter cars based on search
    const filteredCars = carList.filter(car => {
        const searchLower = searchTerm.toLowerCase();
        return (
            car.car?.toLowerCase().includes(searchLower) ||
            car.brand?.toLowerCase().includes(searchLower) ||
            car.description?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCars.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Reset form
    const resetForm = () => {
        setFormData({ brand_id: '', cars: '', description: '', price: '' });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({ brand_id: '', cars: '', description: '', price: '' });
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
    const validateForm = (data) => {
        const errors = {};
        if (!data.brand_id) errors.brand_id = 'Brand is required';
        if (!data.cars || data.cars.trim() === '') errors.cars = 'Car name is required';
        if (!data.description || data.description.trim() === '') errors.description = 'Description is required';
        if (!data.price || data.price === '') errors.price = 'Price is required';
        else if (isNaN(data.price) || Number(data.price) < 0) errors.price = 'Price must be a positive number';
        return errors;
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

    // Create car
    const handleCreateCar = async (e) => {
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
                ...formData,
                brand_id: Number(formData.brand_id),
                price: Number(formData.price)
            };
            
            const res = await api.post("/officer/cars", dataToSend);
            setShowCreateModal(false);
            resetForm();
            showSuccessBanner(res.data.message || 'Car added successfully!');
            fetchCarList();
        } catch (err) {
            console.error("Create error:", err);
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
                showAlert('Error', 'Failed to add car. Please try again.', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Open edit modal
    const handleEditClick = (car) => {
        setSelectedCar(car);
        // Cari brand_id dari data car
        const brandObj = brandList.find(b => b.brand === car.brand);
        setEditFormData({
            brand_id: brandObj?.id || '',
            cars: car.car || '',
            description: car.description || '',
            price: car.price || ''
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update car
    const handleUpdateCar = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(editFormData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validation Error', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const dataToSend = {
                ...editFormData,
                brand_id: Number(editFormData.brand_id),
                price: Number(editFormData.price)
            };
            
            const res = await api.put(`/officer/cars/${selectedCar.id}`, dataToSend);
            setShowEditModal(false);
            setSelectedCar(null);
            resetEditForm();
            showSuccessBanner(res.data.message || 'Car updated successfully!');
            fetchCarList();
        } catch (err) {
            console.error("Update error:", err);
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Error', formatBackendErrors(responseData.errors), 'error');
            } else if (responseData?.message) {
                showAlert('Error', responseData.message, 'error');
            } else {
                showAlert('Error', 'Failed to update car', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Delete car
    const handleDeleteClick = (car) => {
        setSelectedCar(car);
        setShowDeleteModal(true);
    };

    const handleDeleteCar = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/officer/cars/${selectedCar.id}`);
            setShowDeleteModal(false);
            setSelectedCar(null);
            showSuccessBanner(res.data.message || 'Car deleted successfully!');
            fetchCarList();
        } catch (err) {
            console.error("Delete error:", err);
            showAlert('Error', err.response?.data?.message || 'Failed to delete car', 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (car) => {
        setSelectedCar(car);
        await fetchCarDetail(car.id);
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
                        <p className="text-muted">Loading car data...</p>
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
                            <i className="fas fa-car mr-2 text-primary"></i>
                            Cars Management
                        </h4>
                        <p className="text-muted mb-0">Manage installment cars data</p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Car
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-3 col-md-6 mb-3">
                        <div className="card border-left-primary shadow-sm h-100">
                            <div className="card-body">
                                <div className="row no-gutters align-items-center">
                                    <div className="col mr-2">
                                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Total Cars</div>
                                        <div className="h4 mb-0 font-weight-bold">{carList.length}</div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-car-side fa-2x text-gray-300"></i>
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
                                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Total Brands</div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {[...new Set(carList.map(c => c.brand))].length}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-tags fa-2x text-gray-300"></i>
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
                                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Total Applications</div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {carList.reduce((sum, c) => sum + (c.total_applications || 0), 0)}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-file-alt fa-2x text-gray-300"></i>
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
                                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Avg Price</div>
                                        <div className="h4 mb-0 font-weight-bold">
                                            {carList.length > 0 
                                                ? formatRupiah(carList.reduce((sum, c) => sum + (Number(c.price) || 0), 0) / carList.length)
                                                : 'Rp 0'
                                            }
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <i className="fas fa-money-bill-wave fa-2x text-gray-300"></i>
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
                                        placeholder="Search by car name, brand, or description..."
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
                                <button className="btn btn-outline-primary mr-2" onClick={fetchCarList} title="Refresh data">
                                    <i className="fas fa-sync-alt mr-2"></i>Refresh
                                </button>
                                <small className="text-muted">
                                    Showing {currentItems.length} of {filteredCars.length} cars
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cars Table */}
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="pl-4">#</th>
                                        <th>Car Name</th>
                                        <th>Brand</th>
                                        <th className="text-right">Price</th>
                                        <th className="text-center">Tenors</th>
                                        <th className="text-center">Applications</th>
                                        <th className="text-center pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-car-side fa-3x text-muted mb-3 d-block"></i>
                                                {searchTerm ? 'No cars found matching your search' : 'No car data found'}
                                                {!searchTerm && (
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary mt-2 d-block mx-auto"
                                                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                                                    >
                                                        <i className="fas fa-plus mr-1"></i> Add First Car
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((car, index) => (
                                            <tr key={car.id}>
                                                <td className="pl-4">{indexOfFirstItem + index + 1}</td>
                                                <td>
                                                    <span className="font-weight-bold">
                                                        <i className="fas fa-car text-primary mr-2"></i>
                                                        {car.car}
                                                    </span>
                                                    <br />
                                                    <small className="text-muted">{car.description?.substring(0, 50)}{car.description?.length > 50 ? '...' : ''}</small>
                                                </td>
                                                <td>
                                                    <span className="badge badge-primary">{car.brand}</span>
                                                </td>
                                                <td className="text-right font-weight-bold">
                                                    {formatRupiah(car.price)}
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge badge-info">{car.tenors?.length || 0}</span>
                                                </td>
                                                <td className="text-center">
                                                    {car.total_applications > 0 ? (
                                                        <span className="badge badge-success">{car.total_applications}</span>
                                                    ) : (
                                                        <span className="text-muted">0</span>
                                                    )}
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button className="btn btn-sm btn-info mr-1" onClick={() => handleViewDetail(car)} title="View Details">
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-warning mr-1" onClick={() => handleEditClick(car)} title="Edit Car">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(car)} title="Delete Car">
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

            {/* ==================== CREATE CAR MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-primary text-white">
                            <h5 className="modal-title"><i className="fas fa-plus-circle mr-2"></i>Add New Car</h5>
                            <button className="close-btn text-white" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCar}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label><i className="fas fa-trademark text-primary mr-1"></i>Brand <span className="text-danger">*</span></label>
                                    <select 
                                        name="brand_id" 
                                        className={`form-control ${formErrors.brand_id ? 'is-invalid' : ''}`}
                                        value={formData.brand_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">-- Select Brand --</option>
                                        {brandList.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.brand}</option>
                                        ))}
                                    </select>
                                    {formErrors.brand_id && <div className="invalid-feedback">{formErrors.brand_id}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-car text-primary mr-1"></i>Car Name <span className="text-danger">*</span></label>
                                    <input type="text" name="cars" className={`form-control ${formErrors.cars ? 'is-invalid' : ''}`}
                                        value={formData.cars} onChange={handleInputChange}
                                        placeholder="Enter car name (e.g., Avanza, Civic)" required />
                                    {formErrors.cars && <div className="invalid-feedback">{formErrors.cars}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-align-left text-primary mr-1"></i>Description <span className="text-danger">*</span></label>
                                    <textarea name="description" className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        value={formData.description} onChange={handleInputChange}
                                        rows="3" placeholder="Enter car description" required></textarea>
                                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-money-bill-wave text-primary mr-1"></i>Price <span className="text-danger">*</span></label>
                                    <input type="number" name="price" className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                                        value={formData.price} onChange={handleInputChange}
                                        placeholder="Enter car price" min="0" required />
                                    {formErrors.price && <div className="invalid-feedback">{formErrors.price}</div>}
                                    <small className="text-muted">Price in Rupiah (IDR)</small>
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                                    <i className="fas fa-times mr-2"></i>Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : <><i className="fas fa-save mr-2"></i>Save Car</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT CAR MODAL ==================== */}
            {showEditModal && selectedCar && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-warning">
                            <h5 className="modal-title"><i className="fas fa-edit mr-2"></i>Edit Car</h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCar}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Editing: <strong>{selectedCar.car} ({selectedCar.brand})</strong>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-trademark text-primary mr-1"></i>Brand <span className="text-danger">*</span></label>
                                    <select name="brand_id" className={`form-control ${formErrors.brand_id ? 'is-invalid' : ''}`}
                                        value={editFormData.brand_id} onChange={handleEditInputChange} required>
                                        <option value="">-- Select Brand --</option>
                                        {brandList.map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.brand}</option>
                                        ))}
                                    </select>
                                    {formErrors.brand_id && <div className="invalid-feedback">{formErrors.brand_id}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-car text-primary mr-1"></i>Car Name <span className="text-danger">*</span></label>
                                    <input type="text" name="cars" className={`form-control ${formErrors.cars ? 'is-invalid' : ''}`}
                                        value={editFormData.cars} onChange={handleEditInputChange} required />
                                    {formErrors.cars && <div className="invalid-feedback">{formErrors.cars}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-align-left text-primary mr-1"></i>Description <span className="text-danger">*</span></label>
                                    <textarea name="description" className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        value={editFormData.description} onChange={handleEditInputChange} rows="3" required></textarea>
                                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-money-bill-wave text-primary mr-1"></i>Price <span className="text-danger">*</span></label>
                                    <input type="number" name="price" className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                                        value={editFormData.price} onChange={handleEditInputChange} min="0" required />
                                    {formErrors.price && <div className="invalid-feedback">{formErrors.price}</div>}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)} disabled={submitting}>
                                    <i className="fas fa-times mr-2"></i>Cancel
                                </button>
                                <button type="submit" className="btn btn-warning" disabled={submitting}>
                                    {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Updating...</> : <><i className="fas fa-save mr-2"></i>Update Car</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
            {showDeleteModal && selectedCar && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white">
                            <h5 className="modal-title"><i className="fas fa-trash mr-2"></i>Delete Car</h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Delete Car?</h5>
                            <p className="text-muted">
                                You are about to delete <strong>{selectedCar.car} ({selectedCar.brand})</strong>.
                            </p>
                            {selectedCar.total_applications > 0 && (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    This car has <strong>{selectedCar.total_applications}</strong> applications and cannot be deleted.
                                </div>
                            )}
                            <p className="text-danger mb-0">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
                                <i className="fas fa-times mr-2"></i>Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteCar} disabled={submitting || (selectedCar.total_applications > 0)}>
                                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</> : <><i className="fas fa-trash mr-2"></i>Delete</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && carDetail && (
                <div className="modal-backdrop-custom" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-info text-white">
                            <h5 className="modal-title"><i className="fas fa-info-circle mr-2"></i>Car Details</h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setCarDetail(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="card bg-light mb-4">
                                <div className="card-body text-center">
                                    <h4 className="font-weight-bold mb-1">{carDetail.cars || carDetail.car}</h4>
                                    <span className="badge badge-primary">{carDetail.brand?.brand || selectedCar?.brand}</span>
                                    <h5 className="text-success mt-2 mb-0">{formatRupiah(carDetail.price)}</h5>
                                </div>
                            </div>
                            <div className="mb-3">
                                <h6 className="font-weight-bold text-primary"><i className="fas fa-align-left mr-2"></i>Description</h6>
                                <p className="text-muted">{carDetail.description}</p>
                            </div>
                            {carDetail.available_months && carDetail.available_months.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="font-weight-bold text-primary"><i className="fas fa-calendar-alt mr-2"></i>Available Tenors</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="bg-light">
                                                <tr><th>Month</th><th>Description</th><th className="text-right">Nominal</th></tr>
                                            </thead>
                                            <tbody>
                                                {carDetail.available_months.map((tenor, i) => (
                                                    <tr key={tenor.id || i}>
                                                        <td><span className="badge badge-info">{tenor.month} months</span></td>
                                                        <td>{tenor.description}</td>
                                                        <td className="text-right font-weight-bold">{formatRupiah(tenor.nominal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            <div className="row mt-3">
                                <div className="col-md-6">
                                    <small className="text-muted">Created: {carDetail.created_at ? new Date(carDetail.created_at).toLocaleString('id-ID') : '-'}</small>
                                </div>
                                <div className="col-md-6 text-right">
                                    <small className="text-muted">Updated: {carDetail.updated_at ? new Date(carDetail.updated_at).toLocaleString('id-ID') : '-'}</small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); setCarDetail(null); }}>
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