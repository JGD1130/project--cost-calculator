import React, { useState } from 'react';
import { Calculator, DollarSign, Info, AlertCircle } from 'lucide-react';

export default function ProjectCostCalculator() {
  const [apiKey, setApiKey] = useState('');
  const [baseId, setBaseId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [projectTypes, setProjectTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [gsf, setGsf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [showConfig, setShowConfig] = useState(true);

  const handleConnect = async () => {
    if (!apiKey || !baseId) {
      setError('Please enter both API Key and Base ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Project%20Types`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Connection failed: ${response.status}`);
      }

      const data = await response.json();
      
      const types = data.records.map(record => ({
        id: record.id,
        name: record.fields.Name || record.fields.name,
        numProjects: record.fields['# of Projects'] || 0,
        avgCostPerGSF: record.fields['Avg Cost/GSF'] || 0,
        avgChangeOrder: record.fields['Avg Change Order %'] || 0,
      }));

      setProjectTypes(types);
      setIsConfigured(true);
      setShowConfig(false);
      setError('');
    } catch (err) {
      setError(`Connection Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimate = () => {
    if (!selectedType || !gsf || gsf <= 0) {
      setError('Please select a project type and enter a valid GSF');
      return;
    }

    const type = projectTypes.find(t => t.id === selectedType);
    if (!type) return;

    const gsfNum = parseFloat(gsf);
    const avgCost = type.avgCostPerGSF || 0;
    const totalCost = avgCost * gsfNum;
    const changeOrderAmt = totalCost * (type.avgChangeOrder / 100);
    const totalWithCO = totalCost + changeOrderAmt;

    setResults({
      projectType: type.name,
      gsf: gsfNum,
      avgCostPerGSF: avgCost,
      estimatedCost: totalCost,
      changeOrderPercent: type.avgChangeOrder,
      changeOrderAmount: changeOrderAmt,
      totalWithChangeOrders: totalWithCO,
      numProjects: type.numProjects,
    });
    setError('');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Calculator size={32} color="#4f46e5" />
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Project Cost Calculator
            </h1>
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Estimate construction costs based on historical project data
          </p>
        </div>

        {/* Configuration Panel */}
        {showConfig && (
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Airtable Configuration
              </h2>
              {isConfigured && (
                <button
                  onClick={() => setShowConfig(false)}
                  style={{
                    fontSize: '0.875rem',
                    color: '#4f46e5',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Hide Config
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Airtable Personal Access Token
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="pat..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}
                />
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                  Token must have "data.records:read" scope and access to your base
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Base ID
                </label>
                <input
                  type="text"
                  value={baseId}
                  onChange={(e) => setBaseId(e.target.value)}
                  placeholder="app..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}
                />
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                  Found in your Airtable URL after "airtable.com/"
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#9ca3af' : '#4f46e5',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Connecting...' : isConfigured ? 'Reconnect' : 'Connect to Airtable'}
              </button>
            </div>
          </div>
        )}

        {/* Show config button when hidden */}
        {!showConfig && isConfigured && (
          <button
            onClick={() => setShowConfig(true)}
            style={{
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#4f46e5',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Info size={16} />
            Show Configuration
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem'
          }}>
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Calculator Form */}
        {isConfigured && (
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Calculate Estimate
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Project Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                >
                  <option value="">Select a project type...</option>
                  {projectTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.numProjects} projects)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Project Area (GSF)
                </label>
                <input
                  type="number"
                  value={gsf}
                  onChange={(e) => setGsf(e.target.value)}
                  placeholder="Enter gross square feet"
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <button
                onClick={calculateEstimate}
                style={{
                  width: '100%',
                  background: '#4f46e5',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Calculator size={20} />
                Calculate Estimate
              </button>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <DollarSign size={24} color="#16a34a" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Cost Estimate
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Summary */}
              <div style={{
                background: 'linear-gradient(to right, #eef2ff, #dbeafe)',
                borderRadius: '0.5rem',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Project Type</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                      {results.projectType}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Project Area</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: '600', colo
