import React from 'react'
import { useState } from 'react'
import api from '../../../services/api';
import { Link, useNavigate } from 'react-router-dom';


export default function CreateValidation() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [job, setJob] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [income, setIncome] = useState("");
    const [reasonAccepted, setReasonAccepted] = useState("");
    const [setLoading] = useState(false);
    const [confirm, setConfirm] = useState(false);
    
    
    const hanldeDisabled = (e) => {
        e.preventDefault();

        const value = e.target.value;

        if(value === "yes") {
            setConfirm(false);
        } else {
            setConfirm(true);
        }
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post("/validation", {
                job : job,
                job_description : jobDescription,
                income : income,
                reason_accepted : reasonAccepted
            });

            navigate("/");
        } catch (error) {
            const data = error.response?.data;
            if(data?.errors) {
                const message = Object.values(data.errors).flat().join(" | ");
                setError(message);
            } else if(data?.message) {
                setError(data.message);
            } else if(error.message) {
                setError(error.message)
            } else {
                setError("Terjadi kesalahan");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
                <div className="container">
                    <a className="navbar-brand" href="#">Installment Cars</a>
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarsExampleDefault">
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <Link to="/" className="btn btn-outline-light">Login</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main>
                <header className="jumbotron">
                    <div className="container">
                        <h1 className="display-4">Request Data Validation</h1>
                    </div>
                </header>

                {error && (
                    <div classNameName="alert alert-danger mt-4">{error}</div>
                )}

                <div className="container">

                    <form onSubmit={handleSubmit}>
                        <div className="row mb-4">

                            <div className="col-md-6">
                                <div className="form-group">
                                    <div className="d-flex align-items-center mb-3">
                                        <label className="mr-3 mb-0">Are you working?</label>
                                        <select onChange={hanldeDisabled} className="form-control-sm">
                                            <option value="yes">Yes, I have</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <input type="text" placeholder="Your Job" value={job} onChange={(e) => setJob(e.target.value)} disabled={confirm} className="form-control mt-2 mb-2" />
                                    <textarea disabled={confirm} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="form-control" cols="30" rows="5" placeholder="describe what you do in your job"></textarea>
                                    <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Income (Rp)" disabled={confirm} className="form-control mt-2" />
                                </div>
                            </div>
                            
                            <div className="col-md-12">
                                <div className="form-group">
                                    <div className="d-flex align-items-center mb-3">
                                        <label className="mr-3 mb-0">Reason Accepted</label>
                                    </div>
                                    <textarea value={reasonAccepted} onChange={(e) => setReasonAccepted(e.target.value)} className="form-control" cols="30" rows="6" placeholder="Explain why you should be accepted"></textarea>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary" type="submit" >Send Request</button>
                    </form>

                </div>

            </main>

            <footer>
                <div className="container">
                    <div className="text-center py-4 text-muted">
                        Copyright &copy; 2024 - Web Tech ID
                    </div>
                </div>
            </footer>
        </>
    )
}
