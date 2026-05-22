import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../../../services/api';

export default function DetailList() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [installment, setInstallment] = useState(null);
    const [validation, setValidation] = useState(null);

    const [selectedMonthId, setSelectedMonthId] = useState("");
    const [selectedMonthValue, setSelectedMonthValue] = useState(0);
    const [notes, setNotes] = useState("");

    const fetchData = async () => {
        try {
            const [carRes, valRes] = await Promise.all([
                api.get(`/instalment_cars/${id}`),
                api.get(`/validations`)
            ]);

            setInstallment(carRes.data.instalment);
            setValidation(valRes.data.validation);

        } catch (err) {
            const data = err.response?.data;
            setError(data?.message || "Failed load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const monthlyNominal =
            selectedMonthValue > 0
            ? Math.ceil(installment?.price / selectedMonthValue)
            : 0;

    const incomeEnough = validation?.income >= monthlyNominal;

    const handleApply = async () => {
        if (!selectedMonthId) {
            setError("Please select months");
            return;
        }

        if (!notes) {
            setError("Notes required");
            return;
        }

        try {
            const res = await api.post("/applications", {
                installment_id: installment.id,
                months: selectedMonthId,
                notes: notes
            });

            setSuccess(res.data.message);

            setTimeout(() => {
                navigate("/dashboard");
            }, 1200);

        } catch (err) {
            const data = err.response?.data;
            setError(data?.message || "Apply failed");
        }
    };

    if (loading || !installment) {
        return <div>Loading.....</div>
    }

    return (
        <>
            <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
                <div className="container">
                    <Link to="/list/instalment" className="navbar-brand">
                        Installment Cars
                    </Link>

                    <div className="collapse navbar-collapse">
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <a className="nav-link">Marsito Kusmawati</a>
                            </li>
                            <li className="nav-item">
                                <Link to="/" className="nav-link">Logout</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main>

                {/* HEADER — SAMA PERSIS */}
                <header className="jumbotron">
                    <div className="container text-center">
                        <div>
                            <h1 className="display-4">{installment.car}</h1>
                            <span className="text-muted">
                                Brand : {installment.brand}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="container">

                    {error && (
                        <div className="alert alert-danger">{error}</div>
                    )}

                    {success && (
                        <div className="alert alert-success">{success}</div>
                    )}

                    <div className="row mb-3">
                        <div className="col-md-12">
                            <div className="form-group">
                                <h3>Description</h3>
                                {installment.description}
                            </div>
                        </div>

                        <div className="col-md-12">
                            <div className="form-group">
                                <h3>
                                    Price :
                                    <span className="badge badge-primary ml-2">
                                        Rp. {installment.price}
                                    </span>
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-3">

                        <div className="col-md-12">
                            <div className="form-group">
                                <h3>Select Months</h3>

                                <select
                                    className="form-control"
                                    value={selectedMonthId}
                                    onChange={(e) => {
                                        const m = installment.available_month
                                            .find(x => x.id == e.target.value);

                                        setSelectedMonthId(e.target.value);
                                        setSelectedMonthValue(m?.month || 0);
                                    }}
                                >
                                    <option value="">-- select --</option>

                                    {installment.available_month.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.month} Months
                                        </option>
                                    ))}
                                </select>

                            </div>
                        </div>
                        <div className="col-md-12">
                            <div className="form-group">
                                <h3>
                                    Nominal/Month :
                                    <span className="badge badge-primary ml-2">
                                        Rp. {monthlyNominal || 0}
                                    </span>
                                </h3>
                            </div>
                        </div>
ijklnou 
                        {/* NOTES */}
                        <div className="col-md-12">
                            <div className="form-group">
                                <div className="d-flex align-items-center mb-3">
                                    <label className="mr-3 mb-0">
                                        Notes
                                    </label>
                                </div>

                                <textarea
                                    className="form-control"
                                    rows="6"
                                    value={notes}
                                    onChange={(e)=>setNotes(e.target.value)}
                                    placeholder="Explain why your installment should be approved"
                                />
                            </div>
                        </div>

                        {/* APPLY BUTTON */}
                        <div className="col-md-12">
                            <div className="form-group">
                                <div className="d-flex align-items-center mb-3">

                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleApply}
                                        disabled={!incomeEnough}
                                    >
                                        Apply
                                    </button>

                                    {!incomeEnough && monthlyNominal > 0 && (
                                        <span className="text-danger ml-3">
                                            Income not sufficient
                                        </span>
                                    )}

                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </main>

            <footer>
                <div className="container">
                    <div className="text-center py-4 text-muted">
                        Copyright © 2024 - Web Tech ID
                    </div>
                </div>
            </footer>
        </>
    )
}
