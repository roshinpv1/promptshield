import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconNames } from '../utils/icons';
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function Executions() {
  const [executions, setExecutions] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [open, setOpen] = useState(false);
  const [baselineDialogOpen, setBaselineDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [baselineName, setBaselineName] = useState('');
  const [baselineTag, setBaselineTag] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [selectedConfig, setSelectedConfig] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExecutions();
    fetchPipelines();
    fetchLlmConfigs();
    fetchBaselines();
    
    // Auto-refresh executions list every 3 seconds to show status updates
    const interval = setInterval(() => {
      fetchExecutions();
      fetchBaselines();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchExecutions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/executions/`);
      setExecutions(response.data);
    } catch (error) {
      console.error('Error fetching executions:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      // Show error to user
      if (error.response?.data?.detail) {
        alert(`Error fetching executions: ${error.response.data.detail}`);
      } else if (error.message) {
        alert(`Error fetching executions: ${error.message}`);
      }
    }
  };

  const fetchPipelines = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pipelines`);
      setPipelines(response.data);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const fetchLlmConfigs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/llm-configs`);
      setLlmConfigs(response.data);
    } catch (error) {
      console.error('Error fetching LLM configs:', error);
    }
  };

  const fetchBaselines = async () => {
    try {
      const response = await axios.get(`${API_BASE}/baselines`);
      setBaselines(response.data);
    } catch (error) {
      console.error('Error fetching baselines:', error);
    }
  };

  const isBaseline = (executionId) => {
    return baselines.some(b => b.execution_id === executionId);
  };

  const handleSetBaseline = (execution) => {
    setSelectedExecution(execution);
    setBaselineName(`Baseline for Execution ${execution.id}`);
    setBaselineTag('');
    setBaselineDialogOpen(true);
  };

  const handleCreateBaseline = async () => {
    if (!baselineName.trim()) {
      alert('Please enter a baseline name');
      return;
    }

    try {
      await axios.post(`${API_BASE}/baselines`, {
        execution_id: selectedExecution.id,
        name: baselineName,
        tag: baselineTag || null,
      });
      setBaselineDialogOpen(false);
      fetchBaselines();
      alert('Baseline created successfully');
    } catch (error) {
      console.error('Error creating baseline:', error);
      alert(`Error creating baseline: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleStartExecution = async () => {
    if (!selectedPipeline || !selectedConfig) {
      alert('Please select both pipeline and LLM config');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/executions/`, {
        pipeline_id: parseInt(selectedPipeline),
        llm_config_id: parseInt(selectedConfig),
      });
      const executionId = response.data.id;
      console.log('Execution started:', response.data);
      setOpen(false);
      
      // Refresh executions list immediately
      fetchExecutions();
      
      // Poll for execution completion (don't wait indefinitely)
      const pollExecution = async (id, maxAttempts = 60) => {
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const execResponse = await axios.get(`${API_BASE}/executions/${id}`);
            const execution = execResponse.data;
            
            if (execution.status === 'completed' || execution.status === 'failed') {
              clearInterval(pollInterval);
              fetchExecutions(); // Refresh to show final status
              if (execution.status === 'failed' && execution.error_message) {
                console.error('Execution failed:', execution.error_message);
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              fetchExecutions(); // Refresh anyway
              console.warn('Polling timeout - execution may still be running');
            }
          } catch (error) {
            console.error('Error polling execution status:', error);
            clearInterval(pollInterval);
          }
        }, 2000); // Poll every 2 seconds
        
        // Cleanup after max time (2 minutes)
        setTimeout(() => {
          clearInterval(pollInterval);
        }, maxAttempts * 2000);
      };
      
      // Start polling
      pollExecution(executionId);
      
    } catch (error) {
      console.error('Error starting execution:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response?.data?.detail) {
        alert(`Error starting execution: ${error.response.data.detail}`);
      } else {
        alert(`Error starting execution: ${error.message}`);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
        return 'error';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleExport = async (executionId, format) => {
    try {
      const response = await axios.get(
        `${API_BASE}/reports/execution/${executionId}/${format}`,
        { responseType: format === 'pdf' ? 'blob' : 'json' }
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
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '-0.02em',
          }}
        >
          Executions
        </Typography>
        <Button
          variant="contained"
          startIcon={<FontAwesomeIcon icon={IconNames.faPlay} />}
          onClick={() => setOpen(true)}
          sx={{ minWidth: '180px', height: '40px' }}
        >
          Start Execution
        </Button>
      </Box>

      <Card sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: 0,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pipeline
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  LLM Config
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Baseline
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Started At
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Completed At
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {executions.map((execution) => (
              <TableRow key={execution.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: 600 }}>
                    #{execution.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {execution.pipeline_name || `Pipeline ${execution.pipeline_id}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Config {execution.llm_config_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {execution.status === 'running' && (
                        <CircularProgress size={16} sx={{ color: 'warning.main' }} />
                      )}
                      <Chip
                        label={execution.status}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: 
                            execution.status === 'completed' ? '#d1fae5' :
                            execution.status === 'running' ? '#fef3c7' :
                            execution.status === 'failed' ? '#fee2e2' : '#e0e7ff',
                          color: 
                            execution.status === 'completed' ? '#059669' :
                            execution.status === 'running' ? '#d97706' :
                            execution.status === 'failed' ? '#dc2626' : '#6366f1',
                          borderRadius: 0,
                          textTransform: 'capitalize',
                        }}
                      />
                    </Box>
                    {execution.error_message && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'error.main',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          display: 'block',
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={execution.error_message}
                      >
                        {execution.error_message.length > 50
                          ? execution.error_message.substring(0, 50) + '...'
                          : execution.error_message}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {isBaseline(execution.id) ? (
                    <Chip
                      icon={<FontAwesomeIcon icon={IconNames.faStar} />}
                      label="Baseline"
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {execution.started_at
                    ? new Date(execution.started_at).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {execution.completed_at
                    ? new Date(execution.completed_at).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/results/${execution.id}`)}
                    disabled={execution.status === 'failed' && !execution.error_message}
                  >
                    <FontAwesomeIcon icon={IconNames.faEye} />
                  </IconButton>
                  {execution.status === 'completed' && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleExport(execution.id, 'json')}
                        title="Export Report"
                      >
                        <FontAwesomeIcon icon={IconNames.faDownload} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleSetBaseline(execution)}
                        title={isBaseline(execution.id) ? "Already a baseline" : "Set as Baseline"}
                        disabled={isBaseline(execution.id)}
                        color={isBaseline(execution.id) ? "primary" : "default"}
                      >
                        {isBaseline(execution.id) ? <FontAwesomeIcon icon={IconNames.faStar} /> : <FontAwesomeIcon icon={IconNames.faStarHalfStroke} />}
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Card>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 0,
            minWidth: '480px',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3, 
          borderBottom: '1px solid #e2e8f0', 
          fontWeight: 600,
          fontSize: '1.5rem',
          color: '#0f172a',
          letterSpacing: '-0.01em',
        }}>
          Start New Execution
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Pipeline</InputLabel>
              <Select
                value={selectedPipeline}
                onChange={(e) => setSelectedPipeline(e.target.value)}
              >
                {pipelines.map((pipeline) => (
                  <MenuItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>LLM Configuration</InputLabel>
              <Select
                value={selectedConfig}
                onChange={(e) => setSelectedConfig(e.target.value)}
              >
                {llmConfigs.map((config) => (
                  <MenuItem key={config.id} value={config.id}>
                    {config.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 3, borderTop: '1px solid #e2e8f0', gap: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ minWidth: '100px' }}>Cancel</Button>
          <Button onClick={handleStartExecution} variant="contained" sx={{ minWidth: '120px' }}>
            Start
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={baselineDialogOpen} 
        onClose={() => setBaselineDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 0,
            minWidth: '480px',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3, 
          borderBottom: '1px solid #e2e8f0', 
          fontWeight: 600,
          fontSize: '1.5rem',
          color: '#0f172a',
          letterSpacing: '-0.01em',
        }}>
          Set as Baseline
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Baseline Name"
              value={baselineName}
              onChange={(e) => setBaselineName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Tag (optional)"
              value={baselineTag}
              onChange={(e) => setBaselineTag(e.target.value)}
              fullWidth
              placeholder="e.g., golden-run, v1.0"
              helperText="Optional tag for easy identification"
            />
            {selectedExecution && (
              <Typography variant="body2" color="text.secondary">
                Execution ID: {selectedExecution.id}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 3, borderTop: '1px solid #e2e8f0', gap: 2 }}>
          <Button onClick={() => setBaselineDialogOpen(false)} sx={{ minWidth: '100px' }}>Cancel</Button>
          <Button onClick={handleCreateBaseline} variant="contained" sx={{ minWidth: '120px' }}>
            Create Baseline
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Executions;

