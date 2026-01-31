import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconNames } from '../utils/icons';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function Results() {
  const { executionId } = useParams();
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [driftSummary, setDriftSummary] = useState(null);
  const [driftResults, setDriftResults] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [selectedBaseline, setSelectedBaseline] = useState('');
  const [comparing, setComparing] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    library: '',
    test_category: '',
  });

  const fetchResults = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.library) params.append('library', filters.library);
      if (filters.test_category) params.append('test_category', filters.test_category);

      const response = await axios.get(
        `${API_BASE}/results/execution/${executionId}?${params.toString()}`
      );
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  }, [executionId, filters]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/results/execution/${executionId}/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, [executionId]);

  const fetchDriftSummary = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/drift/execution/${executionId}/summary`);
      setDriftSummary(response.data);
    } catch (error) {
      // Drift summary may not exist, that's okay
      setDriftSummary(null);
    }
  }, [executionId]);

  const fetchDriftResults = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/drift/execution/${executionId}`);
      setDriftResults(response.data);
    } catch (error) {
      setDriftResults([]);
    }
  }, [executionId]);

  const fetchBaselines = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/baselines`);
      setBaselines(response.data);
    } catch (error) {
      console.error('Error fetching baselines:', error);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    fetchSummary();
    fetchDriftSummary();
    fetchDriftResults();
    fetchBaselines();
  }, [executionId, fetchResults, fetchSummary, fetchDriftSummary, fetchDriftResults, fetchBaselines]);

  useEffect(() => {
    fetchResults();
  }, [filters, fetchResults]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#b31e30';
      case 'high':
        return '#d97706';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#059669';
      case 'info':
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  const handleCompareWithBaseline = async () => {
    if (!selectedBaseline) {
      alert('Please select a baseline');
      return;
    }

    setComparing(true);
    try {
      const baseline = baselines.find(b => b.id === parseInt(selectedBaseline));
      if (!baseline) {
        alert('Baseline not found');
        return;
      }

      await axios.post(`${API_BASE}/drift/compare`, {
        execution_id: parseInt(executionId),
        baseline_execution_id: baseline.execution_id,
        baseline_mode: 'explicit',
      });

      // Poll for results
      setTimeout(() => {
        fetchDriftSummary();
        fetchDriftResults();
        setComparing(false);
      }, 2000);
    } catch (error) {
      console.error('Error comparing with baseline:', error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
      setComparing(false);
    }
  };

  const handleComparePrevious = async () => {
    setComparing(true);
    try {
      await axios.post(`${API_BASE}/drift/compare`, {
        execution_id: parseInt(executionId),
        baseline_mode: 'previous',
      });

      // Poll for results
      setTimeout(() => {
        fetchDriftSummary();
        fetchDriftResults();
        setComparing(false);
      }, 2000);
    } catch (error) {
      console.error('Error comparing with previous run:', error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
      setComparing(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(
        `${API_BASE}/reports/execution/${executionId}/${format}`,
        { responseType: format === 'pdf' ? 'blob' : format === 'html' ? 'text' : 'json' }
      );

      if (format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `promptshield_report_${executionId}.pdf`);
        document.body.appendChild(link);
        link.click();
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `promptshield_report_${executionId}.json`);
        document.body.appendChild(link);
        link.click();
      } else if (format === 'html') {
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `promptshield_report_${executionId}.html`);
        document.body.appendChild(link);
        link.click();
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const uniqueLibraries = [...new Set(results.map(r => r.library))];
  const uniqueCategories = [...new Set(results.map(r => r.test_category))];

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={5} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: 2 }}>
        <Typography
          variant="h4"
          sx={{
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '-0.02em',
          }}
        >
          Execution Results - #{executionId}
          {driftSummary && driftSummary.drift_score < 100 && (
            <Chip
              icon={<FontAwesomeIcon icon={IconNames.faExclamationTriangle} />}
              label="Drift Detected"
              color="warning"
              size="small"
              sx={{ ml: 2, fontWeight: 600 }}
            />
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FontAwesomeIcon icon={IconNames.faDownload} />}
            onClick={() => handleExport('json')}
            sx={{ borderRadius: 28, height: '40px' }}
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            startIcon={<FontAwesomeIcon icon={IconNames.faDownload} />}
            onClick={() => handleExport('html')}
            sx={{ borderRadius: 28, height: '40px' }}
          >
            Export HTML
          </Button>
          <Button
            variant="outlined"
            startIcon={<FontAwesomeIcon icon={IconNames.faDownload} />}
            onClick={() => handleExport('pdf')}
            sx={{ borderRadius: 28, height: '40px' }}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Baseline Comparison Section */}
      <Card sx={{
        mb: 4,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
        border: '1px solid #d8c2be',
        borderRadius: 4,
        background: 'linear-gradient(rgba(220, 38, 38, 0.03), rgba(220, 38, 38, 0.03)), #ffffff',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 500, fontSize: '1.25rem', color: '#0f172a' }}>
            Drift Analysis
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={IconNames.faHistory} />}
              onClick={handleComparePrevious}
              disabled={comparing}
              sx={{ borderRadius: 20, height: '40px', borderColor: '#857370', color: '#2c1512' }}
            >
              For Previous Run
            </Button>

            <Typography variant="body2" sx={{ color: '#64748b' }}>or compare with specific baseline:</Typography>

            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Select Baseline</InputLabel>
              <Select
                value={selectedBaseline}
                onChange={(e) => setSelectedBaseline(e.target.value)}
                label="Select Baseline"
                sx={{ borderRadius: 20 }}
              >
                {baselines.map((baseline) => (
                  <MenuItem key={baseline.id} value={baseline.id}>
                    {baseline.name} {baseline.baseline_tag && `(${baseline.baseline_tag})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<FontAwesomeIcon icon={IconNames.faExchangeAlt} />}
              onClick={handleCompareWithBaseline}
              disabled={comparing || !selectedBaseline}
              sx={{ minWidth: '140px', height: '40px', borderRadius: 20 }}
            >
              {comparing ? 'Comparing...' : 'Compare'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              backgroundColor: summary.safety_score >= 80 ? '#ecfdf5' : summary.safety_score >= 60 ? '#fffbeb' : '#fef2f2',
              boxShadow: 'none',
              border: 'none',
              borderRadius: '24px',
              height: '100%',
              position: 'relative',
              overflow: 'visible',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: summary.safety_score >= 80 ? '#047857' : summary.safety_score >= 60 ? '#b45309' : '#b91c1c' }}>
                    Safety Score
                  </Typography>
                  <FontAwesomeIcon
                    icon={IconNames.faShieldAlt}
                    style={{
                      fontSize: '24px',
                      color: summary.safety_score >= 80 ? '#059669' : summary.safety_score >= 60 ? '#d97706' : '#dc2626',
                      opacity: 0.8
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                  <Typography variant="h2" sx={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '3.5rem',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                  }}>
                    {summary.safety_score !== null && summary.safety_score !== undefined
                      ? summary.safety_score.toFixed(1)
                      : 'N/A'}
                  </Typography>
                  {summary.safety_grade && (
                    <Chip
                      label={`Grade ${summary.safety_grade}`}
                      sx={{
                        backgroundColor: '#ffffff',
                        color: summary.safety_score >= 80 ? '#059669' : summary.safety_score >= 60 ? '#d97706' : '#dc2626',
                        fontWeight: 700,
                        borderRadius: '8px',
                        height: '28px'
                      }}
                    />
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                  0-100 Scale (High is Safe)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {driftSummary && (
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                backgroundColor: '#eff6ff', // Blue-50
                boxShadow: 'none',
                border: 'none',
                borderRadius: '24px',
                height: '100%',
                position: 'relative',
                overflow: 'visible',
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#1e40af' }}>
                      Drift Score
                    </Typography>
                    <FontAwesomeIcon icon={IconNames.faExchangeAlt} style={{ fontSize: '24px', color: '#3b82f6', opacity: 0.8 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                    <Typography variant="h2" sx={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '3.5rem',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                    }}>
                      {driftSummary.drift_score !== null && driftSummary.drift_score !== undefined
                        ? driftSummary.drift_score.toFixed(1)
                        : 'N/A'}
                    </Typography>
                    {driftSummary.drift_grade ? (
                      <Chip
                        label={`Grade ${driftSummary.drift_grade}`}
                        sx={{
                          backgroundColor: '#ffffff',
                          color: '#2563eb',
                          fontWeight: 700,
                          borderRadius: '8px',
                          height: '28px'
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>No baseline</Typography>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                    100 = No Deviation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              backgroundColor: '#faf5ff', // Purple-50
              boxShadow: 'none',
              border: 'none',
              borderRadius: '24px',
              height: '100%',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#6b21a8' }}>
                    Findings
                  </Typography>
                  <FontAwesomeIcon icon={IconNames.faList} style={{ fontSize: '24px', color: '#9333ea', opacity: 0.8 }} />
                </Box>
                <Typography variant="h2" sx={{ color: '#0f172a', fontWeight: 800, fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {summary.total_results}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              height: '100%',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" gutterBottom sx={{ mb: 2, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  By Severity
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(summary.by_severity || {}).map(([severity, count]) => (
                    <Chip
                      key={severity}
                      label={`${severity.toUpperCase()}: ${count}`}
                      sx={{
                        backgroundColor: getSeverityColor(severity),
                        color: 'white',
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sub-Scores Section - Safety Scores by Library and Category */}
      {summary && (summary.safety_scores_by_library || summary.safety_scores_by_category) && (
        Object.keys(summary.safety_scores_by_library || {}).length > 0 ||
        Object.keys(summary.safety_scores_by_category || {}).length > 0
      ) && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              Detailed Score Breakdown
            </Typography>

            <Grid container spacing={3}>
              {/* Safety Scores by Library */}
              {summary.safety_scores_by_library && Object.keys(summary.safety_scores_by_library).length > 0 && (
                <Grid item xs={12} lg={6}>
                  <Card sx={{
                    backgroundColor: '#ffffff',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: '24px',
                    height: '100%',
                    p: 2,
                  }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pl: 1 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '12px',
                          backgroundColor: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}>
                          <FontAwesomeIcon icon={IconNames.faCode} style={{ fontSize: '1.25rem', color: '#3b82f6' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#0f172a' }}>
                          Library Performance
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {Object.entries(summary.safety_scores_by_library).map(([library, score]) => {
                          const grade = summary.safety_grades_by_library?.[library] || 'N/A';
                          const bgColor = score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : '#fef2f2';
                          const textColor = score >= 80 ? '#047857' : score >= 60 ? '#b45309' : '#b91c1c';
                          const accentColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#dc2626';

                          return (
                            <Grid item xs={12} sm={6} key={library}>
                              <Card sx={{
                                backgroundColor: bgColor,
                                boxShadow: 'none',
                                border: 'none',
                                borderRadius: '16px',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-2px)' }
                              }}>
                                <CardContent sx={{ p: 2.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="body2" sx={{
                                      fontWeight: 700,
                                      fontSize: '0.875rem',
                                      color: textColor,
                                      textTransform: 'capitalize',
                                    }}>
                                      {library}
                                    </Typography>
                                    <Chip
                                      label={grade}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#ffffff',
                                        color: accentColor,
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        height: '24px',
                                        borderRadius: '6px'
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="h3" sx={{
                                    color: '#0f172a',
                                    fontWeight: 800,
                                    fontSize: '2rem',
                                    lineHeight: 1,
                                  }}>
                                    {score.toFixed(0)}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Safety Scores by Category */}
              {summary.safety_scores_by_category && Object.keys(summary.safety_scores_by_category).length > 0 && (
                <Grid item xs={12} lg={6}>
                  <Card sx={{
                    backgroundColor: '#ffffff',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: '24px',
                    height: '100%',
                    p: 2,
                  }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pl: 1 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '12px',
                          backgroundColor: '#f3e8ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}>
                          <FontAwesomeIcon icon={IconNames.faShieldAlt} style={{ fontSize: '1.25rem', color: '#9333ea' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#0f172a' }}>
                          Risk Categories
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {Object.entries(summary.safety_scores_by_category).map(([category, score]) => {
                          const grade = summary.safety_grades_by_category?.[category] || 'N/A';
                          const bgColor = score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : '#fef2f2';
                          const textColor = score >= 80 ? '#047857' : score >= 60 ? '#b45309' : '#b91c1c';
                          const accentColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#dc2626';

                          return (
                            <Grid item xs={12} sm={6} key={category}>
                              <Card sx={{
                                backgroundColor: bgColor,
                                boxShadow: 'none',
                                border: 'none',
                                borderRadius: '16px',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-2px)' }
                              }}>
                                <CardContent sx={{ p: 2.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="body2" sx={{
                                      fontWeight: 700,
                                      fontSize: '0.875rem',
                                      color: textColor,
                                      textTransform: 'capitalize',
                                    }}>
                                      {category.replace('_', ' ')}
                                    </Typography>
                                    <Chip
                                      label={grade}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#ffffff',
                                        color: accentColor,
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        height: '24px',
                                        borderRadius: '6px'
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="h3" sx={{
                                    color: '#0f172a',
                                    fontWeight: 800,
                                    fontSize: '2rem',
                                    lineHeight: 1,
                                  }}>
                                    {score.toFixed(0)}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            label="Severity"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="info">Info</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Library</InputLabel>
          <Select
            value={filters.library}
            onChange={(e) => setFilters({ ...filters, library: e.target.value })}
            label="Library"
          >
            <MenuItem value="">All</MenuItem>
            {uniqueLibraries.map((lib) => (
              <MenuItem key={lib} value={lib}>
                {lib}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.test_category}
            onChange={(e) => setFilters({ ...filters, test_category: e.target.value })}
            label="Category"
          >
            <MenuItem value="">All</MenuItem>
            {uniqueCategories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card sx={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: 'none',
        border: 'none',
        overflow: 'hidden',
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Library
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Severity
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Risk Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confidence
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                  <TableCell>
                    <Chip
                      label={result.library}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        borderRadius: 2,
                        backgroundColor: '#f8fafc',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {result.test_category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={result.severity}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: result.severity === 'critical' ? '#fef2f2' : result.severity === 'high' ? '#fff7ed' : result.severity === 'medium' ? '#fefce8' : '#f0fdf4',
                        color: result.severity === 'critical' ? '#b91c1c' : result.severity === 'high' ? '#c2410c' : result.severity === 'medium' ? '#a16207' : '#15803d',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.875rem' }}>
                      {result.risk_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                      {result.confidence_score
                        ? (result.confidence_score * 100).toFixed(1) + '%'
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Accordion>
                      <AccordionSummary expandIcon={<FontAwesomeIcon icon={IconNames.faChevronDown} />}>
                        <Typography variant="body2">View Evidence</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {result.evidence_prompt && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Prompt:
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', p: 1, bgcolor: '#f9fafb', borderRadius: 2 }}>
                              {result.evidence_prompt}
                            </Typography>
                          </Box>
                        )}
                        {result.evidence_response && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Response:
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', p: 1, bgcolor: '#f9fafb', borderRadius: 2 }}>
                              {result.evidence_response}
                            </Typography>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Drift Results Table */}
      {driftResults.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '1.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Drift Detection Results
          </Typography>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '24px',
              backgroundColor: '#ffffff',
              boxShadow: 'none',
              border: 'none',
              overflow: 'auto',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Drift Type</TableCell>
                  <TableCell>Metric</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {driftResults.map((drift) => (
                  <TableRow key={drift.id}>
                    <TableCell>
                      <Chip label={drift.drift_type} size="small" />
                    </TableCell>
                    <TableCell>{drift.metric}</TableCell>
                    <TableCell>{drift.value.toFixed(4)}</TableCell>
                    <TableCell>{drift.threshold.toFixed(4)}</TableCell>
                    <TableCell>
                      <Chip
                        label={drift.severity}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: drift.severity === 'critical' ? '#fef2f2' : drift.severity === 'high' ? '#fff7ed' : drift.severity === 'medium' ? '#fefce8' : '#f0fdf4',
                          color: drift.severity === 'critical' ? '#b91c1c' : drift.severity === 'high' ? '#c2410c' : drift.severity === 'medium' ? '#a16207' : '#15803d',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {drift.confidence
                        ? (drift.confidence * 100).toFixed(1) + '%'
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Accordion>
                        <AccordionSummary expandIcon={<FontAwesomeIcon icon={IconNames.faChevronDown} />}>
                          <Typography variant="body2">View Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', p: 1, bgcolor: '#f9fafb', borderRadius: 2, whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(drift.details, null, 2)}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

export default Results;

