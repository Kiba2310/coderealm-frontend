import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Container, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CheatSheetPage: React.FC = () => {
    const { topic } = useParams<{ topic: string }>();
    const navigate = useNavigate();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!topic) return;

        setLoading(true);
        fetch(`/cheatsheets/${topic}.md`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.text();
            })
            .then(text => {
                setContent(text);
                setError(false);
            })
            .catch((err) => {
                console.error("Failed to load cheat sheet:", err);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [topic]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#00e699' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/resources/cheat-sheets')} sx={{ color: '#94a3b8', mb: 4 }}>
                    Vissza a puskákhoz
                </Button>
                <Typography variant="h4" color="error">
                    A "{topic}" cheat sheet még nem elérhető vagy nem található. :(
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/resources/cheat-sheets')} sx={{ color: '#94a3b8', mb: 4 }}>
                Vissza a puskákhoz
            </Button>

            <Box sx={{
                bgcolor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 4,
                p: { xs: 3, md: 6 },
                '& h1': {
                    color: '#fff',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    m: 0,
                    pb: 2,
                    borderBottom: '1px solid #1e293b'
                },
                '& h2': {
                    color: '#00e699',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    mt: 6,
                    mb: 2
                },
                '& h3': {
                    color: '#fff',
                    fontSize: '1.2rem',
                    mt: 4,
                    mb: 2
                },
                '& p': {
                    color: '#94a3b8',
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                    mb: 3
                },
                '& pre': {
                    bgcolor: '#020617',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #1e293b',
                    overflowX: 'auto',
                    mb: 3
                },
                '& code': {
                    fontFamily: 'var(--font-mono)',
                    color: '#e2e8f0',
                    fontSize: '0.9rem'
                },
                '& p code, & li code': {
                    bgcolor: '#1e293b',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    color: '#fbbf24'
                },
                '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    mb: 4,
                    mt: 2
                },
                '& th, & td': {
                    border: '1px solid #1e293b',
                    p: 2,
                    textAlign: 'left'
                },
                '& th': {
                    bgcolor: '#020617',
                    color: '#00e699',
                    fontWeight: 600
                },
                '& ul, & ol': {
                    color: '#94a3b8',
                    pl: 3,
                    mb: 3,
                    fontSize: '1.1rem',
                    lineHeight: 1.6
                },
                '& li': {
                    mb: 1
                }
            }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </Box>
        </Container>
    );
};

export default CheatSheetPage;
