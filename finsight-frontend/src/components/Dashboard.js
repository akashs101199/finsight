import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
);

const Dashboard = ({ onLogout }) => {
  const [data, setData] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  };

  useEffect(() => {
  axios.get('http://localhost:5050/insights', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(res => setData(res.data))
    .catch(err => {
      console.error("API error:", err);
      if (err.response?.status === 401) onLogout();
    });
}, [onLogout]);

  const fetchAdvice = () => {
    setLoadingAdvice(true);
    axios.get('http://localhost:5050/advice', { headers })
      .then(res => {
        setAdvice(res.data);
        setLoadingAdvice(false);
      })
      .catch(err => {
        console.error("Advice API error:", err);
        setAdvice({ advice: 'Failed to fetch advice.' });
        setLoadingAdvice(false);
      });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      setUploadMessage("Please select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    axios.post('http://localhost:5050/upload', formData, { headers })
      .then(res => {
        setUploadMessage(`✅ ${res.data.message}`);
        setFile(null);
        setAdvice(null);
        axios.get('http://localhost:5050/insights', { headers })
          .then(res => setData(res.data));
      })
      .catch(err => {
        console.error("Upload error:", err);
        setUploadMessage("❌ Upload failed.");
      });
  };

  if (!data) return <p style={{ textAlign: 'center' }}>Loading dashboard...</p>;

  const barData = {
    labels: data.by_category.map(d => d.label),
    datasets: [{
      label: 'Spend by Category',
      data: data.by_category.map(d => d.total),
      backgroundColor: 'rgba(75, 192, 192, 0.6)'
    }]
  };

  const lineData = {
    labels: data.by_month.map(d => d.label),
    datasets: [{
      label: 'Monthly Spend',
      data: data.by_month.map(d => d.total),
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      tension: 0.3
    }]
  };

  const pieData = {
    labels: data.by_payment_method.map(d => d.label),
    datasets: [{
      label: 'Payment Methods',
      data: data.by_payment_method.map(d => d.total),
      backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff']
    }]
  };

  const merchantData = {
    labels: data.top_merchants.map(d => d.label),
    datasets: [{
      label: 'Top Merchants',
      data: data.top_merchants.map(d => d.total),
      backgroundColor: 'rgba(153, 102, 255, 0.6)'
    }]
  };

  return (
    <div style={{ width: '85%', margin: 'auto', textAlign: 'center' }}>
      <h2 style={{ marginTop: '20px' }}>FinSight – Personal Finance Dashboard</h2>

      {/* 🔴 LOGOUT BUTTON */}
      <button onClick={onLogout} style={{
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        Logout
      </button>

      <div style={{ marginTop: 40 }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ marginRight: 10 }}
        />
        <button onClick={handleUpload} style={{
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Upload CSV
        </button>
        {uploadMessage && <p style={{ marginTop: 10 }}>{uploadMessage}</p>}
      </div>

      <div style={{ marginTop: 50 }}>
        <Bar data={barData} options={{ responsive: true }} />
      </div>

      <div style={{ marginTop: 50 }}>
        <Line data={lineData} options={{ responsive: true }} />
      </div>

      <div style={{ marginTop: 50 }}>
        <Pie data={pieData} options={{ responsive: true }} />
      </div>

      <div style={{ marginTop: 50 }}>
        <Bar data={merchantData} options={{ indexAxis: 'y', responsive: true }} />
      </div>

      <div style={{ marginTop: 50 }}>
        <button onClick={fetchAdvice} style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#36a2eb',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Get Financial Advice
        </button>
      </div>

      {loadingAdvice && <p style={{ marginTop: 20 }}>Fetching advice from AI...</p>}

      {advice && (
        <div style={{
          marginTop: 30,
          padding: 20,
          backgroundColor: '#f5f5f5',
          borderRadius: '10px',
          textAlign: 'left',
          width: '80%',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h3>Spending Summary</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{advice.summary}</pre>
          <h3 style={{ marginTop: 20 }}>AI-Powered Advice</h3>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{advice.advice}</pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
