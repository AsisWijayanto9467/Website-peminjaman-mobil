import React, { useEffect, useState } from 'react'
import api from '../../../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function HistoryPayments() {
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBrand, setFilterBrand] = useState("all");
    
    const userName = localStorage.getItem("name") || "Society User";

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    const fetchPaymentHistory = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/payments/history");
            setHistory(res.data.history || []);
        } catch (err) {
            console.log(err);
            const data = err.response?.data;
            if (data?.message) {
                setError(data.message);
            } else {
                setError("Failed to load payment history");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const res = await api.post("/auth/logout");
            alert(res.data.message);
            localStorage.clear();
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Get unique brands for filter
    const brands = [...new Set(history.map(item => item.brand).filter(Boolean))];

    // Filter history based on search and brand
    const filteredHistory = history.filter(item => {
        const matchesSearch = 
            (item.car?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            `Month ${item.month_number}`.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesBrand = filterBrand === "all" || item.brand === filterBrand;
        
        return matchesSearch && matchesBrand;
    });

    // Calculate summary
    const totalPaid = history.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalTransactions = history.length;
    const latestPayment = history[0];
    const oldestPayment = history[history.length - 1];

    if (loading) {
        return (
            <>
                <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
                    <div className="container">
                        <span className="navbar-brand">
                            <i className="fas fa-car mr-2"></i>
                            Installment Cars
                        </span>
                    </div>
                </nav>
                <main style={{ marginTop: 80 }}>
                    <div className="container text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading payment history...</p>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
                <div className="container">
                    <span className="navbar-brand">
                        <i className="fas fa-car mr-2"></i>
                        Installment Cars
                    </span>

                    <div className="ml-auto d-flex align-items-center">
                        <span className="navbar-text text-white mr-3">
                            <i className="fas fa-user-circle mr-1"></i>
                            {userName}
                        </span>

                        {/* Payment Buttons */}
                        <Link to="/payment/management" className="btn btn-success btn-sm mr-2">
                            <i className="fas fa-credit-card mr-1"></i> Pay
                        </Link>
                        <Link to="/payment/history" className="btn btn-info btn-sm mr-2">
                            <i className="fas fa-history mr-1"></i> History
                        </Link>

                        {/* Profile Button */}
                        <Link to="/profile" className="btn btn-light btn-sm mr-2">
                            <i className="fas fa-id-card mr-1"></i> Profile
                        </Link>

                        {/* Logout Button */}
                        <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
                            <i className="fas fa-sign-out-alt mr-1"></i> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ marginTop: 80 }}>
                <header className="jumbotron">
                    <div className="container">
                        <h1 className="display-4">
                            <i className="fas fa-history mr-2"></i>
                            Payment History
                        </h1>
                        <p className="lead">View all your completed payment transactions</p>
                    </div>
                </header>

                <div className="container mb-5">
                    {/* Error Message */}
                    {error && (
                        <div className="alert alert-danger">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Summary Cards */}
                    {history.length > 0 && (
                        <section className="mb-5">
                            <div className="row">
                                <div className="col-md-3 mb-3">
                                    <div className="card card-default text-center border-primary">
                                        <div className="card-body">
                                            <i className="fas fa-receipt fa-2x text-primary mb-2"></i>
                                            <h5 className="card-title text-primary">
                                                {totalTransactions}
                                            </h5>
                                            <p className="card-text text-muted">Total Transactions</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3 mb-3">
                                    <div className="card card-default text-center border-success">
                                        <div className="card-body">
                                            <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                                            <h5 className="card-title text-success">
                                                {formatRupiah(totalPaid)}
                                            </h5>
                                            <p className="card-text text-muted">Total Paid</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3 mb-3">
                                    <div className="card card-default text-center border-info">
                                        <div className="card-body">
                                            <i className="fas fa-calendar-check fa-2x text-info mb-2"></i>
                                            <h5 className="card-title text-info">
                                                {latestPayment ? formatDateShort(latestPayment.paid_date) : '-'}
                                            </h5>
                                            <p className="card-text text-muted">Latest Payment</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-3 mb-3">
                                    <div className="card card-default text-center border-warning">
                                        <div className="card-body">
                                            <i className="fas fa-history fa-2x text-warning mb-2"></i>
                                            <h5 className="card-title text-warning">
                                                {oldestPayment ? formatDateShort(oldestPayment.paid_date) : '-'}
                                            </h5>
                                            <p className="card-text text-muted">First Payment</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Search & Filter */}
                    {history.length > 0 && (
                        <section className="mb-4">
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="form-group">
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text">
                                                    <i className="fas fa-search"></i>
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search by car, brand, or month..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <select
                                            className="form-control"
                                            value={filterBrand}
                                            onChange={(e) => setFilterBrand(e.target.value)}
                                        >
                                            <option value="all">All Brands</option>
                                            {brands.map(brand => (
                                                <option key={brand} value={brand}>
                                                    {brand}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Payment History Table */}
                    <section className="mb-4">
                        <div className="section-header mb-3">
                            <h4 className="section-title text-muted font-weight-normal">
                                <i className="fas fa-list-alt mr-2"></i>
                                Payment Records 
                                {filteredHistory.length > 0 && (
                                    <span className="badge badge-secondary ml-2">
                                        {filteredHistory.length} records
                                    </span>
                                )}
                            </h4>
                        </div>

                        <div className="section-body">
                            {history.length === 0 && !loading && !error ? (
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    No payment history found. Start by making your first payment!
                                    <br />
                                    <Link to="/payment/management" className="btn btn-primary btn-sm mt-3">
                                        <i className="fas fa-credit-card mr-1"></i>
                                        Go to Payment
                                    </Link>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="alert alert-warning">
                                    <i className="fas fa-filter mr-2"></i>
                                    No payments match your search criteria. Try adjusting your filters.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="thead-light">
                                            <tr>
                                                <th style={{ width: '5%' }}>#</th>
                                                <th style={{ width: '20%' }}>Car</th>
                                                <th style={{ width: '15%' }}>Brand</th>
                                                <th style={{ width: '10%' }}>Month</th>
                                                <th style={{ width: '15%' }}>Due Date</th>
                                                <th style={{ width: '15%' }}>Paid Date</th>
                                                <th style={{ width: '15%' }}>Amount</th>
                                                <th style={{ width: '5%' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistory.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="text-center">
                                                        <strong>{index + 1}</strong>
                                                    </td>
                                                    <td>
                                                        <strong className="text-primary">
                                                            {item.car || '-'}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        <span className="text-muted">
                                                            {item.brand || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-primary">
                                                            Month {item.month_number}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <i className="fas fa-calendar-alt mr-1 text-muted"></i>
                                                        {formatDateShort(item.due_date)}
                                                    </td>
                                                    <td>
                                                        <i className="fas fa-check-circle mr-1 text-success"></i>
                                                        {formatDate(item.paid_date)}
                                                    </td>
                                                    <td>
                                                        <strong className="text-success">
                                                            {formatRupiah(item.amount)}
                                                        </strong>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge badge-success">
                                                            <i className="fas fa-check"></i> Paid
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Summary Footer */}
                    {filteredHistory.length > 0 && (
                        <section className="mb-5">
                            <div className="card card-default">
                                <div className="card-header border-0 bg-light">
                                    <h5 className="mb-0">
                                        <i className="fas fa-calculator mr-2"></i>
                                        Filtered Summary
                                    </h5>
                                </div>
                                <div className="card-body p-0">
                                    <table className="table table-striped mb-0">
                                        <tbody>
                                            <tr>
                                                <th style={{ width: '30%' }}>
                                                    <i className="fas fa-receipt mr-1"></i> Total Transactions
                                                </th>
                                                <td>
                                                    <strong>{filteredHistory.length}</strong> payments
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>
                                                    <i className="fas fa-money-bill-wave mr-1"></i> Total Amount
                                                </th>
                                                <td className="text-success">
                                                    <strong>
                                                        {formatRupiah(
                                                            filteredHistory.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
                                                        )}
                                                    </strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>
                                                    <i className="fas fa-calendar mr-1"></i> Period
                                                </th>
                                                <td className="text-muted">
                                                    {formatDateShort(filteredHistory[filteredHistory.length - 1]?.paid_date)} 
                                                    {' '} - {' '}
                                                    {formatDateShort(filteredHistory[0]?.paid_date)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Back to Payment Button */}
                    <div className="text-center mb-5">
                        <Link to="/payment/management" className="btn btn-primary btn-lg">
                            <i className="fas fa-credit-card mr-2"></i>
                            Back to Payment Management
                        </Link>
                    </div>
                </div>
            </main>

            <footer>
                <div className="container">
                    <div className="text-center py-4 text-muted">
                        Copyright &copy; 2026
                    </div>
                </div>
            </footer>
        </>
    );
}