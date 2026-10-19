import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../contexts/AuthContext';
import type { GroupModel } from '../api';
import {
  createGroup,
  joinGroup,
  getTeacherGroups,
  getStudentGroups,
  deleteGroup,
  getGroupMembers,
  removeGroupMember,
  adminGetAllGroups,
  adminGetUsers,
  type UserStats
} from '../api';

const Groups: React.FC = () => {
  const { hasRole, user, isAuthenticated } = useAuth();
  const isTeacher = hasRole('teacher') || hasRole('admin');

  const [groups, setGroups] = useState<GroupModel[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = hasRole('admin');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const [joinInviteCode, setJoinInviteCode] = useState('');

  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupModel | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]); // Just user IDs for now

  useEffect(() => {
    if (isAuthenticated) {
      fetchGroups();
    }
  }, [isTeacher, isAuthenticated]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [res, usersRes] = await Promise.all([
          adminGetAllGroups(),
          adminGetUsers()
        ]);
        setGroups(res || []);
        setUsers(usersRes || []);
      } else if (isTeacher) {
        const res = await getTeacherGroups();
        setGroups(res || []);
      } else {
        const res = await getStudentGroups();
        setGroups(res || []);
      }
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await createGroup(newGroupName, newGroupDesc);
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
    } catch (err) {
      console.error('Create group failed', err);
      alert('Hiba történt a tanterem létrehozásakor.');
    }
  };

  const handleJoinGroup = async () => {
    if (!joinInviteCode.trim()) return;
    try {
      await joinGroup(joinInviteCode.trim());
      setJoinInviteCode('');
      fetchGroups();
    } catch (err) {
      console.error('Join group failed', err);
      alert('Érvénytelen belépőkód vagy már csatlakoztál a tanteremhez.');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Biztosan törlöd a tantermet?')) return;
    try {
      await deleteGroup(id);
      fetchGroups();
    } catch (err) {
      console.error('Delete group failed', err);
      alert('Hiba a tanterem törlésekor.');
    }
  };

  const handleViewMembers = async (group: GroupModel) => {
    setSelectedGroup(group);
    try {
      const members = await getGroupMembers(group.id);
      setGroupMembers(members || []);
      setMembersDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch members', err);
      alert('Hiba a tagok lekérésekor.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    if (!window.confirm('Biztosan eltávolítod a tagot?')) return;
    try {
      await removeGroupMember(selectedGroup.id, memberId);
      const members = await getGroupMembers(selectedGroup.id);
      setGroupMembers(members || []);
    } catch (err) {
      console.error('Remove member failed', err);
      alert('Hiba a tag eltávolításakor.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Vágólapra másolva!');
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container sx={{ mt: 4, pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {isAdmin ? 'Összes Tanterem' : isTeacher ? 'Tanári Tantermek' : 'Saját Tantermek'}
        </Typography>
        {isTeacher && (
          <Button variant="contained" color="primary" onClick={() => setCreateDialogOpen(true)}>
            Új Tanterem Létrehozása
          </Button>
        )}
      </Box>

      {!isTeacher && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Csatlakozás tanteremhez</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Belépőkód"
              size="small"
              value={joinInviteCode}
              onChange={e => setJoinInviteCode(e.target.value)}
            />
            <Button variant="contained" onClick={handleJoinGroup}>Csatlakozás</Button>
          </Box>
        </Paper>
      )}

      {groups.length === 0 ? (
        <Typography>Nincs megjeleníthető tanterem.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Név</TableCell>
                <TableCell>Leírás</TableCell>
                {isAdmin && <TableCell>Létrehozó</TableCell>}
                {isTeacher && <TableCell>Belépőkód</TableCell>}
                <TableCell align="right">Műveletek</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map(group => (
                <TableRow key={group.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'bold' }}>{group.name}</Typography>
                  </TableCell>
                  <TableCell>{group.description}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Chip label={users.find(u => u.id === group.teacher_id)?.email || group.teacher_id} size="small" />
                    </TableCell>
                  )}
                  {isTeacher && (
                    <TableCell>
                      <Chip
                        label={group.invite_code}
                        color="primary"
                        variant="outlined"
                        onClick={() => copyToClipboard(group.invite_code)}
                        icon={<ContentCopyIcon fontSize="small" />}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                  )}
                  <TableCell align="right">
                    {isTeacher && (
                      <>
                        <Button size="small" onClick={() => handleViewMembers(group)}>Tagok</Button>
                        <IconButton size="small" color="error" onClick={() => handleDeleteGroup(group.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                    {!isTeacher && (
                      <Button size="small" color="error" onClick={() => {
                        if (window.confirm('Biztosan kilépsz?')) {
                          removeGroupMember(group.id, user!.id).then(fetchGroups);
                        }
                      }}>
                        Kilépés
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Új tanterem létrehozása</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tanterem neve"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Leírás"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newGroupDesc}
            onChange={e => setNewGroupDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Mégse</Button>
          <Button onClick={handleCreateGroup} variant="contained">Létrehozás</Button>
        </DialogActions>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onClose={() => setMembersDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>A(z) {selectedGroup?.name} tanterem tagjai</DialogTitle>
        <DialogContent>
          {groupMembers.length === 0 ? (
            <Typography>Még nincsenek tagok.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Felhasználó ID</TableCell>
                  <TableCell align="right">Művelet</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupMembers.map(mid => (
                  <TableRow key={mid}>
                    <TableCell>{mid}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleRemoveMember(mid)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Bezárás</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Groups;
