import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, Settings, Bell,
  Plus, Search, ArrowUpRight, ArrowDownRight, TrendingUp, MoreHorizontal,
  Pencil, Trash2, X, CheckCircle2, AlertCircle, Menu, CalendarDays,
  Download, Sparkles, ChevronDown, CircleDollarSign
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
const categories = ['Food & Dining', 'Shopping', 'Transport', 'Bills & Utilities', 'Entertainment', 'Health', 'Salary', 'Freelance', 'Other'];
const palette = ['#7c6cf2', '#36c6a1', '#f5a45d', '#ec6b91', '#65a9e8', '#b39af7', '#83c98d'];
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const getLocalDateString = (d = new Date()) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('checking');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [period, setPeriod] = useState('6 months');
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  async function loadData() {
    setLoading(true);
    try {
      const health = await fetch(`${API}/health`);
      if (!health.ok) throw new Error('API is not responding');
      const healthData = await health.json();
      setApiStatus(healthData.database === 'connected' ? 'connected' : 'db-offline');
      const response = await fetch(`${API}/transactions`);
      if (!response.ok) throw new Error('Could not load transactions');
      setTransactions(await response.json());
    } catch (e) {
      setApiStatus('offline');
      notify('Cannot reach backend. Check that the API and MongoDB are running.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense, savings: income ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0 };
  }, [transactions]);

  const visible = useMemo(() => transactions.filter(t => {
    const matchesQuery = `${t.title} ${t.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesType = filter === 'all' || t.type === filter;
    return matchesQuery && matchesType;
  }), [transactions, query, filter]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (period === 'This year') {
      for (let m = 0; m <= currentMonth; m++) {
        const d = new Date(currentYear, m, 1);
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        const monthItems = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getFullYear() === currentYear && td.getMonth() === m;
        });
        months.push({
          month: label,
          income: monthItems.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
          expenses: monthItems.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        const monthItems = transactions.filter(t => {
          const td = new Date(t.date);
          return `${td.getFullYear()}-${td.getMonth()}` === key;
        });
        months.push({
          month: label,
          income: monthItems.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
          expenses: monthItems.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        });
      }
    }
    return months;
  }, [transactions, period]);

  const categoryData = useMemo(() => {
    const grouped = {};
    transactions.filter(t => t.type === 'expense').forEach(t => grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount));
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value);
  }, [transactions]);

  async function saveTransaction(data) {
    try {
      const url = editing ? `${API}/transactions/${editing._id}` : `${API}/transactions`;
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || 'Save failed');
      setModal(false); setEditing(null); await loadData();
      notify(editing ? 'Transaction updated successfully' : 'Transaction added successfully');
    } catch (e) { notify(e.message); }
  }

  async function deleteTransaction(id) {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const response = await fetch(`${API}/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      await loadData(); notify('Transaction deleted');
    } catch (e) { notify(e.message); }
  }

  function exportCSV() {
    const rows = [['Title','Type','Category','Amount','Date','Note'], ...visible.map(t => [t.title,t.type,t.category,t.amount,shortDate(t.date),t.note || ''])];
    const csv = rows.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'finora-transactions.csv'; link.click();
    URL.revokeObjectURL(link.href);
  }

  const openAdd = () => { setEditing(null); setModal(true); };
  const statusText = apiStatus === 'connected' ? 'MongoDB connected' : apiStatus === 'db-offline' ? 'Database disconnected' : apiStatus === 'checking' ? 'Checking connection' : 'Backend offline';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'show' : ''}`}>
        <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><span>finora</span><button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          <a className="nav-item active"><LayoutDashboard size={18}/> Overview</a>
          <a className="nav-item" onClick={() => document.getElementById('transactions')?.scrollIntoView({behavior:'smooth'})}><ArrowLeftRight size={18}/> Transactions</a>
          <a className="nav-item" onClick={() => document.getElementById('analytics')?.scrollIntoView({behavior:'smooth'})}><TrendingUp size={18}/> Analytics</a>
          <a className="nav-item" onClick={() => notify('Budgets are coming soon!')}><PiggyBank size={18}/> Budgets <span className="soon">SOON</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><b>Make money clearer</b><p>Track every rupee and build better habits.</p><button onClick={openAdd}>Add transaction <ArrowUpRight size={14}/></button></div>
          <a className="nav-item muted" onClick={() => notify('Settings are coming soon')}><Settings size={18}/> Settings</a>
          <div className="profile"><div className="avatar">DS</div><div><b>My Workspace</b><small>Personal account</small></div><MoreHorizontal size={19}/></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="top-left"><button className="hamburger" onClick={() => setMobileNav(true)}><Menu/></button><div><div className="eyebrow">{new Date().toLocaleDateString('en-IN',{weekday:'long'}).toUpperCase()}, {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}).toUpperCase()}</div><h1>{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'} <span>✦</span></h1></div></div>
          <div className="top-actions"><div className={`connection ${apiStatus}`}><span className="status-dot"/>{statusText}</div><button className="icon-button" onClick={() => notify('You’re all caught up!')}><Bell size={18}/><i/></button><div className="top-avatar">DS</div></div>
        </header>

        <section className="welcome-row"><div><h2>Your financial snapshot</h2><p>Here’s what’s happening with your money.</p></div><button className="primary-btn" onClick={openAdd}><Plus size={17}/> Add transaction</button></section>

        {apiStatus === 'offline' && <div className="alert"><AlertCircle size={18}/><div><b>Backend connection failed</b><span>Start the backend in a terminal with <code>cd backend</code> then <code>npm run dev</code>.</span></div><button onClick={loadData}>Retry connection</button></div>}
        {apiStatus === 'db-offline' && <div className="alert"><AlertCircle size={18}/><div><b>MongoDB is not connected</b><span>Check MONGO_URI in backend/.env and make sure MongoDB is running.</span></div><button onClick={loadData}>Retry</button></div>}

        <section className="stats-grid">
          <StatCard title="Total balance" value={money(totals.balance)} icon={<Wallet/>} tint="violet" detail="Income minus expenses" trend="Your available total"/>
          <StatCard title="Total income" value={money(totals.income)} icon={<ArrowDownRight/>} tint="green" detail="All recorded earnings" trend="Money coming in"/>
          <StatCard title="Total expenses" value={money(totals.expense)} icon={<ArrowUpRight/>} tint="orange" detail="All recorded spending" trend="Money going out"/>
          <StatCard title="Savings rate" value={`${totals.savings}%`} icon={<PiggyBank/>} tint="pink" detail="Of your total income" trend="Income saved"/>
        </section>

        <section className="analytics-grid" id="analytics">
          <div className="panel chart-panel"><div className="panel-heading"><div><h3>Cash flow</h3><p>Income vs expenses over the last 6 months</p></div><button className="select-like" onClick={() => setPeriod(period === '6 months' ? 'This year' : '6 months')}>{period}<ChevronDown size={15}/></button></div>
            <div className="legend"><span><i className="legend-income"/> Income</span><span><i className="legend-expense"/> Expenses</span></div>
            <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:8,left:-18,bottom:0}}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#36c6a1" stopOpacity={.22}/><stop offset="95%" stopColor="#36c6a1" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b7cf6" stopOpacity={.2}/><stop offset="95%" stopColor="#8b7cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf0f5"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#9aa3b2',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9aa3b2',fontSize:11}} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v}/><Tooltip formatter={(v) => money(v)} contentStyle={{border:'1px solid #edf0f5',borderRadius:12,fontSize:12}}/><Area type="monotone" dataKey="income" stroke="#36c6a1" strokeWidth={2.5} fill="url(#incomeFill)"/><Area type="monotone" dataKey="expenses" stroke="#8b7cf6" strokeWidth={2.5} fill="url(#expenseFill)"/></AreaChart></ResponsiveContainer></div>
          </div>
          <div className="panel spending-panel"><div className="panel-heading"><div><h3>Spending breakdown</h3><p>Where your money goes</p></div><button className="dots-btn" onClick={() => notify('Showing all recorded categories')}><MoreHorizontal/></button></div>
            {categoryData.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={4} stroke="none">{categoryData.map((e,i)=><Cell key={e.name} fill={palette[i%palette.length]}/>)}</Pie><Tooltip formatter={v=>money(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><b>{money(totals.expense)}</b><span>Total spent</span></div></div><div className="category-list">{categoryData.slice(0,4).map((c,i)=><div className="category-row" key={c.name}><span className="category-dot" style={{background:palette[i%palette.length]}}/ ><span className="category-name">{c.name}</span><b>{money(c.value)}</b></div>)}</div></> : <div className="empty-chart"><div className="empty-icon"><CircleDollarSign/></div><b>No spending data yet</b><span>Add an expense to see your breakdown.</span></div>}
          </div>
        </section>

        <section className="panel transactions-panel" id="transactions">
          <div className="panel-heading transaction-heading"><div><h3>Recent transactions</h3><p>Your latest money movements</p></div><div className="table-actions"><button className="outline-btn" onClick={exportCSV}><Download size={15}/> Export</button><button className="primary-btn small" onClick={openAdd}><Plus size={16}/> Add new</button></div></div>
          <div className="filters"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search transactions..."/></div><div className="filter-tabs">{['all','income','expense'].map(f=><button key={f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f==='all'?'All':f[0].toUpperCase()+f.slice(1)}</button>)}</div></div>
          <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th></th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5" className="empty-row">Loading your transactions...</td></tr> : visible.length ? visible.slice(0,12).map(t=><tr key={t._id}><td><div className="transaction-title"><div className={`transaction-icon ${t.type}`}>{t.type==='income'?<ArrowDownRight size={17}/>:<ArrowUpRight size={17}/>}</div><div><b>{t.title}</b><small>{t.note || (t.type==='income'?'Money received':'Payment')}</small></div></div></td><td><span className="category-pill">{t.category}</span></td><td className="date-cell">{shortDate(t.date)}</td><td className={`amount-cell ${t.type}`}>{t.type==='income'?'+':'−'}{money(t.amount)}</td><td><div className="row-actions"><button title="Edit" onClick={()=>{setEditing(t);setModal(true)}}><Pencil size={15}/></button><button title="Delete" onClick={()=>deleteTransaction(t._id)}><Trash2 size={15}/></button></div></td></tr>) : <tr><td colSpan="5" className="empty-row">No transactions found. Add your first transaction to get started.</td></tr>}
          </tbody></table></div>
          <div className="table-footer"><span>Showing {Math.min(visible.length,12)} of {visible.length} transactions</span><span>Stored securely in your MongoDB database</span></div>
        </section>
        <footer>© 2026 Finora Finance <span>Made for smarter money habits <Sparkles size={13}/></span></footer>
      </main>
      {modal && <TransactionModal initial={editing} onClose={()=>{setModal(false);setEditing(null)}} onSave={saveTransaction}/>}
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  );
}

function StatCard({title,value,icon,tint,detail,trend}) {
  return <div className="stat-card"><div className="stat-top"><span>{title}</span><div className={`stat-icon ${tint}`}>{icon}</div></div><div className="stat-value">{value}</div><div className="stat-bottom"><span>{detail}</span><span className="stat-trend">{trend}</span></div></div>;
}

function TransactionModal({initial,onClose,onSave}) {
  const [form,setForm] = useState({
    title: initial?.title || '', amount: initial?.amount || '', type: initial?.type || 'expense',
    category: initial?.category || 'Food & Dining', date: initial?.date ? getLocalDateString(initial.date) : getLocalDateString(),
    note: initial?.note || ''
  });
  const update = (key,value) => setForm(old=>({...old,[key]:value}));
  const submit = (e) => { e.preventDefault(); onSave({...form,amount:Number(form.amount),date:new Date(form.date)}); };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h2>{initial?'Edit transaction':'Add transaction'}</h2><p>Keep your finances up to date.</p></div><button onClick={onClose}><X/></button></div>
    <form onSubmit={submit}><label>Transaction name<input required maxLength="70" placeholder="e.g. Monthly salary, Grocery shopping" value={form.title} onChange={e=>update('title',e.target.value)}/></label>
      <label>Amount (₹)<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>update('amount',e.target.value)}/></label>
      <div className="form-two"><label>Type<select value={form.type} onChange={e=>{update('type',e.target.value);update('category',e.target.value==='income'?'Salary':'Food & Dining')}}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Category<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.filter(c=>form.type==='income'?['Salary','Freelance','Other'].includes(c):!['Salary','Freelance'].includes(c)).map(c=><option key={c}>{c}</option>)}</select></label></div>
      <label>Date<input required type="date" value={form.date} onChange={e=>update('date',e.target.value)}/></label>
      <label>Note <span className="optional">(optional)</span><textarea rows="3" placeholder="Add a little detail..." value={form.note} onChange={e=>update('note',e.target.value)}/></label>
      <div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>Cancel</button><button type="submit" className="primary-btn"><Plus size={16}/>{initial?'Save changes':'Add transaction'}</button></div>
    </form>
  </div></div>;
}

export default App;
