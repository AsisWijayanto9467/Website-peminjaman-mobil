import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api';

export default function List() {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [installment, setInstallment] = useState([]);

    const fetchData = async() => {
        try {
            const res = await api.get("/instalment_cars");
            setInstallment(res.data.cars || []);
        } catch (error) {
            const data = error.response?.data;
            if(data?.errors) {
                setError(Object.values(data.errors).flat().join(" | "));
            } else if(data?.message) {
                setError(data.message);
            } else {
                setError("Terjadi kesalahan");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    if(loading) {
        return <div>Loading....</div>
    }

    return (
        <>
            <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
                <div className="container">
                    <a className="navbar-brand" href="#">Installment Cars</a>

                    <button className="navbar-toggler" type="button">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse">
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    Marsito Kusmawati
                                </a>
                            </li>
                            <li className="nav-item">
                                <Link to="/" className="nav-link">
                                    Login
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main>
                {/* Header */}
                <header className="jumbotron">
                    <div className="container">
                        <h1 className="display-4">Cars</h1>
                    </div>
                </header>

                <div className="container mb-5">

                    <div className="section-header mb-4">
                        <h4 className="section-title text-muted font-weight-normal">
                            List of Cars
                        </h4>
                    </div>

                    <div className="section-body">

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        {installment.length === 0 && (
                            <div className="alert alert-warning">
                                No instalment cars available
                            </div>
                        )}

                        {installment.map((insta) => {

                            const isApplied = insta.is_applied === true;

                            return (
                                <article
                                    key={insta.id}
                                    className={`spot ${isApplied ? "unavailable" : ""}`}
                                >
                                    <div className="row">

                                        {/* LEFT */}
                                        <div className="col-5">
                                            <h5 className="text-primary">
                                                {insta.car}
                                            </h5>
                                            <span className="text-muted">
                                                {insta.description}
                                            </span>
                                        </div>

                                        <div className="col-4">
                                            <h5>Available Month</h5>
                                            <span className="text-muted">
                                                {insta.available_month
                                                    ?.map(m => `${m.month} Months`)
                                                    .join(", ")
                                                }
                                            </span>
                                        </div>

                                        <div className="col-3">

                                            {isApplied ? (
                                                <div className="bg-success text-white p-2">
                                                    Vacancies have been submitted
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/list/instalment/${insta.id}`)}
                                                    className="btn btn-danger btn-lg btn-block"
                                                >
                                                    Detail
                                                </button>
                                            )}

                                        </div>

                                    </div>
                                </article>
                            )
                        })}

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
