import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CHEAT_SHEETS = [
    { id: 'python', name: 'Python', desc: 'Python szintaxis, adatszerkezetek és alapvető könyvtári elemek egyetlen pillantásra.', color: '#3b82f6' },
    { id: 'git', name: 'Git', desc: 'Azok a Git parancsok, amiket mindig elfelejtesz, a staging-től a rebase-ig és a visszavonásig.', color: '#f97316' },
    { id: 'javascript', name: 'JavaScript', desc: 'Modern JavaScript szintaxis, tömb metódusok és aszinkron minták egy oldalon.', color: '#eab308' },
    { id: 'linux', name: 'Linux Commands', desc: 'Fájlok kezelése, keresése és navigáció a Linux parancssorból.', color: '#10b981' },
    { id: 'typescript', name: 'TypeScript', desc: 'TypeScript típusok, interfészek, generikusok és segédtípusok gyors áttekintése.', color: '#0ea5e9' },
    { id: 'html', name: 'HTML', desc: 'Minden szükséges HTML címke és attribútum, funkció szerint csoportosítva.', color: '#ef4444' },
    { id: 'css', name: 'CSS', desc: 'Szelektorok, dobozmodell (box model), flexbox, grid és a gyakran elfelejtett tulajdonságok.', color: '#3b82f6' },
    { id: 'csharp', name: 'C#', desc: 'C# szintaxis, típusok, LINQ, gyűjtemények és OOP kulcsszavak egyetlen oldalon.', color: '#8b5cf6' },
    { id: 'php', name: 'PHP', desc: 'PHP szintaxis, tömbök, sztringek, szuperglobális változók és azok a függvények, amiket mindig elfelejtesz.', color: '#6366f1' },
    { id: 'swift', name: 'Swift', desc: 'Swift szintaxis, optionals, gyűjtemények, closure-ök és a struktúrák vs. osztályok különbségei.', color: '#f43f5e' },
    { id: 'terminal', name: 'Terminal', desc: 'Shell parancsok navigációhoz, fájlokhoz, pipe-okhoz és folyamatirányításhoz.', color: '#a8a29e' },
];

const CheatSheets: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 4, pt: 8, maxWidth: 1200, width: "100%", typography: 'var(--font-sans)', color: '#fff' }}>
            <Typography variant="overline" sx={{ color: '#00e699', fontWeight: 'bold', letterSpacing: 2 }}>
                FORRÁSOK
            </Typography>
            <Typography variant="h2" sx={{ mt: 1, mb: 2, color: '#ffffff', fontWeight: 'bold' }}>
                Programozási Segédletek
            </Typography>
            <Typography variant="body1" sx={{ mb: 6, maxWidth: 800, color: '#94a3b8' }}>
                Ingyenes puskák az asztalodra, a mindennapokban használt technológiákhoz. Ne keress többet feleslegesen: ami a legfontosabb, azt itt megtalálod nyelv specifikusan egyetlen oldalon.
            </Typography>

            <Grid container spacing={3}>
                {CHEAT_SHEETS.map((sheet, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sheet.id}>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -4 }} style={{ height: '100%' }}>
                            <Card
                                onClick={() => navigate(`/resources/cheat-sheets/${sheet.id}`)}
                                sx={{
                                    p: 2,
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    bgcolor: '#0f172a',
                                    border: '1px solid #1e293b',
                                    borderRadius: 3,
                                    boxShadow: 'none',
                                    '&:hover': { borderColor: sheet.color, bgcolor: '#1e293b' }
                                }}
                            >
                                <CardContent sx={{ p: 1, pb: '8px !important' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: sheet.color }} />
                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                            {sheet.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                                        {sheet.desc}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default CheatSheets;
