import React, { useState } from 'react';
import './App.css';
import { LogIn, LogOut, Plus, Save, X, Edit, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';

const API = 'http://localhost:5000/api';

// CenteredForm: A reusable wrapper for centering forms
function CenteredForm({ children }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-400 via-blue-200 to-blue-300">
      {children}
    </div>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: login, 2: otp
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [timer, setTimer] = useState(60);

  React.useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setWaiting(true);
    const res = await fetch(`${API}/login/request_otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    setWaiting(false);
    if (res.ok) {
      const data = await res.json();
      if (data.otp_required) {
        setStep(2);
        setTimer(60);
      } else {
        onLogin(data.role);
      }
    } else {
      setError('Invalid credentials');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setWaiting(true);
    const res = await fetch(`${API}/login/verify_otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, otp })
    });
    setWaiting(false);
    if (res.ok) {
      const data = await res.json();
      onLogin(data.role);
    } else {
      setError('Invalid or expired OTP');
    }
  };

  return (
    <CenteredForm>
      <div className="max-w-sm w-full rounded shadow-lg border border-gray-200 bg-white flex flex-col">
        <div className="bg-blue-700 rounded-t-tl rounded-t-tr px-6 py-4 flex items-center justify-center">
          <span className="text-white text-xl font-bold tracking-wide flex items-center gap-2">
            <LogIn size={24} /> Login
          </span>
        </div>
        <form
          onSubmit={step === 1 ? handleLogin : handleVerifyOtp}
          className="px-6 py-6 space-y-4"
        >
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Username</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 text-base transition-all duration-200 bg-white"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={step === 2}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Password</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 text-base transition-all duration-200 bg-white"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={step === 2}
            />
          </div>
          {step === 2 && (
            <>
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">OTP</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 text-base transition-all duration-200 bg-white"
                  placeholder="Enter OTP (ask admin)"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>
              <div className="mb-2 text-gray-600 text-xs text-center">OTP valid for <span className="font-bold">{timer}</span> seconds</div>
            </>
          )}
          {error && (
            <div className="text-red-500 mb-2 text-center flex items-center gap-2 animate-pulse text-sm">
              <XCircle size={16}/>{error}
            </div>
          )}
          <button
            className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 active:bg-blue-900 flex items-center justify-center gap-2 disabled:opacity-60 mt-2 text-base shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="submit"
            disabled={waiting || (step === 2 && timer <= 0)}
          >
            {waiting ? <Loader2 className="animate-spin" size={18}/> : <LogIn size={18}/>} {step === 1 ? 'Login' : 'Verify OTP'}
          </button>
          {step === 2 && timer <= 0 && (
            <div className="text-red-500 mt-2 text-center text-xs">OTP expired. <button className="underline font-semibold" type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }}>Try again</button></div>
          )}
        </form>
      </div>
      <div className="mt-4 text-gray-500 text-xs flex items-center gap-2 justify-center">
        <span>Powered by</span> <span className="font-bold text-blue-700">VKSWebUI</span>
      </div>
    </CenteredForm>
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
      { key: 'MobileNumber', label: 'Mobile Number' },
      { key: 'EmailID', label: 'Email ID' },
      { key: 'AccessControl', label: 'Access Control' },
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
  if ('id' in row && row.id !== undefined && row.id !== null) return row.id;
  // For center_account_details, use composite PK
  if ('CODE' in row && 'BANK_ACC_NUMBER' in row && 'NAME' in row && 'IFSC' in row && 'BRANCH' in row) {
    return [row.CODE, row.BANK_ACC_NUMBER, row.NAME, row.IFSC, row.BRANCH].join('__');
  }
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
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    fetch(`${API}/${endpoint}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleEdit = (row) => {
    setEditKey(getRowKey(row, columns));
    setEditRow({ ...row });
  };
  const handleSave = async (row) => {
    setError('');
    let url = `${API}/${endpoint}/`;
    if (endpoint === 'center_account_details') {
      url += [
        row.CODE,
        encodeURIComponent(row.BANK_ACC_NUMBER),
        encodeURIComponent(row.NAME),
        encodeURIComponent(row.IFSC),
        encodeURIComponent(row.BRANCH)
      ].join('/');
    } else if ('id' in row) {
      url += row.id;
    } else {
      url += columns.map(col => encodeURIComponent(row[col.key])).join('/');
    }
    const payload = {};
    columns.forEach(col => {
      payload[col.key] = editRow[col.key];
    });
    if (endpoint === 'center_account_details') {
      payload.CODE = row.CODE;
      payload.BANK_ACC_NUMBER = row.BANK_ACC_NUMBER;
      payload.NAME = row.NAME;
      payload.IFSC = row.IFSC;
      payload.BRANCH = row.BRANCH;
    }
    if (row.id) payload.id = row.id;
    setLoading(true);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (res.ok) {
      const updated = await res.json();
      setRows(rows.map(r => getRowKey(r, columns) === editKey ? updated : r));
      setEditKey(null);
      showToast('Saved!', 'success');
    } else {
      setError('Save failed');
      showToast('Save failed', 'error');
    }
  };
  const handleDelete = async (row) => {
    if (!window.confirm('Delete this row?')) return;
    let url = `${API}/${endpoint}/`;
    if (endpoint === 'center_account_details') {
      url += [
        row.CODE,
        encodeURIComponent(row.BANK_ACC_NUMBER),
        encodeURIComponent(row.NAME),
        encodeURIComponent(row.IFSC),
        encodeURIComponent(row.BRANCH)
      ].join('/');
    } else if ('id' in row) {
      url += row.id;
    } else {
      url += columns.map(col => encodeURIComponent(row[col.key])).join('/');
    }
    setLoading(true);
    await fetch(url, { method: 'DELETE', credentials: 'include' });
    setLoading(false);
    setRows(rows.filter(r => getRowKey(r, columns) !== getRowKey(row, columns)));
    showToast('Deleted!', 'success');
  };
  const handleAdd = async () => {
    setError('');
    setLoading(true);
    const res = await fetch(`${API}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newRow)
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setRows([...rows, data]);
      setAdding(false);
      setNewRow({});
      showToast('Added!', 'success');
    } else {
      setError('Add failed');
      showToast('Add failed', 'error');
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
        <h2 className="text-xl font-bold mr-4 flex items-center gap-2">
          {endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}
        </h2>
        {canEdit && <button className="bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1 shadow hover:bg-green-600" onClick={() => setAdding(true)}><Plus size={16}/> Add</button>}
      </div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
          {toast.msg}
        </div>
      )}
      {loading && <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin mr-2"/> Loading...</div>}
      {error && <div className="text-red-500 mb-2 flex items-center gap-2"><XCircle size={18}/>{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white rounded-lg">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              {columns.map(col => <th key={col.key} className="p-2 border-b text-left font-semibold">{col.label}</th>)}
              {canEdit && <th className="p-2 border-b">Actions</th>}
            </tr>
            {/* Filter row */}
            <tr>
              {columns.map(col => (
                <th key={col.key} className="p-2 border-b bg-gray-50">
                  <input
                    className="border p-1 rounded w-full text-sm focus:ring-2 focus:ring-blue-300"
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
            {filteredRows.map((row, i) => {
              const rowKey = getRowKey(row, columns);
              return (
                <tr key={rowKey} className={`border-b ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}>
                  {columns.map(col => (
                    <td key={col.key} className="p-2">
                      {editKey === rowKey ? (
                        <input className="border p-1 rounded w-full focus:ring-2 focus:ring-blue-300" value={editRow[col.key] || ''} onChange={e => setEditRow({ ...editRow, [col.key]: e.target.value })} />
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="p-2 flex gap-2">
                      {editKey === rowKey ? (
                        <>
                          <button className="text-green-600 hover:text-green-800" onClick={() => handleSave(row)} title="Save"><Save size={16}/></button>
                          <button className="text-gray-500 hover:text-gray-700" onClick={() => setEditKey(null)} title="Cancel"><X size={16}/></button>
                        </>
                      ) : (
                        <>
                          <button className="text-blue-600 hover:text-blue-800" onClick={() => handleEdit(row)} title="Edit"><Edit size={16}/></button>
                          <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={16}/></button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {adding && (
              <tr className="bg-yellow-50">
                {columns.map(col => (
                  <td key={col.key} className="p-2">
                    <input className="border p-1 rounded w-full focus:ring-2 focus:ring-blue-300" value={newRow[col.key] || ''} onChange={e => setNewRow({ ...newRow, [col.key]: e.target.value })} />
                  </td>
                ))}
                <td className="p-2 flex gap-2">
                  <button className="text-green-600 hover:text-green-800" onClick={handleAdd} title="Save"><Save size={16}/></button>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => { setAdding(false); setNewRow({}); }} title="Cancel"><X size={16}/></button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
