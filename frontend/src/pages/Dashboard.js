import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function Dashboard() {
  const [stats, setStats] = useState({
    totalExecutions: 0,
    runningExecutions: 0,
    completedExecutions: 0,
    totalResults: 0,
  });
  const [severityData, setSeverityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [executionsRes, resultsRes] = await Promise.all([
        axios.get(`${API_BASE}/executions`),
        axios.get(`${API_BASE}/results/execution/1/summary`).catch(() => null),
      ]);

      const executions = executionsRes.data;
      const totalExecutions = executions.length;
      const runningExecutions = executions.filter(e => e.status === 'running').length;
      const completedExecutions = executions.filter(e => e.status === 'completed').length;

      setStats({
        totalExecutions,
        runningExecutions,
        completedExecutions,
        totalResults: resultsRes?.data?.total_results || 0,
      });

      if (resultsRes?.data?.by_severity) {
        const severityChart = Object.entries(resultsRes.data.by_severity).map(([severity, count]) => ({
          severity: severity.toUpperCase(),
          count,
        }));
        setSeverityData(severityChart);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Executions',
      value: stats.totalExecutions,
      icon: <PlayArrowIcon sx={{ fontSize: 36 }} />,
      color: '#dc2626',
    },
    {
      title: 'Running',
      value: stats.runningExecutions,
      icon: <CircularProgress size={36} sx={{ color: '#f59e0b' }} />,
      color: '#f59e0b',
    },
    {
      title: 'Completed',
      value: stats.completedExecutions,
      icon: <CheckCircleIcon sx={{ fontSize: 36 }} />,
      color: '#10b981',
    },
    {
      title: 'Total Results',
      value: stats.totalResults,
      icon: <AssessmentIcon sx={{ fontSize: 36 }} />,
      color: '#3b82f6',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            mb: 1, 
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '-0.02em',
          }}
        >
          Hi, Welcome Back
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#64748b',
            fontSize: '1rem',
          }}
        >
          This is your LLM validation report so far
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                borderLeft: `4px solid ${card.color}`,
                borderRadius: 0,
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                border: '1px solid #e2e8f0',
                borderLeftWidth: '4px',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  transform: 'translateY(-2px)',
                  borderColor: card.color,
                  borderLeftWidth: '4px',
                },
              }}
              onClick={() => navigate('/executions')}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      color="#64748b" 
                      gutterBottom 
                      variant="body2"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        mb: 1.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        color: card.color,
                        fontWeight: 700,
                        fontSize: '2.5rem',
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {card.value}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      color: card.color,
                      opacity: 0.8,
                      ml: 2,
                      transition: 'opacity 200ms ease',
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 0,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 4,
                  color: '#0f172a',
                  fontSize: '1.125rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Results by Severity
              </Typography>
              {severityData.length > 0 ? (
                <Box sx={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="severity" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        stroke="#9ca3af"
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        stroke="#9ca3af"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #e2e8f0',
                          borderRadius: 0,
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#dc2626" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography 
                  variant="body2" 
                  color="#6b7280" 
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  No results data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 0,
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 3,
                  color: '#0f172a',
                  fontSize: '1.125rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Chip
                  label="Create LLM Config"
                  onClick={() => navigate('/llm-configs')}
                  sx={{ 
                    cursor: 'pointer',
                    py: 1.75,
                    px: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    justifyContent: 'flex-start',
                    borderRadius: 0,
                    height: 'auto',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      borderColor: '#dc2626',
                      borderLeft: '3px solid #dc2626',
                      transform: 'translateX(2px)',
                    },
                  }}
                />
                <Chip
                  label="Build Pipeline"
                  onClick={() => navigate('/pipelines')}
                  sx={{ 
                    cursor: 'pointer',
                    py: 1.75,
                    px: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    justifyContent: 'flex-start',
                    borderRadius: 0,
                    height: 'auto',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      borderColor: '#dc2626',
                      borderLeft: '3px solid #dc2626',
                      transform: 'translateX(2px)',
                    },
                  }}
                />
                <Chip
                  label="View Executions"
                  onClick={() => navigate('/executions')}
                  sx={{ 
                    cursor: 'pointer',
                    py: 1.75,
                    px: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    justifyContent: 'flex-start',
                    borderRadius: 0,
                    height: 'auto',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      borderColor: '#dc2626',
                      borderLeft: '3px solid #dc2626',
                      transform: 'translateX(2px)',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

