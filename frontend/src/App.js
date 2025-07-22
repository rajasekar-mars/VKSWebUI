import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import { LogIn, LogOut, Plus, Save, X, Edit, Trash2, Loader2, CheckCircle, XCircle, ChevronUp, ChevronDown, Sun, Moon } from 'lucide-react';

const API = 'http://localhost:5000/api';

// Dark mode context
const DarkModeContext = React.createContext();

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
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="mt-2 text-gray-600">Please sign in to continue</p>
        </div>
        <form
          onSubmit={step === 1 ? handleLogin : handleVerifyOtp}
          className="space-y-6"
        >
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 sr-only">Username</label>
                <input
                  className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 sr-only">Password</label>
                <input
                  className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 sr-only">OTP</label>
                <input
                  className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter OTP from admin"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="text-sm text-center text-gray-600">OTP is valid for <span className="font-bold">{timer}s</span></div>
            </>
          )}

          {error && (
            <div className="flex items-center justify-center gap-2 text-sm text-red-600 animate-shake">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
            type="submit"
            disabled={waiting || (step === 2 && timer <= 0)}
          >
            {waiting ? <Loader2 className="animate-spin" size={20} /> : (step === 1 ? 'Request OTP' : 'Verify & Login')}
          </button>

          {step === 2 && timer <= 0 && (
            <div className="text-sm text-center text-red-600">
              OTP expired. <button className="font-medium text-blue-600 hover:underline" type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }}>Request again</button>
            </div>
          )}
        </form>
        <p className="text-xs text-center text-gray-500">
          Powered by <span className="font-semibold text-gray-700">VKSWebUI</span>
        </p>
      </div>
    </CenteredForm>
  );
}

function MenuBar({ role, current, setCurrent, onLogout }) {
  const { darkMode, toggleDarkMode } = React.useContext(DarkModeContext);
  const menus = [
    { key: 'home', label: 'Home' },
    { key: 'centers', label: 'Centers' },
    { key: 'collections', label: 'Collections' },
    { key: 'sales', label: 'Sales' },
    { key: 'employees', label: 'Employees', admin: true },
    { key: 'accounts', label: 'Accounts' },
    { key: 'center_account_details', label: 'Center Account Details' },
    { key: 'contact', label: 'Contact Us' }
  ];

  const renderMenuItems = () => (
    <>
      {menus.map((m) =>
        (!m.admin || role === 'admin') && (
          <button
            key={m.key}
            className={`w-full md:w-auto text-left md:text-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'} focus:ring-blue-500
              ${current === m.key
                ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700')
                : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')}`}
            onClick={() => {
              setCurrent(m.key);
            }}
          >
            {m.label}
          </button>
        )
      )}
    </>
  );

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl shadow-lg border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Logo" className="h-10 w-10 rounded-full shadow-md border-2 border-white" />
            <span className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>VKSWebUI</span>
          </div>

          {/* Desktop Menu Items */}
          <div className="hidden md:flex items-center gap-1">
            {renderMenuItems()}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <button
              className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600 focus:ring-offset-gray-800' : 'bg-gray-200 text-blue-600 hover:bg-gray-300 focus:ring-offset-white'} focus:ring-blue-500`}
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      
    </nav>
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
  const { darkMode } = React.useContext(DarkModeContext);
  const [rows, setRows] = React.useState([]);
  // Export helpers
  // Import helpers
  const [importing, setImporting] = React.useState(false);
  const [rejectedRows, setRejectedRows] = React.useState([]);
  const fileInputRef = React.useRef();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setRejectedRows([]);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      let importedRows = [];
      let isXLSX = file.name.endsWith('.xlsx');
      try {
        if (isXLSX) {
          const wb = XLSX.read(evt.target.result, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          importedRows = XLSX.utils.sheet_to_json(ws);
        } else {
          const text = evt.target.result;
          const lines = text.split(/\r?\n/).filter(Boolean);
          const header = lines[0].split(',').map(h => h.trim());
          importedRows = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            header.forEach((h, i) => { obj[h] = values[i] || ''; });
            return obj;
          });
        }
      } catch (err) {
        alert('Failed to parse file.');
        setImporting(false);
        return;
      }
      let validRows = [];
      let rejected = [];
      // Get header values for comparison
      const headerLabels = columns.map(col => col.label);
      for (const row of importedRows) {
        // Check if this row is a header row (all values match header labels)
        const rowValues = columns.map(col => (row[col.label] ?? row[col.key] ?? '').toString().trim());
        const isHeaderRow = rowValues.every((val, idx) => val === headerLabels[idx]);
        if (isHeaderRow) continue; // Skip header row
        // Map imported keys to expected keys
        const mappedRow = {};
        columns.forEach(col => {
          mappedRow[col.key] = row[col.label] ?? row[col.key] ?? '';
        });
        // Basic validation: all required fields present
        let missing = columns.filter(col => !mappedRow[col.key]);
        if (missing.length) {
          rejected.push({ 
            ...row, 
            originalData: row,
            Reason: 'Missing required fields: ' + missing.map(m => m.label).join(', ') 
          });
          continue;
        }
        // Try to insert
        try {
          const res = await fetch(`${API}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(mappedRow)
          });
          let result;
          try { result = await res.json(); } catch { result = null; }
          if (res.ok && result && result.success) {
            validRows.push(result.data || result);
          } else {
            const msg = (result && result.message) ? result.message : 'Insert failed';
            rejected.push({ 
              ...row, 
              originalData: row,
              Reason: msg 
            });
          }
        } catch (err) {
          rejected.push({ 
            ...row, 
            originalData: row,
            Reason: 'Network error: ' + err.message 
          });
        }
      }
      if (validRows.length) {
        setRows([...rows, ...validRows]);
        showToast(`Imported ${validRows.length} rows`, 'success');
      }
      if (rejected.length) {
        setRejectedRows(rejected);
        showToast(`${rejected.length} rows rejected`, 'error');
      }
      setImporting(false);
    };
    if (file.name.endsWith('.xlsx')) reader.readAsBinaryString(file);
    else reader.readAsText(file);
  };

  const downloadRejectedCSV = () => {
    if (!rejectedRows.length) return;
    const header = [...columns.map(col => col.label), 'Rejection Reason'];
    const csvRows = [header.join(',')];
    rejectedRows.forEach(row => {
      const dataValues = columns.map(col => {
        // Try to get the value from multiple possible sources
        let value = row[col.label] ?? row[col.key] ?? '';
        // If still empty, try with original column mapping
        if (!value && row.originalData) {
          value = row.originalData[col.label] ?? row.originalData[col.key] ?? '';
        }
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      const reason = `"${(row.Reason ?? 'Unknown error').replace(/"/g, '""')}"`;
      csvRows.push([...dataValues, reason].join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${endpoint}_rejected.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadRejectedXLSX = () => {
    if (!rejectedRows.length) return;
    const data = rejectedRows.map(row => {
      const obj = {};
      columns.forEach(col => {
        // Try to get the value from multiple possible sources
        let value = row[col.label] ?? row[col.key] ?? '';
        // If still empty, try with original column mapping
        if (!value && row.originalData) {
          value = row.originalData[col.label] ?? row.originalData[col.key] ?? '';
        }
        obj[col.label] = value;
      });
      obj['Rejection Reason'] = row.Reason ?? 'Unknown error';
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rejected Records');
    XLSX.writeFile(wb, `${endpoint}_rejected.xlsx`);
  };
  const exportCSV = () => {
    const header = columns.map(col => col.label);
    const csvRows = [header.join(',')];
    sortedRows.forEach(row => {
      csvRows.push(columns.map(col => `"${(row[col.key] ?? '').toString().replace(/"/g, '""')}"`).join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${endpoint}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const data = sortedRows.map(row => {
      const obj = {};
      columns.forEach(col => { obj[col.label] = row[col.key]; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, endpoint);
    XLSX.writeFile(wb, `${endpoint}.xlsx`);
  };
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [editKey, setEditKey] = React.useState(null);
  const [editRow, setEditRow] = React.useState({});
  const [adding, setAdding] = React.useState(false);
  const [newRow, setNewRow] = React.useState({});
  const [error, setError] = React.useState('');
  const [filters, setFilters] = React.useState({});
  const [filterConditions, setFilterConditions] = React.useState({});
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  // Track which filter dropdown is open
  const [openFilterDropdown, setOpenFilterDropdown] = React.useState(null);

  React.useEffect(() => {
    if (openFilterDropdown !== null) {
      const handleClick = () => setOpenFilterDropdown(null);
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openFilterDropdown]);


  React.useEffect(() => {
    setPage(1); // Reset page to 1 when endpoint changes
    setRejectedRows([]); // Clear rejectedRows when switching screens
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

  const handleSort = (columnKey) => {
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnKey, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="inline ml-1" size={16} />
      : <ChevronDown className="inline ml-1" size={16} />;
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
    let result;
    try {
      result = await res.json();
    } catch {
      result = null;
    }
    if (res.ok && result && result.success) {
      setRows(rows.map(r => getRowKey(r, columns) === editKey ? result.data || result : r));
      setEditKey(null);
      showToast('Saved!', 'success');
    } else {
      const msg = (result && result.message) ? result.message : 'Save failed';
      setError(msg);
      showToast(msg, 'error');
      alert(msg);
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
    let result;
    try {
      result = await res.json();
    } catch {
      result = null;
    }
    if (res.ok && result && result.success) {
      setRows([...rows, result.data || result]);
      setAdding(false);
      setNewRow({});
      showToast('Added!', 'success');
    } else {
      const msg = (result && result.message) ? result.message : 'Add failed';
      setError(msg);
      showToast(msg, 'error');
      alert(msg);
    }
  };

  // Filtering logic
  const filteredRows = rows.filter(row =>
    columns.every(col => {
      const filter = filters[col.key]?.toLowerCase() || '';
      if (!filter) return true;
      const value = (row[col.key] || '').toString().toLowerCase();
      const condition = filterConditions[col.key] || 'contains';
      
      switch (condition) {
        case 'startswith':
          return value.startsWith(filter);
        case 'contains':
        default:
          return value.includes(filter);
      }
    })
  );

  // Sorting logic
  const sortedRows = React.useMemo(() => {
    if (!sortConfig.key) return filteredRows;
    
    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      // Handle numeric sorting
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string sorting
      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const pagedRows = sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className={`p-4 sm:p-6 lg:p-8 transition-all duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-3">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
          {endpoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{sortedRows.length} records</span>
        </h2>
        <div className="flex items-center gap-2">
          {canEdit && <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:bg-blue-600 transition-all duration-200" onClick={() => setAdding(true)}><Plus size={18}/> Add New</button>}
          
          {(Object.values(filters).some(v => v) || sortConfig.key) && (
            <button 
              className={`bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-gray-300 transition-all duration-200 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : ''}`}
              onClick={() => {
                setFilters({});
                setFilterConditions({});
                setSortConfig({ key: null, direction: 'asc' });
              }}
              title="Clear all filters and sorting"
            >
              <X size={16}/> Clear
            </button>
          )}
        </div>
      </div>
      
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-xl text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-down`}>
          {toast.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
          <span>{toast.msg}</span>
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-12 text-lg"><Loader2 className="animate-spin mr-3" size={24}/> Loading data, please wait...</div>}
      
      <div className={`overflow-x-auto rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <table className="min-w-full bg-transparent">
          <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900/70' : 'bg-gray-100/70'}`}>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className={`p-3 border-b text-left font-semibold cursor-pointer hover:bg-gray-200/70 select-none ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-700/70' : 'border-gray-200 text-gray-600'}`}
                  onClick={() => handleSort(col.key)}
                  title={`Sort by ${col.label}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
              {canEdit && <th className={`p-3 border-b ${darkMode ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Actions</th>}
            </tr>
            {/* Filter row */}
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`p-2 border-b ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                  <div className="flex items-center gap-1">
                    <input
                      className={`border p-2 rounded-md w-full text-sm focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400' : 'bg-white border-gray-300 focus:ring-blue-500'}`}
                      placeholder={`Search ${col.label}...`}
                      value={filters[col.key] || ''}
                      onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}
                    />
                  </div>
                </th>
              ))}
              {canEdit && <th className={`p-2 border-b ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}></th>}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, i) => {
              const rowKey = getRowKey(row, columns);
              return (
                <tr key={rowKey} className={`border-b transition-colors duration-200 ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-blue-50/50'}`}>
                  {columns.map(col => (
                    <td key={col.key} className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {editKey === rowKey ? (
                        <input className={`border p-2 rounded-md w-full focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400' : 'bg-white border-gray-300 focus:ring-blue-500'}`} value={editRow[col.key] || ''} onChange={e => setEditRow({ ...editRow, [col.key]: e.target.value })} />
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="p-3 flex items-center gap-3">
                      {editKey === rowKey ? (
                        <>
                          <button className="text-green-500 hover:text-green-400 transition-colors" onClick={() => handleSave(row)} title="Save"><Save size={20}/></button>
                          <button className="text-gray-500 hover:text-gray-300 transition-colors" onClick={() => setEditKey(null)} title="Cancel"><X size={20}/></button>
                        </>
                      ) : (
                        <>
                          <button className="text-blue-500 hover:text-blue-400 transition-colors" onClick={() => handleEdit(row)} title="Edit"><Edit size={20}/></button>
                          <button className="text-red-500 hover:text-red-400 transition-colors" onClick={() => handleDelete(row)} title="Delete"><Trash2 size={20}/></button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {adding && (
              <tr className={`${darkMode ? 'bg-gray-700/50' : 'bg-yellow-50/50'}`}>
                {columns.map(col => (
                  <td key={col.key} className="p-3">
                    <input className={`border p-2 rounded-md w-full focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400' : 'bg-white border-gray-300 focus:ring-blue-500'}`} value={newRow[col.key] || ''} onChange={e => setNewRow({ ...newRow, [col.key]: e.target.value })} />
                  </td>
                ))}
                <td className="p-3 flex items-center gap-3">
                  <button className="text-green-500 hover:text-green-400 transition-colors" onClick={handleAdd} title="Save"><Save size={20}/></button>
                  <button className="text-gray-500 hover:text-gray-300 transition-colors" onClick={() => { setAdding(false); setNewRow({}); }} title="Cancel"><X size={20}/></button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination and Export/Import controls */}
        <div className="flex flex-col md:flex-row items-center justify-between p-3 gap-4">
          <div className="flex items-center gap-2">
            <button className={`px-3 py-1 rounded-md transition-colors ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? (page === 1 ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500 text-white') : ''}`} disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Page {page} of {totalPages}</span>
            <button className={`px-3 py-1 rounded-md transition-colors ${page === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? (page === totalPages ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-500 text-white') : ''}`} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
            <select className={`ml-2 border rounded-md px-2 py-1 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          
          {['admin','ChiefAccountant','ChiefSupervisor'].includes(window.currentUserRole) && (
            <div className="flex items-center gap-2">
              <select
                className={`bg-green-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-green-600 cursor-pointer transition-all duration-200 ${darkMode ? 'bg-green-600 hover:bg-green-700' : ''}`}
                defaultValue=""
                onChange={e => {
                  if (e.target.value === 'csv') exportCSV();
                  else if (e.target.value === 'xlsx') exportXLSX();
                  e.target.value = '';
                }}
              >
                <option value="" disabled>Export Data</option>
                <option value="csv">as CSV</option>
                <option value="xlsx">as XLSX</option>
              </select>
              <button
                className={`bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition-all duration-200 ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                type="button"
                disabled={importing}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >Import Data</button>
              <input
                type="file"
                accept=".csv,.xlsx"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleImport}
                disabled={importing}
              />
              {rejectedRows.length > 0 && (
                <select
                  className={`bg-red-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-red-600 cursor-pointer transition-all duration-200 ${darkMode ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value === 'csv') downloadRejectedCSV();
                    else if (e.target.value === 'xlsx') downloadRejectedXLSX();
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>Rejected ({rejectedRows.length})</option>
                  <option value="csv">Download CSV</option>
                  <option value="xlsx">Download XLSX</option>
                </select>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { darkMode } = React.useContext(DarkModeContext);
  const [role, setRole] = useState(null);
  const [menu, setMenu] = useState('home');
  const [contact, setContact] = React.useState(null);

  React.useEffect(() => {
    // Try to fetch from public folder (works for dev and production)
    fetch(process.env.PUBLIC_URL ? process.env.PUBLIC_URL + '/contact.json' : '/contact.json')
      .then(r => r.json())
      .then(setContact)
      .catch(() => setContact(null));
  }, []);

  const handleLogout = async () => {
    await fetch(`${API}/logout`, { credentials: 'include' });
    setRole(null);
  };

  if (!role) return <Login onLogin={setRole} />;

  // Set global user role for export button access
  window.currentUserRole = role;

  let content;
  if (menu === 'home') {
    content = (
      <div className={`flex flex-col items-center justify-center text-center py-16 px-4 transition-all duration-500 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Logo" className="w-24 h-24 mb-6 rounded-full shadow-2xl" />
        <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Welcome to VKSWebUI</h1>
        <p className={`text-lg md:text-xl max-w-2xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Your central hub for managing centers, collections, sales, and more. Navigate through the app using the menu above.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          {TABLES && Object.keys(TABLES).map(key => (
            <div key={key} className={`p-6 rounded-xl shadow-lg transition-all duration-300 cursor-pointer ${darkMode ? 'bg-gray-800/80 hover:bg-gray-700/80' : 'bg-white/80 hover:bg-blue-50/80'} backdrop-blur-md border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} onClick={() => setMenu(key)}>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage {key.replace(/_/g, ' ')} data.</p>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (menu === 'contact') {
    content = (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Get in Touch</h1>
        <p className={`text-lg md:text-xl max-w-2xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>We're here to help. Contact us through any of our offices.</p>
        <div className={`rounded-2xl shadow-2xl p-6 md:p-8 mt-4 w-full max-w-6xl transition-all duration-500 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {contact ? (
            <div className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-center gap-8">
              {/* Head Office */}
              <div className={`flex-1 min-w-[300px] rounded-xl p-6 transition-all duration-500 text-left ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50/50'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Head Office</h2>
                <p className="mb-2"><strong className="font-semibold">Address:</strong> {contact.head_office?.address}</p>
                <p className="mb-2"><strong className="font-semibold">Email:</strong> <a href={`mailto:${contact.head_office?.email}`} className="text-blue-400 hover:underline">{contact.head_office?.email}</a></p>
                <p><strong className="font-semibold">Phone:</strong> <a href={`tel:${contact.head_office?.phone?.replace(/\s+/g, '')}`} className="text-blue-400 hover:underline">{contact.head_office?.phone}</a></p>
              </div>
              {/* Branches */}
              {Array.isArray(contact.branches) && contact.branches.length > 0 && (
                <div className="flex-1 min-w-[300px] text-left">
                  <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Our Branches</h2>
                  <div className="space-y-4">
                    {contact.branches.map((branch, idx) => (
                      <div key={idx} className={`rounded-xl p-4 transition-all duration-500 ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50/50'}`}>
                        <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{branch.name}</h3>
                        <p className="mb-1"><strong className="font-semibold">Address:</strong> {branch.address}</p>
                        <p className="mb-1"><strong className="font-semibold">Email:</strong> <a href={`mailto:${branch.email}`} className="text-blue-400 hover:underline">{branch.email}</a></p>
                        <p><strong className="font-semibold">Phone:</strong> <a href={`tel:${branch.phone?.replace(/\s+/g, '')}`} className="text-blue-400 hover:underline">{branch.phone}</a></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 flex items-center justify-center gap-3"><Loader2 className="animate-spin" /> Loading contact information...</div>
          )}
        </div>
      </div>
    );
  } else {
    const { columns, keyFields } = TABLES[menu];
    content = <CrudTable endpoint={menu} columns={columns} keyFields={keyFields} canEdit={role === 'admin' || menu !== 'employees'} />;
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <MenuBar role={role} current={menu} setCurrent={setMenu} onLogout={handleLogout} />
      <main className="w-full">
        {content}
      </main>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('vkswebui_darkmode') === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('vkswebui_darkmode', darkMode);
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(d => !d);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <AppContent />
    </DarkModeContext.Provider>
  );
}

export default App;
