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

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function LLMConfigs() {
  const [configs, setConfigs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    endpoint_url: '',
    method: 'POST',
    headers: '{}',
    payload_template: '{"prompt": "{prompt}", "messages": [{"role": "user", "content": "{prompt}"}]}',
    timeout: 30,
    max_retries: 3,
    environment: 'default',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/llm-configs`);
      setConfigs(response.data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const handleOpen = (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        endpoint_url: config.endpoint_url,
        method: config.method,
        headers: JSON.stringify(config.headers, null, 2),
        payload_template: config.payload_template || '',
        timeout: config.timeout,
        max_retries: config.max_retries,
        environment: config.environment,
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: '',
        endpoint_url: '',
        method: 'POST',
        headers: '{}',
        payload_template: '{"prompt": "{prompt}", "messages": [{"role": "user", "content": "{prompt}"}]}',
        timeout: 30,
        max_retries: 3,
        environment: 'default',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingConfig(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        headers: JSON.parse(formData.headers),
      };

      if (editingConfig) {
        await axios.put(`${API_BASE}/llm-configs/${editingConfig.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/llm-configs`, payload);
      }

      fetchConfigs();
      handleClose();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration. Please check your input.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        await axios.delete(`${API_BASE}/llm-configs/${id}`);
        fetchConfigs();
      } catch (error) {
        console.error('Error deleting config:', error);
      }
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
          LLM API Configurations
        </Typography>
        <Button
          variant="contained"
          startIcon={<FontAwesomeIcon icon={IconNames.faPlus} />}
          onClick={() => handleOpen()}
          sx={{ minWidth: '200px', height: '40px' }}
        >
          New Configuration
        </Button>
      </Box>

      <Card sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: 2,
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
                  Endpoint URL
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Method
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Environment
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {configs.map((config) => (
              <TableRow 
                key={config.id}
                sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: 500 }}>
                    {config.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {config.endpoint_url}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={config.method} 
                    size="small" 
                    sx={{
                      bgcolor: '#f3f4f6',
                      color: '#1a1a1a',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={config.environment} 
                    size="small" 
                    sx={{
                      bgcolor: '#f7eaec',
                      color: '#b31e30',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpen(config)}
                    sx={{
                      color: '#6b7280',
                      '&:hover': {
                        color: '#b31e30',
                        bgcolor: '#f7eaec',
                      },
                    }}
                  >
                    <FontAwesomeIcon icon={IconNames.faEdit} style={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(config.id)}
                    sx={{
                      color: '#6b7280',
                      '&:hover': {
                        color: '#dc2626',
                        bgcolor: '#fee2e2',
                      },
                    }}
                  >
                    <FontAwesomeIcon icon={IconNames.faTrash} style={{ fontSize: 16 }} />
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
            borderRadius: 2,
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
          {editingConfig ? 'Edit LLM Configuration' : 'New LLM Configuration'}
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
                label="Endpoint URL"
                value={formData.endpoint_url}
                onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                placeholder="https://api.example.com/v1/chat/completions"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="HTTP Method"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Environment"
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Headers (JSON)"
                value={formData.headers}
                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Payload Template"
                value={formData.payload_template}
                onChange={(e) => setFormData({ ...formData, payload_template: e.target.value })}
                helperText="Use {prompt} as placeholder for the test prompt"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Timeout (seconds)"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Retries"
                value={formData.max_retries}
                onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 3, borderTop: '1px solid #e2e8f0', gap: 2 }}>
          <Button onClick={handleClose} sx={{ minWidth: '100px' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ minWidth: '120px' }}>
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LLMConfigs;

