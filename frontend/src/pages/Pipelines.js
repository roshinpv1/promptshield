import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  IconButton,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconNames } from '../utils/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const AVAILABLE_LIBRARIES = ['garak', 'pyrit', 'langtest', 'promptfoo'];
const TEST_CATEGORIES = [
  'prompt_injection',
  'jailbreak',
  'bias',
  'robustness',
  'toxicity',
  'misuse',
  'adversarial',
  'multi_turn',
  'consistency',
  'fairness',
  'prompt_quality',
  'regression',
  'output_validation',
  'prompt_comparison',
];

function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    libraries: [],
    test_categories: [],
    severity_thresholds: {},
    llm_config_id: '',
    is_template: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPipelines();
    fetchLlmConfigs();
  }, []);

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

  const handleOpen = (pipeline = null) => {
    if (pipeline) {
      setEditingPipeline(pipeline);
      setFormData({
        name: pipeline.name,
        description: pipeline.description || '',
        libraries: pipeline.libraries || [],
        test_categories: pipeline.test_categories || [],
        severity_thresholds: pipeline.severity_thresholds || {},
        llm_config_id: pipeline.llm_config_id,
        is_template: pipeline.is_template || false,
      });
    } else {
      setEditingPipeline(null);
      setFormData({
        name: '',
        description: '',
        libraries: [],
        test_categories: [],
        severity_thresholds: {},
        llm_config_id: '',
        is_template: false,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPipeline(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        llm_config_id: parseInt(formData.llm_config_id),
      };

      if (editingPipeline) {
        await axios.put(`${API_BASE}/pipelines/${editingPipeline.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/pipelines`, payload);
      }

      fetchPipelines();
      handleClose();
    } catch (error) {
      console.error('Error saving pipeline:', error);
      alert('Error saving pipeline. Please check your input.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pipeline?')) {
      try {
        await axios.delete(`${API_BASE}/pipelines/${id}`);
        fetchPipelines();
      } catch (error) {
        console.error('Error deleting pipeline:', error);
      }
    }
  };

  const handleExecute = async (pipelineId) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;

    try {
      await axios.post(`${API_BASE}/executions`, {
        pipeline_id: pipelineId,
        llm_config_id: pipeline.llm_config_id,
      });
      navigate('/executions');
    } catch (error) {
      console.error('Error executing pipeline:', error);
      alert('Error starting execution.');
    }
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
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
          Validation Pipelines
        </Typography>
        <Button
          variant="contained"
          startIcon={<FontAwesomeIcon icon={IconNames.faPlus} />}
          onClick={() => handleOpen()}
          sx={{ minWidth: '160px', height: '40px' }}
        >
          New Pipeline
        </Button>
      </Box>

      <Card sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: 0,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
      }}>
        <TableContainer sx={{ overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Name
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Libraries
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Test Categories
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Template
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pipelines.map((pipeline) => (
              <TableRow key={pipeline.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                <TableCell>{pipeline.name}</TableCell>
                <TableCell>
                  {pipeline.libraries.map((lib) => (
                    <Chip key={lib} label={lib} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  {pipeline.test_categories.slice(0, 3).map((cat) => (
                    <Chip key={cat} label={cat} size="small" sx={{ mr: 0.5 }} />
                  ))}
                  {pipeline.test_categories.length > 3 && (
                    <Chip label={`+${pipeline.test_categories.length - 3}`} size="small" />
                  )}
                </TableCell>
                <TableCell>
                  {pipeline.is_template ? (
                    <Chip label="Template" size="small" color="primary" />
                  ) : (
                    <Chip label="Regular" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleExecute(pipeline.id)}>
                    <FontAwesomeIcon icon={IconNames.faPlay} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpen(pipeline)}>
                    <FontAwesomeIcon icon={IconNames.faEdit} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(pipeline.id)}>
                    <FontAwesomeIcon icon={IconNames.faTrash} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Card>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            maxHeight: '90vh',
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
          {editingPipeline ? 'Edit Pipeline' : 'New Pipeline'}
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="LLM Configuration"
                value={formData.llm_config_id}
                onChange={(e) => setFormData({ ...formData, llm_config_id: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="">Select LLM Config</option>
                {llmConfigs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
                Select Libraries
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {AVAILABLE_LIBRARIES.map((lib) => (
                    <FormControlLabel
                      key={lib}
                      control={
                        <Checkbox
                          checked={formData.libraries.includes(lib)}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              libraries: toggleArrayItem(formData.libraries, lib),
                            })
                          }
                        />
                      }
                      label={lib}
                      sx={{ mr: 0 }}
                    />
                  ))}
                </Box>
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
                Select Test Categories
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {TEST_CATEGORIES.map((cat) => (
                    <FormControlLabel
                      key={cat}
                      control={
                        <Checkbox
                          checked={formData.test_categories.includes(cat)}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              test_categories: toggleArrayItem(formData.test_categories, cat),
                            })
                          }
                        />
                      }
                      label={cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      sx={{ mr: 0 }}
                    />
                  ))}
                </Box>
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_template}
                    onChange={(e) =>
                      setFormData({ ...formData, is_template: e.target.checked })
                    }
                  />
                }
                label="Save as Template"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 3, borderTop: '1px solid #e2e8f0', gap: 2 }}>
          <Button onClick={handleClose} sx={{ minWidth: '100px' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ minWidth: '120px' }}>
            {editingPipeline ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Pipelines;

