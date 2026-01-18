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
import {
  ExpandMore as ExpandMoreIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function Results() {
  const { executionId } = useParams();
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
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

  useEffect(() => {
    fetchResults();
    fetchSummary();
  }, [executionId, fetchResults, fetchSummary]);

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#1a1a1a',
            fontWeight: 600,
          }}
        >
          Execution Results - #{executionId}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => handleExport('json')}
            sx={{ mr: 1 }}
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => handleExport('html')}
            sx={{ mr: 1 }}
          >
            Export HTML
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderLeft: '4px solid', borderLeftColor: summary.safety_score >= 80 ? '#059669' : summary.safety_score >= 60 ? '#f59e0b' : '#b31e30' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Safety Score</Typography>
                <Typography variant="h3" sx={{ 
                  color: summary.safety_score >= 80 ? '#059669' : summary.safety_score >= 60 ? '#f59e0b' : '#b31e30', 
                  fontWeight: 700,
                  mb: 0.5
                }}>
                  {summary.safety_score !== null && summary.safety_score !== undefined 
                    ? summary.safety_score.toFixed(1) 
                    : 'N/A'}
                </Typography>
                {summary.safety_grade && (
                  <Typography variant="h5" sx={{ 
                    color: summary.safety_score >= 80 ? '#059669' : summary.safety_score >= 60 ? '#f59e0b' : '#b31e30',
                    fontWeight: 600
                  }}>
                    Grade: {summary.safety_grade}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                  Scale: 0-100 (100 = Perfect)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Total Results</Typography>
                <Typography variant="h4" sx={{ color: '#b31e30', fontWeight: 600 }}>
                  {summary.total_results}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>By Severity</Typography>
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

      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
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

      <TableContainer 
        component={Paper}
        sx={{ borderRadius: 0 }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Library</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Risk Type</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>
                  <Chip label={result.library} size="small" />
                </TableCell>
                <TableCell>{result.test_category}</TableCell>
                <TableCell>
                  <Chip
                    label={result.severity}
                    size="small"
                    sx={{
                      backgroundColor: getSeverityColor(result.severity),
                      color: 'white',
                    }}
                  />
                </TableCell>
                <TableCell>{result.risk_type}</TableCell>
                <TableCell>
                  {result.confidence_score
                    ? (result.confidence_score * 100).toFixed(1) + '%'
                    : '-'}
                </TableCell>
                <TableCell>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">View Evidence</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {result.evidence_prompt && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Prompt:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', p: 1, bgcolor: '#f9fafb', borderRadius: 0 }}>
                            {result.evidence_prompt}
                          </Typography>
                        </Box>
                      )}
                      {result.evidence_response && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Response:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', p: 1, bgcolor: '#f9fafb', borderRadius: 0 }}>
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
    </Box>
  );
}

export default Results;

