import React, { useEffect, useState } from 'react'
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [validation, setValidation] = useState(null);
    const [applications, setApplications] = useState([]);

    const [loadingValidation, setLoadingValidation] = useState(true);
    const [loadingApps, setLoadingApps] = useState(true);

    const userName = localStorage.getItem("name") || "Society User";

    const fetchValidation = async () => {
        try {
            const res = await api.get("/validations");
            setValidation(res.data.validation);
        } catch (err) {
            console.log(err);
            setError("Failed load validation");
        } finally {
            setLoadingValidation(false);
        }
    }

    const fetchApplications = async () => {
        try {
            const res = await api.get("/applications");
            setApplications(res.data.instalments || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoadingApps(false);
        }
    }

    useEffect(() => {
        fetchValidation();
        fetchApplications();
    }, []);

    const hasValidation = validation !== null;
    const isAccepted = validation?.status === "accepted";

    const badgeClass = (status) => {
        if (status === "accepted") return "badge badge-success";
        if (status === "rejected") return "badge badge-danger";
        return "badge badge-info";
    }

    const handleLogout = async () => {
        const res = await api.post("/auth/logout");
        alert(res.data.message);
        localStorage.clear();
        navigate("/");
    }

    // cek apakah semua installment tidak punya application
    const noApplications =
        applications.every(inst => (inst.applications || []).length === 0);

    return (
        <>
            <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
                <div className="container">
                    <span className="navbar-brand">Installment Cars</span>

                    <div className="ml-auto d-flex">
                        <span className="navbar-text text-white mr-3">
                            {userName}
                        </span>
                        <button onClick={handleLogout} className="btn btn-light btn-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ marginTop: 80 }}>

                <header className="jumbotron">
                    <div className="container">
                        <h1 className="display-4">Dashboard</h1>
                    </div>
                </header>

                <div className="container">

                    {/* VALIDATION */}
                    <section className="mb-5">
                        <h4 className="text-muted mb-3">My Data Validation</h4>

                        <div className="row">

                            {!hasValidation && !loadingValidation && (
                                <div className="col-md-4">
                                    <div className="card card-default">
                                        <div className="card-header">
                                            <h5 className="mb-0">Data Validation</h5>
                                        </div>
                                        <div className="card-body">
                                            <Link to="/create/validation" className="btn btn-primary btn-block">
                                                + Request validation
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasValidation && (
                                <div className="col-md-4">
                                    <div className="card card-default">
                                        <div className="card-header border-0">
                                            <h5 className="mb-0">Data Validation</h5>
                                        </div>

                                        <div className="card-body p-0">
                                            <table className="table table-striped mb-0">
                                                <tbody>
                                                    <tr>
                                                        <th>Status</th>
                                                        <td>
                                                            <span className={badgeClass(validation.status)}>
                                                                {validation.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th>Job</th>
                                                        <td className="text-muted">
                                                            {validation.job || "-"}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th>Income/Month</th>
                                                        <td className="text-muted">
                                                            Rp {validation.income || "-"}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th>Validator Notes</th>
                                                        <td className="text-muted">
                                                            {validation.validator_notes || "-"}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                    </div>
                                </div>
                            )}

                        </div>
                    </section>

                    {error && (
                        <div className="alert alert-danger">{error}</div>
                    )}

                    <section className="mb-5">

                        <div className="row mb-3">
                            <div className="col-md-8">
                                <h4 className="text-muted">My Installment Cars</h4>
                            </div>

                            {isAccepted && (
                                <div className="col-md-4">
                                    <Link to="/list/instalment" className="btn btn-primary btn-lg btn-block">
                                        + Add Installment Cars
                                    </Link>
                                </div>
                            )}
                        </div>

                        {!isAccepted && (
                            <div className="alert alert-warning">
                                Your validation must be approved by validator to Installment Cars.
                            </div>
                        )}

                        {isAccepted && (
                            <div className="row">

                                {loadingApps && (
                                    <div className="col-md-12">
                                        Loading applications...
                                    </div>
                                )}

                                {!loadingApps && noApplications && (
                                    <div className="col-md-12">
                                        <div className="alert alert-secondary">
                                            No installment applications yet
                                        </div>
                                    </div>
                                )}

                                {/* ✅ NESTED LOOP */}
                                {applications.map((inst, i) =>
                                    (inst.applications || []).map((app, j) => (
                                        <div key={`${i}-${j}`} className="col-md-6 mb-4">
                                            <div className="card card-default">
                                                <div className="card-header border-0">
                                                    <h5 className="mb-0">{inst.car}</h5>
                                                </div>

                                                <div className="card-body p-0">
                                                    <table className="table table-striped mb-0">
                                                        <tbody>
                                                            <tr>
                                                                <th>Description</th>
                                                                <td className="text-muted">
                                                                    {inst.description}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <th>Price</th>
                                                                <td className="text-muted">
                                                                    Rp {inst.price}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <th>Installment</th>
                                                                <td className="text-muted">
                                                                    {app.month} Months
                                                                    <span className={`${badgeClass(app.apply_status)} ml-2`}>
                                                                        {app.apply_status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <th>Notes</th>
                                                                <td className="text-muted">
                                                                    {app.notes}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                            </div>
                                        </div>
                                    ))
                                )}

                            </div>
                        )}

                    </section>

                </div>
            </main>

            <footer>
                <div className="container">
                    <div className="text-center py-4 text-muted">
                        Copyright © 2026
                    </div>
                </div>
            </footer>
        </>
    );
}
