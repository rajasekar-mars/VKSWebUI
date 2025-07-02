import React, { useState } from 'react';
import './App.css';
import { LogIn, LogOut, Plus, Save, X, Edit, Trash2 } from 'lucide-react';

const API = 'http://localhost:5000/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      onLogin(data.role);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><LogIn /> Login</h2>
        <input className="w-full mb-2 p-2 border rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full mb-4 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2" type="submit"><LogIn /> Login</button>
      </form>
    </div>
  );
}

function MenuBar({ role, current, setCurrent, onLogout }) {
  const menus = [
    { key: 'centers', label: 'Centers' },
    { key: 'collections', label: 'Collections' },
    { key: 'sales', label: 'Sales' },
    { key: 'employees', label: 'Employees', admin: true },
    { key: 'accounts', label: 'Accounts' },
    { key: 'center_account_details', label: 'Center Account Details' }
  ];
  return (
    <div className="flex items-center gap-4 bg-gray-800 text-white p-4">
      {menus.map(m => (!m.admin || role === 'admin') && (
        <button key={m.key} className={`px-3 py-1 rounded ${current === m.key ? 'bg-blue-500' : 'hover:bg-gray-700'}`} onClick={() => setCurrent(m.key)}>{m.label}</button>
      ))}
      <button className="ml-auto flex items-center gap-1 hover:text-red-400" onClick={onLogout}><LogOut /> Logout</button>
    </div>
  );
}

const TABLES = {
  centers: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'location', label: 'Location' }
    ],
    keyFields: ['name']
  },
  collections: {
    columns: [
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'center_id', label: 'Center ID' }
    ],
    keyFields: ['date', 'center_id']
  },
  sales: {
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'price', label: 'Price' },
      { key: 'date', label: 'Date' },
      { key: 'center_id', label: 'Center ID' }
    ],
    keyFields: ['date', 'center_id', 'item']
  },
  employees: {
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'role', label: 'Role' },
      { key: 'password', label: 'Password' }
    ],
    keyFields: ['username']
  },
  accounts: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'balance', label: 'Balance' }
    ],
    keyFields: ['name']
  },
  center_account_details: {
    columns: [
      { key: 'CODE', label: 'Code' },
      { key: 'SUB_CODE', label: 'Sub Code' },
      { key: 'BANK_ACC_NUMBER', label: 'Bank Acc Number' },
      { key: 'NAME', label: 'Name' },
      { key: 'IFSC', label: 'IFSC' },
      { key: 'BRANCH', label: 'Branch' },
      { key: 'AMOUNT', label: 'Amount' }
    ],
    keyFields: ['CODE', 'BANK_ACC_NUMBER', 'NAME', 'IFSC', 'BRANCH']
  }
};

function getRowKey(row, columns) {
  if (!columns) return '';
  if ('id' in row) return row.id;
  return columns.map(col => row[col.key]).join('__');
}

function getRowKeyFields(row, keyFields) {
  return keyFields.map(k => row[k]).join('/');
}

function CrudTable({ endpoint, columns, canEdit = true }) {
  const [rows, setRows] = React.useState([]);
  const [editKey, setEditKey] = React.useState(null);
  const [editRow, setEditRow] = React.useState({});
  const [adding, setAdding] = React.useState(false);
  const [newRow, setNewRow] = React.useState({});
  const [error, setError] = React.useState('');
  const [filters, setFilters] = React.useState({});

  React.useEffect(() => {
    fetch(`${API}/${endpoint}`, { credentials: 'include' })
      .then(r => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, [endpoint]);

  const handleEdit = (row) => {
    setEditKey(getRowKey(row));
    setEditRow(row);
  };
  const handleSave = async (row) => {
    setError('');
    let url = `${API}/${endpoint}/`;
    if ('id' in row) {
      url += row.id;
    } else {
      url += columns.map(col => encodeURIComponent(row[col.key])).join('/');
    }
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editRow)
    });
    if (res.ok) {
      setRows(rows.map(r => getRowKey(r) === editKey ? editRow : r));
      setEditKey(null);
    } else {
      setError('Save failed');
    }
  };
  const handleDelete = async (row) => {
    if (!window.confirm('Delete this row?')) return;
    let url = `${API}/${endpoint}/`;
    if ('id' in row) {
      url += row.id;
    } else {
      url += columns.map(col => encodeURIComponent(row[col.key])).join('/');
    }
    await fetch(url, { method: 'DELETE', credentials: 'include' });
    setRows(rows.filter(r => getRowKey(r) !== getRowKey(row)));
  };
  const handleAdd = async () => {
    setError('');
    const res = await fetch(`${API}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newRow)
    });
    if (res.ok) {
      const data = await res.json();
      setRows([...rows, data]);
      setAdding(false);
      setNewRow({});
    } else {
      setError('Add failed');
    }
  };

  // Filtering logic
  const filteredRows = rows.filter(row =>
    columns.every(col => {
      const filter = filters[col.key]?.toLowerCase() || '';
      if (!filter) return true;
      const value = (row[col.key] || '').toString().toLowerCase();
      return value.includes(filter);
    })
  );

  return (
    <div className="p-4">
      <div className="flex items-center mb-2">
        <h2 className="text-xl font-bold mr-4">{endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}</h2>
        {canEdit && <button className="bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1" onClick={() => setAdding(true)}><Plus size={16}/> Add</button>}
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            {columns.map(col => <th key={col.key} className="p-2 border-b text-left">{col.label}</th>)}
            {canEdit && <th className="p-2 border-b">Actions</th>}
          </tr>
          {/* Filter row */}
          <tr>
            {columns.map(col => (
              <th key={col.key} className="p-2 border-b bg-gray-50">
                <input
                  className="border p-1 rounded w-full text-sm"
                  placeholder={`Filter ${col.label}`}
                  value={filters[col.key] || ''}
                  onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}
                />
              </th>
            ))}
            {canEdit && <th className="p-2 border-b bg-gray-50"></th>}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map(row => {
            const rowKey = getRowKey(row);
            return (
              <tr key={rowKey} className="border-b">
                {columns.map(col => (
                  <td key={col.key} className="p-2">
                    {editKey === rowKey ? (
                      <input className="border p-1 rounded w-full" value={editRow[col.key] || ''} onChange={e => setEditRow({ ...editRow, [col.key]: e.target.value })} />
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
                {canEdit && (
                  <td className="p-2 flex gap-2">
                    {editKey === rowKey ? (
                      <>
                        <button className="text-green-600" onClick={() => handleSave(row)} title="Save"><Save size={16}/></button>
                        <button className="text-gray-500" onClick={() => setEditKey(null)} title="Cancel"><X size={16}/></button>
                      </>
                    ) : (
                      <>
                        <button className="text-blue-600" onClick={() => handleEdit(row)} title="Edit"><Edit size={16}/></button>
                        <button className="text-red-600" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={16}/></button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {adding && (
            <tr>
              {columns.map(col => (
                <td key={col.key} className="p-2">
                  <input className="border p-1 rounded w-full" value={newRow[col.key] || ''} onChange={e => setNewRow({ ...newRow, [col.key]: e.target.value })} />
                </td>
              ))}
              <td className="p-2 flex gap-2">
                <button className="text-green-600" onClick={handleAdd} title="Save"><Save size={16}/></button>
                <button className="text-gray-500" onClick={() => { setAdding(false); setNewRow({}); }} title="Cancel"><X size={16}/></button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(null);
  const [menu, setMenu] = useState('centers');

  const handleLogout = async () => {
    await fetch(`${API}/logout`, { credentials: 'include' });
    setRole(null);
  };

  if (!role) return <Login onLogin={setRole} />;

  const { columns, keyFields } = TABLES[menu];

  return (
    <div className="min-h-screen bg-gray-100">
      <MenuBar role={role} current={menu} setCurrent={setMenu} onLogout={handleLogout} />
      <CrudTable endpoint={menu} columns={columns} keyFields={keyFields} canEdit={role === 'admin' || menu !== 'employees'} />
    </div>
  );
}

export default App;
