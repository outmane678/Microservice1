import { useState, useEffect } from 'react';
import { employeService } from '../api/employeService';
import { departementService } from '../api/departementService';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  hireDate: '',
  position: '',
  departmentId: '',
};

export default function EmployePage() {
  const [employes, setEmployes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const subscription = Promise.all([employeService.getAll(), departementService.getAll()])
      .then(([empRes, depRes]) => {
        if (!cancelled) {
          setEmployes(empRes.data);
          setDepartments(depRes.data);
        }
      })
      .catch(() => { if (!cancelled) setError('Failed to load data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; void subscription; };
  }, [refreshKey]);

  const refresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : '',
      position: emp.position || '',
      departmentId: emp.departmentId || '',
    });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        await employeService.update(editing.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          hireDate: form.hireDate,
          position: form.position,
        });
      } else {
        await employeService.create(form);
      }
      closeModal();
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeService.delete(id);
      refresh();
    } catch {
      setError('Failed to delete employee.');
    }
  };

  const getDepartmentName = (id) => {
    const dep = departments.find((d) => d.id === id);
    return dep ? dep.name : '—';
  };

  if (loading) return <div className="loading">Loading employees...</div>;

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Employees</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Employee</button>
      </div>

      {error && !modalOpen && <div className="alert alert-error">{error}</div>}

      {employes.length === 0 ? (
        <div className="empty-state">No employees found. Create one to get started.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Department</th>
                <th>Hire Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employes.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.firstName} {emp.lastName}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone || '—'}</td>
                  <td>{emp.position}</td>
                  <td>{getDepartmentName(emp.departmentId)}</td>
                  <td>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '—'}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(emp)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal title={editing ? 'Edit Employee' : 'New Employee'} isOpen={modalOpen} onClose={closeModal}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input name="position" value={form.position} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Hire Date</label>
              <input name="hireDate" type="date" value={form.hireDate} onChange={handleChange} required />
            </div>
            {!editing && (
              <div className="form-group">
                <label>Department</label>
                <select name="departmentId" value={form.departmentId} onChange={handleChange} required>
                  <option value="">Select department</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
