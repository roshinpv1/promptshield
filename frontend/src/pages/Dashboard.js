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
      icon: <PlayArrowIcon sx={{ fontSize: 32 }} />,
      color: '#b31e30',
    },
    {
      title: 'Running',
      value: stats.runningExecutions,
      icon: <CircularProgress size={32} sx={{ color: '#FFD700' }} />,
      color: '#FFD700',
    },
    {
      title: 'Completed',
      value: stats.completedExecutions,
      icon: <CheckCircleIcon sx={{ fontSize: 32 }} />,
      color: '#059669',
    },
    {
      title: 'Total Results',
      value: stats.totalResults,
      icon: <AssessmentIcon sx={{ fontSize: 32 }} />,
      color: '#1f2937',
    },
  ];

  return (
    <Box>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          color: '#1a1a1a',
          fontWeight: 600,
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                borderLeft: `3px solid ${card.color}`,
                borderRadius: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
                  borderLeft: `3px solid ${card.color}`,
                },
              }}
              onClick={() => navigate('/executions')}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography 
                      color="text.secondary" 
                      gutterBottom 
                      variant="body2"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        color: card.color,
                        fontWeight: 600,
                        fontSize: '1.75rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {card.value}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      color: card.color,
                      opacity: 0.7,
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
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 3,
                  color: '#212529',
                }}
              >
                Results by Severity
              </Typography>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={severityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                    <XAxis 
                      dataKey="severity" 
                      tick={{ fill: '#495057', fontSize: 12 }}
                      stroke="#CED4DA"
                    />
                    <YAxis 
                      tick={{ fill: '#495057', fontSize: 12 }}
                      stroke="#CED4DA"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E9ECEF',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#b31e30" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  No results data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 3,
                  color: '#212529',
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
                    py: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    justifyContent: 'flex-start',
                    '&:hover': {
                      backgroundColor: '#f7eaec',
                      color: '#b31e30',
                    },
                  }}
                />
                <Chip
                  label="Build Pipeline"
                  onClick={() => navigate('/pipelines')}
                  sx={{ 
                    cursor: 'pointer',
                    py: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    justifyContent: 'flex-start',
                    '&:hover': {
                      backgroundColor: '#f7eaec',
                      color: '#b31e30',
                    },
                  }}
                />
                <Chip
                  label="View Executions"
                  onClick={() => navigate('/executions')}
                  sx={{ 
                    cursor: 'pointer',
                    py: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    justifyContent: 'flex-start',
                    '&:hover': {
                      backgroundColor: '#f7eaec',
                      color: '#b31e30',
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

