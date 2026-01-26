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
      icon: <FontAwesomeIcon icon={IconNames.faPlay} style={{ fontSize: 20, color: '#dc2626' }} />,
      change: '+12.5%',
      changeType: 'up',
      color: '#dc2626',
    },
    {
      name: 'Running',
      amount: stats.runningExecutions,
      icon: <FontAwesomeIcon icon={IconNames.faClock} style={{ fontSize: 20, color: '#f59e0b' }} />,
      change: '+5.2%',
      changeType: 'up',
      color: '#f59e0b',
    },
    {
      name: 'Completed',
      amount: stats.completedExecutions,
      icon: <FontAwesomeIcon icon={IconNames.faCheckCircle} style={{ fontSize: 20, color: '#10b981' }} />,
      change: '+8.1%',
      changeType: 'up',
      color: '#10b981',
    },
    {
      name: 'Failed',
      amount: stats.failedExecutions,
      icon: <FontAwesomeIcon icon={IconNames.faExclamationTriangle} style={{ fontSize: 20, color: '#ef4444' }} />,
      change: '-2.3%',
      changeType: 'down',
      color: '#ef4444',
    },
    {
      name: 'Total Results',
      amount: stats.totalResults,
      icon: <FontAwesomeIcon icon={IconNames.faChartBar} style={{ fontSize: 20, color: '#3b82f6' }} />,
      change: '+15.1%',
      changeType: 'up',
      color: '#3b82f6',
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
      <Card sx={{ 
        mb: 3, 
        backgroundColor: '#ffffff',
        borderRadius: 0,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b', fontSize: '1rem' }}>
            Validation Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mb: 1 }}>
                  Total Executions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '2rem', mb: 1 }}>
                  {stats.totalExecutions}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                    Completed: {stats.completedExecutions}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                    Failed: {stats.failedExecutions}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mb: 1 }}>
                  Total Results
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '2rem', mb: 1 }}>
                  {stats.totalResults}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                    Critical: {stats.criticalResults}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 600 }}>
                    High: {stats.highResults}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mb: 1 }}>
                  Success Rate
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '2rem', mb: 2 }}>
                  {stats.totalExecutions > 0 
                    ? Math.round((stats.completedExecutions / stats.totalExecutions) * 100) 
                    : 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.totalExecutions > 0 ? (stats.completedExecutions / stats.totalExecutions) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 0,
                    backgroundColor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 0,
                      backgroundColor: '#10b981',
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Categories with Biggest Results - Budget Planner Style */}
      <Card sx={{ 
        mb: 3, 
        backgroundColor: '#ffffff',
        borderRadius: 0,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b', fontSize: '1rem' }}>
            Execution Categories
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {categories.map((category, index) => (
              <Box
                key={index}
                sx={{
                  flex: '1 1 180px',
                  minWidth: '180px',
                  p: 2,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    borderColor: category.color,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => navigate('/executions')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: `${category.color}15`,
                    borderRadius: 0,
                  }}>
                    {category.icon}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {category.changeType === 'up' ? (
                      <FontAwesomeIcon icon={IconNames.faArrowTrendUp} style={{ fontSize: 16, color: '#10b981' }} />
                    ) : (
                      <FontAwesomeIcon icon={IconNames.faArrowTrendDown} style={{ fontSize: 16, color: '#ef4444' }} />
                    )}
                    <Typography variant="caption" sx={{ 
                      color: category.changeType === 'up' ? '#10b981' : '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {category.change}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem', mb: 0.5 }}>
                  {category.amount}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                  {category.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Results by Severity - Table Style */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            backgroundColor: '#ffffff',
            borderRadius: 0,
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
                                  borderRadius: 0,
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
            borderRadius: 0,
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
            borderRadius: 0,
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
                    borderRadius: 0,
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
                                borderRadius: 0,
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
                                borderRadius: 0,
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
