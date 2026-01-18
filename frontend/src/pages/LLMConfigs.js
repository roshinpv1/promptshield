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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#1a1a1a',
            fontWeight: 600,
          }}
        >
          LLM API Configurations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          New Configuration
        </Button>
      </Box>

      <TableContainer 
        component={Paper}
        sx={{ borderRadius: 0 }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Endpoint URL</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Environment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.map((config) => (
              <TableRow 
                key={config.id}
                sx={{
                  '&:hover': {
                    bgcolor: '#f9fafb',
                  },
                }}
              >
                <TableCell sx={{ fontWeight: 500 }}>{config.name}</TableCell>
                <TableCell sx={{ color: '#4a5568' }}>{config.endpoint_url}</TableCell>
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
                    <EditIcon fontSize="small" />
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
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Edit LLM Configuration' : 'New LLM Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LLMConfigs;

