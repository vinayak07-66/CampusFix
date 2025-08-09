import { useState, useEffect } from 'react';
//import { supabase } from '../../supabaseClient';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        search: search || undefined,
        role: roleFilter || undefined,
      };

      const response = await axios.get('/api/admin/users', { params });
      setUsers(response.data.users);
      setTotalUsers(response.data.totalUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search, roleFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setPage(0);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditDialogOpen(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleRoleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || newRole === selectedUser.role) {
      setEditDialogOpen(false);
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError(null);
      setUpdateSuccess(false);

      await axios.put(`/api/admin/users/${selectedUser._id}/role`, { role: newRole });
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, role: newRole } : user
      ));
      
      setUpdateSuccess(true);
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setEditDialogOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Error updating user role:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update user role. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return (
          <Chip 
            icon={<AdminIcon />} 
            label="Admin" 
            color="error" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'staff':
        return (
          <Chip 
            icon={<WorkIcon />} 
            label="Staff" 
            color="secondary" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'student':
      default:
        return (
          <Chip 
            icon={<SchoolIcon />} 
            label="Student" 
            color="primary" 
            size="small" 
            variant="outlined" 
          />
        );
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Users"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or ID"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearch('');
                        setPage(0);
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="role-filter-label">Filter by Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={roleFilter}
                label="Filter by Role"
                onChange={handleRoleFilterChange}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="student">Students</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="admin">Administrators</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                disabled={!search && !roleFilter}
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found
                    </Typography>
                    {(search || roleFilter) && (
                      <Button
                        variant="text"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                        sx={{ mt: 1 }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <PersonIcon />
                          )}
                        </Avatar>
                        <Typography variant="body1">{user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.studentId || '-'}</TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>{getRoleChip(user.role)}</TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Role">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleEditClick(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                Change the role for user: <strong>{selectedUser.name}</strong>
              </DialogContentText>
              
              {updateError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {updateError}
                </Alert>
              )}
              
              {updateSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  User role updated successfully!
                </Alert>
              )}
              
              <FormControl fullWidth>
                <InputLabel id="new-role-label">Role</InputLabel>
                <Select
                  labelId="new-role-label"
                  value={newRole}
                  label="Role"
                  onChange={handleRoleChange}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateRole} 
            color="primary" 
            variant="contained"
            disabled={updateLoading || !selectedUser || newRole === selectedUser?.role}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;