import { useState, useEffect } from 'react';
import { departementService } from '../api/departementService';
import Modal from '../components/Modal';

export default function DepartementPage() {
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const subscription = departementService.getAll()
      .then(({ data }) => { if (!cancelled) setDepartements(data); })
      .catch(() => { if (!cancelled) setError('Failed to load departments.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; void subscription; };
  }, [refreshKey]);

  const refresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (dep) => {
    setEditing(dep);
    setName(dep.name);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        await departementService.update(editing.id, { name });
      } else {
        await departementService.create({ name });
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
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await departementService.delete(id);
      refresh();
    } catch {
      setError('Failed to delete department.');
    }
  };

  if (loading) return <div className="loading">Loading departments...</div>;

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Departments</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Department</button>
      </div>

      {error && !modalOpen && <div className="alert alert-error">{error}</div>}

      {departements.length === 0 ? (
        <div className="empty-state">No departments found. Create one to get started.</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departements.map((dep) => (
                <tr key={dep.id}>
                  <td>{dep.name}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(dep)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(dep.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal title={editing ? 'Edit Department' : 'New Department'} isOpen={modalOpen} onClose={closeModal}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Department Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" required />
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
