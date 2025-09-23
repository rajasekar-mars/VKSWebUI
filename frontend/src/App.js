import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import { 
  LogIn, LogOut, Plus, Save, X, Edit, Trash2, Loader2, CheckCircle, XCircle, 
  ChevronUp, ChevronDown, Sun, Moon, Eye, EyeOff, User, Lock, Search, Filter,
  Download, Upload, RefreshCw, BarChart3, Users, MapPin, DollarSign, 
  Building2, Phone, Mail, Globe, TrendingUp, Activity, Zap, Shield,
  Calendar, Clock, ArrowRight, Star, ChevronRight, Menu, Home, Settings
} from 'lucide-react';

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
// ...existing code...

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        // Fetch full user data including access control
        const userRes = await fetch(`${API}/user`, { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          onLogin({ role: userData.role, username: userData.username, access_control: userData.access_control });
        } else {
          onLogin({ role: data.role, username: data.username, access_control: [] });
        }
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
      // Fetch full user data including access control
      const userRes = await fetch(`${API}/user`, { credentials: 'include' });
      if (userRes.ok) {
        const userData = await userRes.json();
        onLogin({ role: userData.role, username: userData.username, access_control: userData.access_control });
      } else {
        onLogin({ role: data.role, username: data.username, access_control: [] });
      }
    } else {
      setError('Invalid or expired OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 relative">
          {/* Background decorative elements inside card */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] rounded-3xl"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-2xl"></div>
          
          <div className="relative z-10">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                VKS Business Portal
              </h1>
              <p className="text-gray-500 font-medium">Secure access to your business dashboard</p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
            </div>
          <form onSubmit={step === 1 ? handleLogin : handleVerifyOtp} className="space-y-7">
            {step === 1 ? (
              <>
                <div className="space-y-5">
                  <div className="relative group">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter your business username"
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white placeholder-gray-400 font-medium group-hover:border-gray-300"
                        required
                        autoFocus
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your secure password"
                        className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white placeholder-gray-400 font-medium group-hover:border-gray-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    />
                    <span className="ml-3 text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 hover:underline">
                    Forgot password?
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="relative group">
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Verification Code (OTP)
                  </label>
                  <div className="relative">
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter 6-digit verification code"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 transition-all duration-300 bg-gray-50/50 focus:bg-white placeholder-gray-400 font-medium text-center text-lg tracking-widest group-hover:border-gray-300"
                      required
                      autoFocus
                      maxLength="6"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-sm text-blue-700 font-medium">
                    Code expires in <span className="font-bold text-lg text-blue-800">{timer}s</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timer / 60) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
            {error && (
              <div className="flex items-center justify-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            )}
            
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group"
              type="submit"
              disabled={waiting || (step === 2 && timer <= 0)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {waiting ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {step === 1 ? (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Request Access Code</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </>
              )}
            </button>
            
            {step === 2 && timer <= 0 && (
              <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-700 mb-3 font-medium">
                  Your verification code has expired
                </p>
                <button 
                  className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 underline" 
                  type="button" 
                  onClick={() => { setStep(1); setOtp(''); setError(''); }}
                >
                  Request a new code
                </button>
              </div>
            )}
          </form>
          
          {/* Footer Section */}
          <div className="mt-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium px-3">SECURE LOGIN</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200"></div>
            </div>
            
            <p className="text-gray-500 text-sm">
              Need help accessing your account?{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 hover:underline">
                Contact Support
              </a>
            </p>
            
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Enterprise Ready</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
          </div>
        </div>
        
        {/* Bottom tagline */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm font-medium">
            Powered by VKS Technology • Trusted by businesses worldwide
          </p>
        </div>
      </div>
    </div>
  );
}

function MenuBar({ user, current, setCurrent, onLogout, menus, hasAccess }) {
  const { darkMode, toggleDarkMode } = React.useContext(DarkModeContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderMenuItems = () => (
    <>
      {menus.map((m) =>
        hasAccess(m) && (
          <button
            key={m.key}
            className={`group flex items-center gap-2 w-full md:w-auto text-left md:text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'} focus:ring-blue-500
              ${current === m.key
                ? (darkMode ? 'bg-blue-500/20 text-blue-300 shadow-lg' : 'bg-blue-100 text-blue-700 shadow-md')
                : (darkMode ? 'text-gray-300 hover:bg-gray-700/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}`}
            onClick={() => {
              setCurrent(m.key);
              setMobileMenuOpen(false);
            }}
          >
            <m.icon className="w-4 h-4" />
            <span className="md:hidden lg:inline">{m.label}</span>
          </button>
        )
      )}
    </>
  );

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl shadow-lg border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <span className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>VKS</span>
                <span className={`text-xl font-bold tracking-tight gradient-text`}>Portal</span>
              </div>
            </div>

            {/* Desktop Menu Items */}
            <div className="hidden md:flex items-center gap-2">
              {renderMenuItems()}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              <button
                className={`p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 focus:ring-offset-gray-900' : 'bg-gray-100 text-blue-600 hover:bg-gray-200 focus:ring-offset-white'} focus:ring-blue-500 shadow-md`}
                onClick={toggleDarkMode}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              {/* User Menu */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} shadow-md`}>
                <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                  <User className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} hidden sm:inline`}>
                  {user.role === 'admin' ? user.username + ' (Admin)' : user.username}
                </span>
              </div>
              
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={onLogout}
                title="Logout"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile menu button */}
              <button
                className={`md:hidden p-2.5 rounded-xl transition-all duration-200 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} shadow-md`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className={`fixed top-16 left-0 right-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} shadow-lg`}>
            <div className="px-4 py-4 space-y-2">
              {renderMenuItems()}
            </div>
          </div>
        </div>
      )}
    </>
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
      { 
        key: 'item', 
        label: 'Item',
        type: 'select',
        options: ['Milk', 'Cream', 'Butter', 'Others'],
        default: 'Milk'
      },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'price', label: 'Price', type: 'number' },
      { 
        key: 'date', 
        label: 'Date',
        type: 'date',
        default: () => new Date().toISOString().split('T')[0]
      },
      { 
        key: 'customer_id', 
        label: 'Customer',
        type: 'select',
        displayKey: 'name',
        valueKey: 'id',
        endpoint: 'customers'
      }
    ],
    keyFields: ['date', 'customer_id', 'item']
  },
  customers: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'gst_number', label: 'GST Number' },
      { key: 'account_number', label: 'Account Number' },
      { key: 'ifsc_code', label: 'IFSC Code' },
      { key: 'bank', label: 'Bank' },
      { key: 'address', label: 'Address' },
      { key: 'mobile_number', label: 'Mobile Number' }
    ],
    keyFields: ['name', 'mobile_number']
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
  const [accessControlOptions, setAccessControlOptions] = React.useState([]);
  const [customers, setCustomers] = React.useState([]);
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
    
    // Fetch main data
    fetch(`${API}/${endpoint}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    
    // Fetch access control options if this is employees endpoint
    if (endpoint === 'employees') {
      fetch(`${API}/access_control_options`, { credentials: 'include' })
        .then(r => r.json())
        .then(options => {
          setAccessControlOptions(Array.isArray(options) ? options : []);
        })
        .catch(() => setAccessControlOptions([]));
    }
    
    // Fetch customers data if this is sales endpoint or any endpoint that needs customer dropdown
    if (endpoint === 'sales' || columns.some(col => col.type === 'select' && col.endpoint === 'customers')) {
      fetch(`${API}/customers`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          setCustomers(Array.isArray(data) ? data : []);
        })
        .catch(() => setCustomers([]));
    }
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
    // For employees with AccessControl, ensure it's properly formatted
    const editData = { ...row };
    if (endpoint === 'employees' && editData.AccessControl) {
      // Ensure AccessControl is an array
      if (!Array.isArray(editData.AccessControl)) {
        editData.AccessControl = typeof editData.AccessControl === 'string' 
          ? editData.AccessControl.split(',').map(item => item.trim()).filter(Boolean)
          : [];
      }
    }
    setEditRow(editData);
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
      // Update the row with the response data
      const updatedItem = result.data || result;
      setRows(rows.map(r => getRowKey(r, columns) === editKey ? updatedItem : r));
      setEditKey(null);
      setEditRow({});
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
      // For employees endpoint, we get the full list back, so use that
      if (endpoint === 'employees' && Array.isArray(result.data)) {
        setRows(result.data);
      } else {
        // For other endpoints, add the new item to existing rows
        const newItem = result.data || result;
        setRows([...rows, newItem]);
      }
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

  // Helper function to display cell values correctly
  const displayCellValue = (col, value) => {
    // Handle customer_id display as customer name
    if (col.key === 'customer_id' && col.type === 'select' && col.endpoint === 'customers') {
      const customer = customers.find(c => c.id === value);
      return customer ? customer.name : value || 'N/A';
    }
    
    // Handle other select fields
    if (col.type === 'select' && col.options) {
      return value || 'N/A';
    }
    
    // Default display
    return value || 'N/A';
  };

  // Helper function to render appropriate input type based on column configuration
  const renderInput = (col, value, onChange) => {
    const inputClassName = `border p-2 rounded-md w-full focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400' : 'bg-white border-gray-300 focus:ring-blue-500'}`;
    
    // Handle different input types
    if (col.type === 'date') {
      return (
        <input
          type="date"
          className={inputClassName}
          value={value || (col.default && typeof col.default === 'function' ? col.default() : col.default) || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    
    if (col.type === 'number') {
      return (
        <input
          type="number"
          className={inputClassName}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${col.label.toLowerCase()}`}
        />
      );
    }
    
    if (col.type === 'select') {
      // Handle customer dropdown
      if (col.endpoint === 'customers') {
        return (
          <select
            className={inputClassName}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select {col.label}</option>
            {customers.map(customer => (
              <option key={customer[col.valueKey]} value={customer[col.valueKey]}>
                {customer[col.displayKey]}
              </option>
            ))}
          </select>
        );
      }
      
      // Handle static options
      if (col.options) {
        return (
          <select
            className={inputClassName}
            value={value || col.default || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select {col.label}</option>
            {col.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
    }
    
    // Default text input
    return (
      <input
        type="text"
        className={inputClassName}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={col.key === 'password' ? 'Enter password' : `Enter ${col.label.toLowerCase()}`}
      />
    );
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

  // MultiSelect AccessControl Component
  const MultiSelectAccessControl = ({ value, onChange, options, darkMode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef();
    
    // Ensure value is always an array
    const selectedValues = React.useMemo(() => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value) {
        return value.split(',').map(item => item.trim()).filter(Boolean);
      }
      return [];
    }, [value]);
    
    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const toggleOption = (option) => {
      let newValues;
      if (selectedValues.includes(option)) {
        newValues = selectedValues.filter(v => v !== option);
      } else {
        newValues = [...selectedValues, option];
      }
      onChange(newValues);
    };
    
    const displayText = selectedValues.length === 0 
      ? 'Select access...' 
      : selectedValues.length === 1 
        ? selectedValues[0] 
        : `${selectedValues.length} selected`;
    
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className={`w-full px-3 py-2 text-left border rounded-md focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400' : 'bg-white border-gray-300 focus:ring-blue-500'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className={`float-right mt-1 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-auto ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
            {options.map(option => (
              <label key={option} className={`flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer ${darkMode ? 'hover:bg-gray-600 text-white' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedValues.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

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
    <div className="p-4 sm:p-6 lg:p-8 transition-all duration-300">
      {/* Enhanced Header */}
      <div className={`card-shadow rounded-2xl p-6 mb-8 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'} backdrop-blur-xl`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3 mb-2`}>
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                {endpoint === 'centers' && <Building2 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                {endpoint === 'customers' && <User className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                {endpoint === 'collections' && <DollarSign className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                {endpoint === 'sales' && <TrendingUp className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                {endpoint === 'employees' && <Users className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                {endpoint === 'accounts' && <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                {endpoint === 'center_account_details' && <MapPin className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
              </div>
              {endpoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and monitor your {endpoint.replace(/_/g, ' ')} data
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                <Activity className="w-4 h-4" />
                {sortedRows.length} records
              </span>
              {(Object.values(filters).some(v => v) || sortConfig.key) && (
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                  <Filter className="w-4 h-4" />
                  Filtered
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {canEdit && (
              <button 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                onClick={() => {
                  // Initialize newRow with default values
                  const initialRow = {};
                  columns.forEach(col => {
                    if (col.default) {
                      if (typeof col.default === 'function') {
                        initialRow[col.key] = col.default();
                      } else {
                        initialRow[col.key] = col.default;
                      }
                    }
                  });
                  setNewRow(initialRow);
                  setAdding(true);
                }}
              >
                <Plus size={18}/>
                <span>Add New</span>
              </button>
            )}
            
            {(Object.values(filters).some(v => v) || sortConfig.key) && (
              <button 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                onClick={() => {
                  setFilters({});
                  setFilterConditions({});
                  setSortConfig({ key: null, direction: 'asc' });
                }}
                title="Clear all filters and sorting"
              >
                <X size={16}/>
                <span>Clear</span>
              </button>
            )}
            
            {['admin','ChiefAccountant','ChiefSupervisor'].includes(window.currentUserRole) && (
              <div className="flex items-center gap-2">
                <select
                  className={`px-4 py-2.5 rounded-xl font-semibold cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg ${darkMode ? 'bg-green-600 hover:bg-green-700 text-white border-gray-600' : 'bg-green-500 hover:bg-green-600 text-white border-gray-300'}`}
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                  type="button"
                  disabled={importing}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <Upload size={16}/>
                  {importing ? 'Importing...' : 'Import'}
                </button>
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
                    className={`px-4 py-2.5 rounded-xl font-semibold cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
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
      
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-xl text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-down`}>
          {toast.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
          <span>{toast.msg}</span>
        </div>
      )}

      {loading && (
        <div className={`flex items-center justify-center py-16 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4" size={32}/>
            <p className="text-lg font-medium">Loading data, please wait...</p>
          </div>
        </div>
      )}
      
      <div className={`card-shadow hover:card-shadow-hover transition-all duration-300 rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'} backdrop-blur-xl`}>
        <div className="overflow-x-auto">
        <table className="min-w-full">
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
                        col.key === 'AccessControl' && endpoint === 'employees' ? (
                          <MultiSelectAccessControl
                            value={editRow[col.key] || []}
                            onChange={(newValue) => setEditRow({ ...editRow, [col.key]: newValue })}
                            options={accessControlOptions}
                            darkMode={darkMode}
                          />
                        ) : (
                          renderInput(col, editRow[col.key], (newValue) => setEditRow({ ...editRow, [col.key]: newValue }))
                        )
                      ) : (
                        col.key === 'AccessControl' && endpoint === 'employees' 
                          ? (Array.isArray(row[col.key]) 
                              ? row[col.key].join(', ') 
                              : (row[col.key] || '').toString())
                          : displayCellValue(col, row[col.key])
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
                    {col.key === 'AccessControl' && endpoint === 'employees' ? (
                      <MultiSelectAccessControl
                        value={newRow[col.key] || []}
                        onChange={(newValue) => setNewRow({ ...newRow, [col.key]: newValue })}
                        options={accessControlOptions}
                        darkMode={darkMode}
                      />
                    ) : (
                      renderInput(col, newRow[col.key], (newValue) => setNewRow({ ...newRow, [col.key]: newValue }))
                    )}
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
        
        {/* Enhanced Pagination */}
        <div className={`flex flex-col sm:flex-row items-center justify-between p-6 ${darkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50/50 border-gray-200'} border-t backdrop-blur-sm`}>
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${page === 1 ? (darkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-md' : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md')}`}
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              Previous
            </button>
            <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} font-semibold shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              Page {page} of {totalPages}
            </div>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${page === totalPages ? (darkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-md' : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md')}`}
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Rows per page:
            </span>
            <select 
              className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm border ${darkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              value={rowsPerPage} 
              onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
          
          {['admin','ChiefAccountant','ChiefSupervisor'].includes(window.currentUserRole) && (
            <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
              <Activity className="w-4 h-4" />
              <span>Quick actions available above</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { darkMode } = React.useContext(DarkModeContext);
  const [user, setUser] = useState(null); // Changed from role to user object
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
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;

  // Define menus with access control
  const menus = [
    { key: 'home', label: 'Dashboard', icon: Home, access: null }, // Dashboard accessible to all
    { key: 'centers', label: 'Centers', icon: Building2, access: 'CENTER' },
    { key: 'customers', label: 'Customers', icon: User, access: 'SALES' },
    { key: 'collections', label: 'Collections', icon: DollarSign, access: 'COLLECTIONS' },
    { key: 'sales', label: 'Sales', icon: TrendingUp, access: 'SALES' },
    { key: 'employees', label: 'Employees', icon: Users, admin: true, access: 'EMPLOYEES' },
    { key: 'accounts', label: 'Accounts', icon: BarChart3, access: 'ACCOUNTS' },
    { key: 'center_account_details', label: 'Account Details', icon: MapPin, access: 'ACCOUNT_DETAILS' },
    { key: 'contact', label: 'Contact', icon: Phone, access: null } // Contact accessible to all
  ];

  // Helper function to check if user has access to a menu item
  const hasAccess = (menuItem) => {
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // If no access requirement, allow access
    if (!menuItem.access) return true;
    
    // If admin-only menu item and user is not admin
    if (menuItem.admin && user.role !== 'admin') return false;
    
    const userAccess = user.access_control || [];
    
    // FULL access grants access to all except EMPLOYEES
    if (userAccess.includes('FULL') && menuItem.access !== 'EMPLOYEES') return true;
    
    // Check specific access
    return userAccess.includes(menuItem.access);
  };

  // Set global user role for export button access
  window.currentUserRole = user.role;

  let content;
  if (menu === 'home') {
    content = (
      <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center animate-fade-in-up">
              <div className="flex items-center justify-center mb-6">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} shadow-lg`}>
                  <BarChart3 className={`w-12 h-12 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
              <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome to <span className="gradient-text">VKS Business Portal</span>
              </h1>
              {/* <p className={`text-xl md:text-2xl max-w-3xl mx-auto mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Your comprehensive business management solution. Monitor, analyze, and optimize your operations with powerful tools and insights.
              </p> */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Secure</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Fast</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, label: 'Centers', value: '12', change: '+2.5%', color: 'blue' },
              { icon: DollarSign, label: 'Collections', value: '₹2.5M', change: '+15.3%', color: 'green' },
              { icon: TrendingUp, label: 'Sales', value: '₹1.8M', change: '+8.7%', color: 'purple' },
              { icon: Users, label: 'Employees', value: '48', change: '+5.2%', color: 'orange' }
            ].map((stat, index) => (
              <div key={index} className={`card-shadow hover:card-shadow-hover transition-all duration-300 rounded-2xl p-6 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'} group cursor-pointer animate-fade-in-up`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    stat.color === 'blue' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') :
                    stat.color === 'green' ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') :
                    stat.color === 'purple' ? (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') :
                    (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')
                  } group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(TABLES).map((key, index) => {
                  const icons = {
                    centers: Building2,
                    collections: DollarSign,
                    sales: TrendingUp,
                    employees: Users,
                    accounts: BarChart3,
                    center_account_details: MapPin
                  };
                  const IconComponent = icons[key] || BarChart3;
                  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div 
                      key={key} 
                      className={`group card-shadow hover:card-shadow-hover transition-all duration-300 rounded-xl p-6 cursor-pointer ${darkMode ? 'bg-gray-800/80 border border-gray-700 hover:bg-gray-700/80' : 'bg-white border border-gray-100 hover:bg-blue-50/50'} animate-fade-in-up`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setMenu(key)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          color === 'blue' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') :
                          color === 'green' ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') :
                          color === 'purple' ? (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') :
                          color === 'orange' ? (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600') :
                          color === 'pink' ? (darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600') :
                          (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
                        } group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Manage {key.replace(/_/g, ' ')} data and operations
                          </p>
                        </div>
                        <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'} group-hover:text-blue-500 transition-colors`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Feed */}
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
              <div className={`card-shadow rounded-xl p-6 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="space-y-4">
                  {[
                    { icon: Plus, text: 'New center added in Mumbai', time: '2 hours ago', color: 'green' },
                    { icon: TrendingUp, text: 'Sales report generated', time: '4 hours ago', color: 'blue' },
                    { icon: Users, text: 'Employee access updated', time: '6 hours ago', color: 'purple' },
                    { icon: DollarSign, text: 'Collection data synced', time: '8 hours ago', color: 'orange' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className={`p-2 rounded-lg ${
                        activity.color === 'green' ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') :
                        activity.color === 'blue' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') :
                        activity.color === 'purple' ? (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') :
                        (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')
                      }`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {activity.text}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button className={`w-full text-center text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}>
                    View all activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (menu === 'contact') {
    content = (
      <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="flex items-center justify-center mb-6">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} shadow-lg`}>
                <Phone className={`w-12 h-12 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className={`text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              We're here to help you succeed. Reach out through any of our offices or contact channels.
            </p>
          </div>
          
          {contact ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Head Office */}
              <div className={`card-shadow hover:card-shadow-hover transition-all duration-500 rounded-2xl p-8 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'} animate-fade-in-up`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Building2 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Head Office</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{contact.head_office?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className={`w-5 h-5 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</p>
                      <a href={`mailto:${contact.head_office?.email}`} className="text-blue-500 hover:text-blue-600 transition-colors font-medium">
                        {contact.head_office?.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className={`w-5 h-5 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</p>
                      <a href={`tel:${contact.head_office?.phone?.replace(/\s+/g, '')}`} className="text-blue-500 hover:text-blue-600 transition-colors font-medium">
                        {contact.head_office?.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Branches */}
              {Array.isArray(contact.branches) && contact.branches.length > 0 && (
                <div>
                  <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-blue-300' : 'text-blue-800'} flex items-center gap-3`}>
                    <Globe className="w-6 h-6" />
                    Our Branches
                  </h2>
                  <div className="space-y-6">
                    {contact.branches.map((branch, idx) => (
                      <div key={idx} className={`card-shadow hover:card-shadow-hover transition-all duration-500 rounded-xl p-6 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'} animate-fade-in-up`} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'} flex items-center gap-2`}>
                          <Star className="w-5 h-5" />
                          {branch.name}
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className={`w-4 h-4 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{branch.address}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <a href={`mailto:${branch.email}`} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors text-sm font-medium">
                              <Mail className="w-4 h-4" />
                              {branch.email}
                            </a>
                            <a href={`tel:${branch.phone?.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors text-sm font-medium">
                              <Phone className="w-4 h-4" />
                              {branch.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center justify-center py-16 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4" size={32}/>
                <p className="text-lg font-medium">Loading contact information...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Check if user has access to the requested menu
    const menuItem = menus.find(m => m.key === menu);
    if (!menuItem || !hasAccess(menuItem)) {
      content = (
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`text-center p-8 rounded-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}>
            <div className="mb-4">
              <Shield className="w-16 h-16 mx-auto text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">You don't have permission to access this section.</p>
            <button
              onClick={() => setMenu('home')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    } else {
      const { columns, keyFields } = TABLES[menu];
      content = <CrudTable endpoint={menu} columns={columns} keyFields={keyFields} canEdit={user.role === 'admin' || menu !== 'employees'} />;
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <MenuBar user={user} current={menu} setCurrent={setMenu} onLogout={handleLogout} menus={menus} hasAccess={hasAccess} />
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
      if (document.body) document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (document.body) document.body.classList.remove('dark');
    }

  const toggleDarkMode = () => setDarkMode(d => !d);
  }, [darkMode]);
  const toggleDarkMode = () => setDarkMode(d => !d);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <AppContent />
    </DarkModeContext.Provider>
  );
}

export default App;
