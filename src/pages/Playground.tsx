import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, CircularProgress, Paper, Autocomplete, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import Editor from '@monaco-editor/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

interface PlaygroundFile {
    name: string;
    content: string;
}

interface Runtime {
    language: string;
    version: string;
    aliases: string[];
}

const GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
const PISTON_API_URL = `${GATEWAY_URL}/piston`;

// A few sensible defaults so Monaco knows how to syntax highlight them.
const getMonacoLanguage = (pistonLang: string) => {
    const map: Record<string, string> = {
        'python': 'python',
        'node': 'javascript',
        'javascript': 'javascript',
        'typescript': 'typescript',
        'c': 'c',
        'cpp': 'cpp',
        'c++': 'cpp',
        'csharp': 'csharp',
        'go': 'go',
        'java': 'java',
        'php': 'php',
        'rust': 'rust',
        'swift': 'swift',
        'ruby': 'ruby',
        'bash': 'shell',
    };
    return map[pistonLang.toLowerCase()] || pistonLang;
};

const DEFAULT_CODE: Record<string, string> = {
    javascript: 'console.log("Hello, World!");',
    python: 'print("Hello, World!")',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
    csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
    php: '<?php\n\necho "Hello, World!";',
    rust: 'fn main() {\n    println!("Hello, World!");\n}',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}'
};

const mapExtension: Record<string, string> = {
    javascript: 'js',
    python: 'py',
    csharp: 'cs',
    cpp: 'cpp',
    c: 'c',
    java: 'java',
    php: 'php',
    rust: 'rs',
    go: 'go',
    ruby: 'rb',
    swift: 'swift',
    bash: 'sh',
};

const getDefaultFileName = (lang: string) => {
    if (lang === 'java') return 'Main.java';
    return `main.${mapExtension[lang.toLowerCase()] || 'txt'}`;
};

const Playground: React.FC = () => {
    const [runtimes, setRuntimes] = useState<Runtime[]>([]);
    const [installedLanguages, setInstalledLanguages] = useState<Set<string>>(new Set());
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [files, setFiles] = useState<PlaygroundFile[]>([]);
    const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
    const [output, setOutput] = useState<string>('Az eredmény itt fog megjelenni...\n\nVálaszd ki a nyelvet, írj egy kis kódot és nyomj a Futtatásra!');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isLoadingRuntimes, setIsLoadingRuntimes] = useState<boolean>(true);

    const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (files.some(f => f.content.trim() !== '')) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome to show warning
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [files]);

    useEffect(() => {
        // Fetch available packages and installed runtimes from Piston
        const fetchRuntimes = async () => {
            try {
                const [packagesRes, runtimesRes] = await Promise.all([
                    axios.get<Runtime[]>(`${PISTON_API_URL}/packages`),
                    axios.get<Runtime[]>(`${PISTON_API_URL}/runtimes`)
                ]);

                const installedSet = new Set(runtimesRes.data.map(r => `${r.language}-${r.version}`));
                setInstalledLanguages(installedSet);

                // Map language_version to version because /packages returns language_version
                const mappedPackages = packagesRes.data.map((p: any) => ({
                    language: p.language,
                    version: p.version || p.language_version,
                    aliases: p.aliases || []
                }));

                // Deduplicate if needed (though usually they are different versions)
                const uniquePackages = Array.from(new Map(mappedPackages.map((p: any) => [`${p.language}-${p.version}`, p])).values()) as Runtime[];

                const sorted = uniquePackages.sort((a, b) => a.language.localeCompare(b.language));
                setRuntimes(sorted);

                // Do not auto-select a language. Wait for the user to choose.
            } catch (error) {
                console.error("Failed to load runtimes:", error);
                setOutput("Hiba történt a nyelvek betöltésekor. Próbáld meg később.");
            } finally {
                setIsLoadingRuntimes(false);
            }
        };
        fetchRuntimes();
    }, []);

    const handleAddFileClick = () => {
        setNewFileName(`file${files.length + 1}.txt`);
        setNewFileDialogOpen(true);
    };

    const confirmAddFile = () => {
        if (newFileName && newFileName.trim() !== '') {
            setFiles(prev => [...prev, { name: newFileName.trim(), content: '' }]);
            setActiveFileIndex(files.length); // Switch to the newly created file
        }
        setNewFileDialogOpen(false);
    };

    const handleDeleteIconClick = (index: number) => {
        if (files.length <= 1) return;
        setDeleteIndex(index);
    };

    const confirmDeleteFile = () => {
        if (deleteIndex !== null) {
            setFiles(prev => prev.filter((_, i) => i !== deleteIndex));
            if (activeFileIndex >= deleteIndex && activeFileIndex > 0) {
                setActiveFileIndex(prev => prev - 1);
            }
        }
        setDeleteIndex(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = e.target.files;
        if (!uploadedFiles) return;

        Array.from(uploadedFiles).forEach(file => {
            if (file.size > 256 * 1024) {
                setErrorMsg(`A(z) ${file.name} túl nagy! Maximum 256KB méretű fájlokat tölthetsz fel.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setFiles(prev => {
                    const exists = prev.findIndex(f => f.name === file.name);
                    if (exists !== -1) {
                        const newFiles = [...prev];
                        newFiles[exists].content = content;
                        return newFiles;
                    }
                    return [...prev, { name: file.name, content }];
                });
            };
            reader.readAsText(file);
        });
        e.target.value = '';
    };

    // handleLanguageChange removed, moved to Autocomplete onChange

    const executeCode = async () => {
        setIsRunning(true);

        try {
            // Auto-install language if not installed yet
            if (!installedLanguages.has(`${selectedLanguage}-${selectedVersion}`)) {
                setOutput(`A(z) ${selectedLanguage} (${selectedVersion}) jelenleg nincs feltelepítve a szerverre.\nTelepítés folyamatban, kérlek várj... (Ez több percet is igénybe vehet, de csak az első alkalommal!)`);

                try {
                    await axios.post(`${PISTON_API_URL}/packages`, {
                        language: selectedLanguage,
                        version: selectedVersion
                    });

                    setInstalledLanguages(prev => new Set(prev).add(`${selectedLanguage}-${selectedVersion}`));
                    setOutput(`A(z) ${selectedLanguage} (${selectedVersion}) sikeresen feltelepítve! Futtatás indítása...`);
                } catch (installErr: any) {
                    if (installErr.response?.data?.message === "Already installed") {
                        // Silently mark as installed and continue
                        setInstalledLanguages(prev => new Set(prev).add(`${selectedLanguage}-${selectedVersion}`));
                        setOutput('Futtatás folyamatban...');
                    } else {
                        throw installErr;
                    }
                }
            } else {
                setOutput('Futtatás folyamatban...');
            }

            let executeLanguage = selectedLanguage;
            // Bizonyos csomagok (packages) neve más, mint a futtató nyelv (runtime) neve.
            if (selectedLanguage === 'dotnet') executeLanguage = 'csharp';
            if (selectedLanguage === 'node') executeLanguage = 'javascript';

            const filesToExecute = [...files];
            // Ensure main file is always first so Piston knows which to execute
            filesToExecute.sort((a, b) => {
                if (a.name.toLowerCase().startsWith('main')) return -1;
                if (b.name.toLowerCase().startsWith('main')) return 1;
                return 0;
            });

            const response = await axios.post(`${PISTON_API_URL}/execute`, {
                language: executeLanguage,
                version: selectedVersion,
                files: filesToExecute.map(f => ({ name: f.name, content: f.content }))
            });

            const { stdout, stderr, compile } = response.data.run;
            let finalOutput = '';

            if (compile && compile.stderr) {
                finalOutput += 'FORDÍTÁSI HIBA:\n' + compile.stderr + '\n\n';
            }
            if (stderr) {
                finalOutput += 'HIBA (STDERR):\n' + stderr + '\n\n';
            }
            if (stdout) {
                finalOutput += stdout;
            }

            if (!finalOutput) {
                finalOutput = 'A kód lefutott, de nem generált kimenetet.';
            }

            setOutput(finalOutput);
        } catch (error: any) {
            console.error("Execution error:", error);
            setOutput("Hálózati hiba: " + (error.response?.data?.message || error.message));
        } finally {
            setIsRunning(false);
        }
    };

    if (isLoadingRuntimes) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#00e699' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4, height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Játszótér 🚀
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Válassz nyelvet, írd meg a kódot és futtasd szerverünkön! (Piston.API)
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Autocomplete
                        disableClearable
                        id="lang-select"
                        options={runtimes}
                        getOptionLabel={(r) => `${r.language} (${r.version})`}
                        value={runtimes.find(r => r.language === selectedLanguage && r.version === selectedVersion)}
                        onChange={(_event, newValue) => {
                            if (newValue) {
                                setSelectedLanguage(newValue.language);
                                setSelectedVersion(newValue.version);
                                const monacoLang = getMonacoLanguage(newValue.language);
                                setFiles([{ name: getDefaultFileName(newValue.language), content: DEFAULT_CODE[monacoLang] || '' }]);
                                setActiveFileIndex(0);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Nyelv"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        '& fieldset': { borderColor: '#334155' },
                                        '&:hover fieldset': { borderColor: '#00e699' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#9ca3af' },
                                    '& .MuiSvgIcon-root': { color: '#9ca3af' }
                                }}
                            />
                        )}
                        sx={{ minWidth: 260 }}
                        slotProps={{
                            paper: {
                                sx: {
                                    bgcolor: '#0f172a',
                                    border: '1px solid #1e293b'
                                }
                            },
                            listbox: {
                                sx: {
                                    bgcolor: '#0f172a',
                                    color: '#fff',
                                    '& .MuiAutocomplete-option[data-focus="true"]': {
                                        bgcolor: '#1e293b'
                                    }
                                }
                            }
                        }}
                    />

                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        disabled={!selectedLanguage}
                        sx={{ px: 2, py: 1, fontWeight: 'bold', borderColor: '#334155', color: '#e2e8f0', '&:hover': { borderColor: '#e2e8f0', bgcolor: 'transparent' }, '&.Mui-disabled': { borderColor: '#1e293b', color: '#475569' } }}
                    >
                        Feltöltés
                        <input
                            type="file"
                            multiple
                            hidden
                            disabled={!selectedLanguage}
                            onChange={handleFileUpload}
                        />
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={isRunning ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                        onClick={executeCode}
                        disabled={!selectedLanguage || isRunning || files.length === 0}
                        sx={{ px: 4, py: 1, fontWeight: 'bold', minWidth: 160 }}
                    >
                        Futtatás
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0, opacity: selectedLanguage ? 1 : 0.4, pointerEvents: selectedLanguage ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                {/* Editor Pane */}
                <Paper
                    sx={{
                        flex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        bgcolor: '#1e1e1e',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #334155'
                    }}
                >
                    <Box sx={{ bgcolor: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', overflowX: 'auto', '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#334155', borderRadius: 4 } }}>
                        {files.map((file, idx) => (
                            <Box
                                key={idx}
                                onClick={() => setActiveFileIndex(idx)}
                                sx={{
                                    display: 'flex', alignItems: 'center', px: 2, py: 1,
                                    borderRight: '1px solid #334155',
                                    bgcolor: activeFileIndex === idx ? '#1e1e1e' : 'transparent',
                                    cursor: 'pointer',
                                    minWidth: 'max-content',
                                    '&:hover': { bgcolor: activeFileIndex === idx ? '#1e1e1e' : '#1e293b' }
                                }}
                            >
                                <Typography variant="body2" sx={{ color: activeFileIndex === idx ? '#fff' : '#94a3b8', mr: 1 }}>
                                    {file.name}
                                </Typography>
                                {files.length > 1 && (
                                    <IconButton size="small" sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#ef4444' } }}
                                        onClick={(e) => { e.stopPropagation(); handleDeleteIconClick(idx); }}
                                    >
                                        <CloseIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        <IconButton size="small" onClick={handleAddFileClick} sx={{ color: '#00e699', ml: 1 }}>
                            <AddIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                        <Editor
                            key={activeFileIndex} // Force re-render for clean state when switching
                            height="100%"
                            language={
                                files[activeFileIndex]?.name.endsWith('.csv') ? 'csv' :
                                    files[activeFileIndex]?.name.endsWith('.txt') ? 'plaintext' :
                                        getMonacoLanguage(selectedLanguage)
                            }
                            theme="vs-dark"
                            value={files[activeFileIndex]?.content || ''}
                            onChange={(val) => {
                                setFiles(prev => {
                                    const newFiles = [...prev];
                                    if (newFiles[activeFileIndex]) {
                                        newFiles[activeFileIndex].content = val || '';
                                    }
                                    return newFiles;
                                });
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 16,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                            }}
                        />
                    </Box>
                </Paper>

                {/* Output Pane */}
                <Paper
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        bgcolor: '#020617',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #334155'
                    }}
                >
                    <Box sx={{ p: 1.5, bgcolor: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, ml: 1 }}>
                            Kimenet (Output)
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, position: 'relative', p: 2, overflowY: 'auto', minHeight: 0 }}>
                        <Typography
                            component="pre"
                            sx={{
                                margin: 0,
                                color: isRunning ? '#94a3b8' : '#e2e8f0',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.95rem',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}
                        >
                            {output}
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Dialogs */}
            <Dialog open={newFileDialogOpen} onClose={() => setNewFileDialogOpen(false)} sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a', color: '#fff', border: '1px solid #1e293b' } }}>
                <DialogTitle>Új fájl létrehozása</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8', mb: 2 }}>
                        Add meg az új fájl nevét (pl. adat.csv, main.js)
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && confirmAddFile()}
                        sx={{
                            input: { color: '#fff' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#334155' },
                                '&:hover fieldset': { borderColor: '#00e699' },
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setNewFileDialogOpen(false)} sx={{ color: '#94a3b8' }}>Mégse</Button>
                    <Button onClick={confirmAddFile} variant="contained" color="success">Létrehozás</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteIndex !== null} onClose={() => setDeleteIndex(null)} sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a', color: '#fff', border: '1px solid #1e293b' } }}>
                <DialogTitle>Fájl törlése</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#94a3b8' }}>
                        Biztosan törölni szeretnéd a(z) <Box component="span" sx={{ color: '#ef4444', fontWeight: 'bold' }}>{deleteIndex !== null ? files[deleteIndex]?.name : ''}</Box> fájlt? Ez a művelet nem vonható vissza.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteIndex(null)} sx={{ color: '#94a3b8' }}>Mégse</Button>
                    <Button onClick={confirmDeleteFile} color="error" variant="contained">Törlés</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!errorMsg} onClose={() => setErrorMsg('')} sx={{ '& .MuiDialog-paper': { bgcolor: '#0f172a', color: '#fff', border: '1px solid #ef4444' } }}>
                <DialogTitle sx={{ color: '#ef4444' }}>Hiba</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#e2e8f0' }}>
                        {errorMsg}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setErrorMsg('')} sx={{ color: '#94a3b8' }}>Rendben</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Playground;
