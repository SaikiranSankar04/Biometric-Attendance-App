import React, { useState, useEffect } from 'react';

const RegisterUser = () => {
  const [status, setStatus] = useState('Idle');
  const [isRegistering, setIsRegistering] = useState(false);

  // Poll the /register-status endpoint every second
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:5001/register-status')
        .then((res) => res.json())
        .then((data) => setStatus(data.status))
        .catch((err) => console.error('Error fetching status:', err));
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Handle register button click
  const handleRegister = () => {
    fetch('http://localhost:5001/register', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then(() => {
        setIsRegistering(true);
        setStatus('Waiting for fingerprint...');
      })
      .catch((err) => {
        console.error('Error starting registration:', err);
        setStatus('Error starting registration');
      });
  };

  return (
    <div style={styles.container}>
      <h2>Register New Fingerprint</h2>
      <button onClick={handleRegister} disabled={isRegistering} style={styles.button}>
        {isRegistering ? 'Registering...' : 'Register New User'}
      </button>
      <div style={styles.statusBox}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
};

const styles = {
  container: {
    margin: '2rem auto',
    maxWidth: '400px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid #ccc',
    borderRadius: '12px',
    padding: '2rem',
    background: '#f9f9f9',
    boxShadow: '0 0 8px rgba(0,0,0,0.1)'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '8px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '1rem'
  },
  statusBox: {
    marginTop: '1rem',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '16px',
  }
};

export default RegisterUser;
