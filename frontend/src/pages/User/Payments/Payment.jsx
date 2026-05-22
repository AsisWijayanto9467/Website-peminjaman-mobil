import React, { useEffect, useState } from 'react'
import api from '../../../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Payment() {
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [schedule, setSchedule] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);
    
    const userName = localStorage.getItem("name") || "Society User";

    useEffect(() => {
        fetchPaymentSchedule();
    }, []);

    const fetchPaymentSchedule = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/payments/schedule");
            setSchedule(res.data.payments);
        } catch (err) {
            console.log(err);
            const data = err.response?.data;
            if (data?.message) {
                setError(data.message);
            } else {
                setError("Failed to load payment schedule");
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

    const handleSelectPayment = (payment) => {
        setSelectedPayment(payment);
        setPaymentAmount(payment.payment_amount);
        setError("");
        setSuccess("");
    };

    const handlePay = async (e) => {
        e.preventDefault();
        
        if (!selectedPayment) {
            setError("Please select a payment to pay");
            return;
        }

        if (!paymentAmount || paymentAmount < selectedPayment.payment_amount) {
            setError(`Payment amount must be at least Rp ${formatRupiah(selectedPayment.payment_amount)}`);
            return;
        }

        try {
            setProcessingPayment(true);
            setError("");
            setSuccess("");

            const res = await api.post("/payments/pay", {
                payment_id: selectedPayment.id,
                payment_amount: parseFloat(paymentAmount)
            });

            setSuccess(res.data.message || "Payment successful!");
            setSelectedPayment(null);
            setPaymentAmount("");
            
            // Refresh schedule after payment
            await fetchPaymentSchedule();
            
        } catch (err) {
            console.log(err);
            const data = err.response?.data;
            if (data?.message) {
                setError(data.message);
            } else if (data?.errors) {
                setError(Object.values(data.errors).flat().join(" | "));
            } else {
                setError("Payment failed");
            }
        } finally {
            setProcessingPayment(false);
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
            year: 'numeric'
        });
    };

    const getStatusBadge = (status, isOverdue) => {
        if (status === 'paid') return 'badge badge-success';
        if (status === 'late' || isOverdue) return 'badge badge-danger';
        return 'badge badge-warning';
    };

    const getStatusLabel = (status, isOverdue) => {
        if (status === 'paid') return 'Paid';
        if (status === 'late' || isOverdue) return 'Overdue';
        return 'Unpaid';
    };

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
                        <p className="mt-3 text-muted">Loading payment schedule...</p>
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
                            <i className="fas fa-credit-card mr-2"></i>
                            Payment Management
                        </h1>
                        <p className="lead">Manage and pay your installments</p>
                    </div>
                </header>

                <div className="container">
                    {/* Error & Success Messages */}
                    {error && (
                        <div className="alert alert-danger">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <i className="fas fa-check-circle mr-2"></i>
                            {success}
                        </div>
                    )}

                    {schedule && (
                        <>
                            {/* Car Info & Summary */}
                            <section className="mb-5">
                                <div className="row">
                                    {/* Car Info */}
                                    <div className="col-md-6 mb-4">
                                        <div className="card card-default">
                                            <div className="card-header border-0">
                                                <h5 className="mb-0">
                                                    <i className="fas fa-car mr-2"></i>
                                                    Car Information
                                                </h5>
                                            </div>
                                            <div className="card-body p-0">
                                                <table className="table table-striped mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <th style={{ width: '30%' }}>Car</th>
                                                            <td className="text-muted">
                                                                {schedule.car_info.car || '-'}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Brand</th>
                                                            <td className="text-muted">
                                                                {schedule.car_info.brand || '-'}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Tenor</th>
                                                            <td className="text-muted">
                                                                {schedule.car_info.tenor || '-'}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Summary */}
                                    <div className="col-md-6 mb-4">
                                        <div className="card card-default">
                                            <div className="card-header border-0">
                                                <h5 className="mb-0">
                                                    <i className="fas fa-chart-pie mr-2"></i>
                                                    Payment Summary
                                                </h5>
                                            </div>
                                            <div className="card-body p-0">
                                                <table className="table table-striped mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <th style={{ width: '40%' }}>
                                                                <i className="fas fa-coins mr-1"></i> Total Amount
                                                            </th>
                                                            <td className="text-muted">
                                                                <strong>{formatRupiah(schedule.summary.total_amount)}</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>
                                                                <i className="fas fa-check-circle mr-1 text-success"></i> Total Paid
                                                            </th>
                                                            <td className="text-success">
                                                                <strong>{formatRupiah(schedule.summary.total_paid)}</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>
                                                                <i className="fas fa-clock mr-1 text-warning"></i> Remaining
                                                            </th>
                                                            <td className="text-warning">
                                                                <strong>{formatRupiah(schedule.summary.remaining_amount)}</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>
                                                                <i className="fas fa-calendar-check mr-1"></i> Progress
                                                            </th>
                                                            <td>
                                                                <span className="badge badge-success mr-1">
                                                                    {schedule.summary.paid_months} Paid
                                                                </span>
                                                                <span className="badge badge-warning mr-1">
                                                                    {schedule.summary.unpaid_months} Unpaid
                                                                </span>
                                                                {schedule.summary.late_months > 0 && (
                                                                    <span className="badge badge-danger">
                                                                        {schedule.summary.late_months} Late
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Schedule */}
                            <section className="mb-5">
                                <h4 className="text-muted mb-3">
                                    <i className="fas fa-list-alt mr-2"></i>
                                    Payment Schedule
                                </h4>

                                {schedule.schedule.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        No payment schedule found
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-hover">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th>Month</th>
                                                    <th>Amount</th>
                                                    <th>Due Date</th>
                                                    <th>Status</th>
                                                    <th>Paid Date</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {schedule.schedule.map((payment) => (
                                                    <tr key={payment.id} className={
                                                        payment.status === 'paid' 
                                                            ? 'table-success' 
                                                            : payment.is_overdue 
                                                                ? 'table-danger' 
                                                                : ''
                                                    }>
                                                        <td>
                                                            <strong>Month {payment.month_number}</strong>
                                                        </td>
                                                        <td>{formatRupiah(payment.payment_amount)}</td>
                                                        <td>{formatDate(payment.due_date)}</td>
                                                        <td>
                                                            <span className={getStatusBadge(payment.status, payment.is_overdue)}>
                                                                <i className={`fas fa-${payment.status === 'paid' ? 'check' : payment.is_overdue ? 'exclamation' : 'clock'} mr-1`}></i>
                                                                {getStatusLabel(payment.status, payment.is_overdue)}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(payment.paid_date)}</td>
                                                        <td>
                                                            {payment.status !== 'paid' ? (
                                                                <button
                                                                    onClick={() => handleSelectPayment(payment)}
                                                                    className="btn btn-primary btn-sm"
                                                                >
                                                                    <i className="fas fa-credit-card mr-1"></i>
                                                                    Pay Now
                                                                </button>
                                                            ) : (
                                                                <span className="text-success">
                                                                    <i className="fas fa-check-circle mr-1"></i>
                                                                    Paid
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {/* Payment Form */}
                            {selectedPayment && (
                                <section className="mb-5">
                                    <div className="card card-default">
                                        <div className="card-header border-0 bg-primary text-white">
                                            <h5 className="mb-0">
                                                <i className="fas fa-credit-card mr-2"></i>
                                                Pay Installment - Month {selectedPayment.month_number}
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            <form onSubmit={handlePay}>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>
                                                                <i className="fas fa-calendar mr-1"></i>
                                                                Due Date
                                                            </label>
                                                            <input 
                                                                type="text" 
                                                                className="form-control" 
                                                                value={formatDate(selectedPayment.due_date)} 
                                                                disabled 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>
                                                                <i className="fas fa-tag mr-1"></i>
                                                                Required Amount
                                                            </label>
                                                            <input 
                                                                type="text" 
                                                                className="form-control" 
                                                                value={formatRupiah(selectedPayment.payment_amount)} 
                                                                disabled 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label>
                                                        <i className="fas fa-money-bill-wave mr-1"></i>
                                                        Payment Amount *
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control form-control-lg"
                                                        value={paymentAmount}
                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                        placeholder="Enter payment amount"
                                                        min={selectedPayment.payment_amount}
                                                        required
                                                    />
                                                    <small className="form-text text-muted">
                                                        Minimum payment: {formatRupiah(selectedPayment.payment_amount)}
                                                    </small>
                                                </div>

                                                <div className="d-flex">
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-success btn-lg mr-2"
                                                        disabled={processingPayment}
                                                    >
                                                        {processingPayment ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-check-circle mr-1"></i>
                                                                Confirm Payment
                                                            </>
                                                        )}
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-secondary btn-lg"
                                                        onClick={() => {
                                                            setSelectedPayment(null);
                                                            setPaymentAmount("");
                                                            setError("");
                                                        }}
                                                        disabled={processingPayment}
                                                    >
                                                        <i className="fas fa-times mr-1"></i>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {/* No Schedule Found */}
                    {!schedule && !loading && !error && (
                        <div className="alert alert-info">
                            <i className="fas fa-info-circle mr-2"></i>
                            No payment schedule available. Your application might not be approved yet.
                        </div>
                    )}
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