import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconNames } from '../utils/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function Dashboard() {
  const [stats, setStats] = useState({
    totalExecutions: 0,
    runningExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    totalResults: 0,
    criticalResults: 0,
    highResults: 0,
  });
  const [severityData, setSeverityData] = useState([]);
  const [libraryData, setLibraryData] = useState([]);
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [executionsRes, resultsRes] = await Promise.all([
        axios.get(`${API_BASE}/executions/`),
        axios.get(`${API_BASE}/results/execution/1/summary`).catch(() => null),
      ]);

      const executions = executionsRes.data;
      const totalExecutions = executions.length;
      const runningExecutions = executions.filter(e => e.status === 'running').length;
      const completedExecutions = executions.filter(e => e.status === 'completed').length;
      const failedExecutions = executions.filter(e => e.status === 'failed').length;

      setStats({
        totalExecutions,
        runningExecutions,
        completedExecutions,
        failedExecutions,
        totalResults: resultsRes?.data?.total_results || 0,
        criticalResults: resultsRes?.data?.by_severity?.critical || 0,
        highResults: resultsRes?.data?.by_severity?.high || 0,
      });

      if (resultsRes?.data?.by_severity) {
        const severityChart = Object.entries(resultsRes.data.by_severity)
          .filter(([_, count]) => count > 0)
          .map(([severity, count]) => ({
            name: severity.charAt(0).toUpperCase() + severity.slice(1),
            value: count,
            severity: severity.toUpperCase(),
          }));
        setSeverityData(severityChart);
      }

      if (resultsRes?.data?.by_library) {
        const libraryChart = Object.entries(resultsRes.data.by_library)
          .filter(([_, count]) => count > 0)
          .map(([library, count]) => ({
            name: library.charAt(0).toUpperCase() + library.slice(1),
            value: count,
          }));
        setLibraryData(libraryChart);
      }

      // Get recent executions
      const recent = executions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentExecutions(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#dc2626', '#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];

  const categories = [
    {
      name: 'Total Executions',
      amount: stats.totalExecutions,
      icon: <FontAwesomeIcon icon={IconNames.faLayerGroup} style={{ fontSize: 24, color: '#1e40af' }} />,
      change: '+12%',
      changeType: 'up',
      bgColor: '#dbeafe', // Blue-100
      accentColor: '#1e40af', // Blue-800
      barColor: '#3b82f6',
    },
    {
      name: 'Completed',
      amount: stats.completedExecutions,
      icon: <FontAwesomeIcon icon={IconNames.faCheckCircle} style={{ fontSize: 24, color: '#3730a3' }} />,
      change: '+8%',
      changeType: 'up',
      bgColor: '#e0e7ff', // Indigo-100
      accentColor: '#3730a3', // Indigo-800
      barColor: '#6366f1',
    },
    {
      name: 'Issues Found',
      amount: stats.failedExecutions + stats.criticalResults,
      icon: <FontAwesomeIcon icon={IconNames.faExclamationTriangle} style={{ fontSize: 24, color: '#9f1239' }} />,
      change: '-2%',
      changeType: 'down',
      bgColor: '#ffe4e6', // Rose-100
      accentColor: '#9f1239', // Rose-800
      barColor: '#f43f5e',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Summary Section - Budget Planner Style */}
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#0f172a', letterSpacing: '-0.02em' }}>
        Good morning, Engineer
        <Typography component="span" sx={{ display: 'block', fontSize: '1rem', fontWeight: 400, color: '#64748b', mt: 1 }}>
          Here's what's happening with your validation pipelines today.
        </Typography>
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {categories.map((category, index) => (
          <Card
            key={index}
            sx={{
              backgroundColor: category.bgColor,
              borderRadius: '24px',
              boxShadow: 'none',
              border: 'none',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ color: category.accentColor, fontWeight: 600, fontSize: '1rem' }}>
                  {category.name}
                </Typography>
                {category.icon}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 3 }}>
                <Typography variant="h2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '3rem', lineHeight: 1 }}>
                  {category.amount}
                </Typography>
                <Chip
                  label={category.change}
                  size="small"
                  sx={{
                    backgroundColor: '#ffffff',
                    color: category.changeType === 'up' ? '#10b981' : '#ef4444',
                    fontWeight: 700,
                    borderRadius: '8px',
                    height: '24px'
                  }}
                />
              </Box>

              {/* Decorative Bar Chart Visual */}
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 40, opacity: 0.7 }}>
                {[40, 60, 45, 80, 55, 90, 65, 50].map((h, i) => (
                  <Box
                    key={i}
                    sx={{
                      flex: 1,
                      backgroundColor: category.accentColor,
                      borderRadius: '4px',
                      height: `${h}%`,
                      opacity: i > 4 ? 1 : 0.5
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>



      <Grid container spacing={3}>
        {/* Results by Severity - Table Style */}
        <Grid item xs={12} md={8}>
          <Card sx={{
            backgroundColor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0',
            height: '100%',
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>
                  Results by Severity
                </Typography>
              </Box>
              {severityData.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Severity
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Count
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Percentage
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {severityData.map((row, index) => {
                        const percentage = stats.totalResults > 0
                          ? Math.round((row.value / stats.totalResults) * 100)
                          : 0;
                        return (
                          <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: COLORS[index % COLORS.length],
                                }} />
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>
                                  {row.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: 600 }}>
                                {row.value}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                {percentage}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={percentage > 10 ? 'High' : percentage > 5 ? 'Medium' : 'Low'}
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  backgroundColor: percentage > 10 ? '#fee2e2' : percentage > 5 ? '#fef3c7' : '#d1fae5',
                                  color: percentage > 10 ? '#dc2626' : percentage > 5 ? '#d97706' : '#059669',
                                  borderRadius: 2,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No results data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chart Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            backgroundColor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0',
            height: '100%',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b', fontSize: '1rem' }}>
                Results Distribution
              </Typography>
              {severityData.length > 0 ? (
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.75rem', mb: 1, textAlign: 'center' }}>
                    {stats.totalResults}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem', textAlign: 'center', mb: 3 }}>
                    Total Results
                  </Typography>
                  <Box sx={{ width: '100%', height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No chart data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Executions - Transactions Style */}
        <Grid item xs={12}>
          <Card sx={{
            backgroundColor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0',
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>
                  Recent Executions
                </Typography>
                <Chip
                  label="View All"
                  onClick={() => navigate('/executions')}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    fontSize: '0.8125rem',
                    height: 28,
                    backgroundColor: '#f8fafc',
                    '&:hover': {
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                    },
                  }}
                />
              </Box>
              {recentExecutions.length > 0 ? (
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
                          Status
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Started
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentExecutions.map((execution) => (
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
                                borderRadius: 2,
                                textTransform: 'capitalize',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                              {execution.started_at
                                ? new Date(execution.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="View"
                              size="small"
                              onClick={() => navigate(`/results/${execution.id}`)}
                              sx={{
                                cursor: 'pointer',
                                height: 24,
                                fontSize: '0.75rem',
                                borderRadius: 2,
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                },
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No executions yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
