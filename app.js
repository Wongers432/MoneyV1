// TapTrack Web App - v1.3.0
// State Management
const state = {
    totalBalance: 0.00,
    monthlyBudget: 450.00,
    weeklyBudget: 100.00,
    budgetPeriod: 'monthly',
    theme: 'system',
    notificationsEnabled: true,
    expenses: [],
    inflows: [],
    outflows: [],
    categories: [
        { id: '1', name: 'Food', icon: '🍔', color: '#FF9500' },
        { id: '2', name: 'Transport', icon: '🚌', color: '#007AFF' },
        { id: '3', name: 'Shopping', icon: '🛍️', color: '#FF2D55' },
        { id: '4', name: 'Bills', icon: '🧾', color: '#5856D6' },
        { id: '5', name: 'Health', icon: '🏥', color: '#32D74B' },
        { id: '6', name: 'Entertainment', icon: '🎮', color: '#AF52DE' },
        { id: '7', name: 'Income', icon: '💰', color: '#30D158' },
        { id: '8', name: 'Other', icon: '📦', color: '#8E8E93' }
    ],
    selectedCategory: null,
    activeFlowTab: 'inflows'
};

// UI Elements Reference
let els = {};

// Load State from LocalStorage
function loadState() {
    try {
        state.totalBalance = parseFloat(localStorage.getItem('totalBalance')) || 0.00;
        state.monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 450.00;
        state.weeklyBudget = parseFloat(localStorage.getItem('weeklyBudget')) || 100.00;
        state.budgetPeriod = localStorage.getItem('budgetPeriod') || 'monthly';
        state.theme = localStorage.getItem('theme') || 'system';
        state.notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
        
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) state.expenses = JSON.parse(savedExpenses);
        
        const savedInflows = localStorage.getItem('inflows');
        if (savedInflows) state.inflows = JSON.parse(savedInflows);

        const savedOutflows = localStorage.getItem('outflows');
        if (savedOutflows) state.outflows = JSON.parse(savedOutflows);
        
        const savedCats = localStorage.getItem('categories');
        if (savedCats) state.categories = JSON.parse(savedCats);
    } catch (e) {
        console.error("Error loading state:", e);
    }
}

// Initialization
function init() {
    loadState();
    
    // Cache UI Elements
    els = {
        totalBalance: document.getElementById('total-balance'),
        remainingAmount: document.getElementById('remaining-amount'),
        budgetPeriodLabel: document.getElementById('budget-period-label'),
        activePeriodBadge: document.getElementById('active-period-badge'),
        smartInsight: document.getElementById('smart-insight'),
        transactionList: document.getElementById('transaction-list'),
        quickAddModal: document.getElementById('quick-add-modal'),
        ringBar: document.querySelector('.progress-ring__bar'),
        expenseAmount: document.getElementById('expense-amount'),
        expenseNote: document.getElementById('expense-note'),
        editingExpenseId: document.getElementById('editing-expense-id'),
        deleteExpenseBtn: document.getElementById('delete-expense'),
        categorySelector: document.getElementById('category-selector'),
        
        // Flow View Elements
        inflowsList: document.getElementById('inflows-list'),
        outflowsList: document.getElementById('outflows-list'),
        monthlyOutflowTotal: document.getElementById('monthly-outflow-total'),
        flowSegments: document.querySelectorAll('.segment'),
        flowPanels: document.querySelectorAll('.flow-panel'),
        addFlowModal: document.getElementById('add-flow-modal'),
        editingFlowId: document.getElementById('editing-flow-id'),
        deleteFlowBtn: document.getElementById('delete-flow'),
        
        // Categories Modal
        categoriesModal: document.getElementById('categories-modal'),
        categoriesList: document.getElementById('categories-list-container'),
        
        // Settings elements
        themeSelect: document.getElementById('theme-select'),
        budgetPeriodSelect: document.getElementById('budget-period-select'),
        monthlyBudgetValue: document.getElementById('monthly-budget-value'),
        weeklyBudgetValue: document.getElementById('weekly-budget-value'),
        monthlyActiveStatus: document.getElementById('monthly-active-status'),
        weeklyActiveStatus: document.getElementById('weekly-active-status'),
        notificationsToggle: document.getElementById('notifications-toggle'),
        streakCount: document.getElementById('streak-count'),
        currentDate: document.getElementById('current-date'),
        views: document.querySelectorAll('.view'),
        tabs: document.querySelectorAll('.tab-item')
    };

    updateDate();
    applyTheme(state.theme);
    setupEventListeners();
    renderDashboard();
    renderCategorySelector();
    updateSettingsUI();
    
    console.log("TapTrack Initialized v1.3.0");
}

function updateDate() {
    if (!els.currentDate) return;
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    els.currentDate.textContent = new Date().toLocaleDateString('en-GB', options);
}

function applyTheme(theme) {
    if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function setupEventListeners() {
    // Tab Navigation
    els.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const viewId = tab.dataset.view;
            if (!viewId) return;
            switchView(viewId);
            els.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            hapticFeedback(5);
        });
    });

    // Modals & Forms
    const safeAddListener = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    safeAddListener('quick-add-trigger', 'click', () => openModal());
    safeAddListener('add-btn-top', 'click', () => openModal());
    safeAddListener('close-modal', 'click', closeModal);
    safeAddListener('save-expense', 'click', saveExpense);
    safeAddListener('delete-expense', 'click', deleteExpense);
    
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.addEventListener('click', closeModal);

    // Flow View Listeners
    els.flowSegments.forEach(segment => {
        segment.addEventListener('click', () => {
            const flowType = segment.dataset.flow;
            state.activeFlowTab = flowType;
            els.flowSegments.forEach(s => s.classList.remove('active'));
            segment.classList.add('active');
            els.flowPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(`${flowType}-panel`).classList.add('active');
            hapticFeedback(5);
        });
    });

    safeAddListener('add-flow-btn', 'click', () => openFlowModal());
    safeAddListener('close-flow-modal', 'click', closeFlowModal);
    safeAddListener('save-flow', 'click', saveFlow);
    safeAddListener('delete-flow', 'click', deleteFlow);

    // Category Management Listeners
    safeAddListener('manage-categories-btn', 'click', openCategoriesModal);
    safeAddListener('close-categories-modal', 'click', closeCategoriesModal);
    safeAddListener('add-category-inline', 'click', () => {
        const name = prompt("Category Name:");
        if (name) {
            const icon = prompt("Category Icon (Emoji):", "🏷️");
            const color = prompt("Category Color (Hex):", "#0057FF");
            const newCat = {
                id: Date.now().toString(),
                name: name,
                icon: icon || "🏷️",
                color: color || "#0057FF"
            };
            state.categories.push(newCat);
            localStorage.setItem('categories', JSON.stringify(state.categories));
            renderCategorySelector();
            renderCategoriesList();
        }
    });

    safeAddListener('edit-balance-trigger', 'click', () => {
        const val = prompt("Enter total balance:", state.totalBalance.toFixed(2));
        if (val !== null) {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                state.totalBalance = num;
                localStorage.setItem('totalBalance', num.toString());
                renderDashboard();
            }
        }
    });

    // Settings
    if (els.themeSelect) {
        els.themeSelect.addEventListener('change', (e) => {
            state.theme = e.target.value;
            localStorage.setItem('theme', state.theme);
            applyTheme(state.theme);
        });
    }

    if (els.budgetPeriodSelect) {
        els.budgetPeriodSelect.addEventListener('change', (e) => {
            state.budgetPeriod = e.target.value;
            localStorage.setItem('budgetPeriod', state.budgetPeriod);
            updateSettingsUI();
            renderDashboard();
        });
    }

    safeAddListener('edit-monthly-budget', 'click', () => {
        const val = prompt("Set Monthly Budget:", state.monthlyBudget.toFixed(2));
        if (val !== null) {
            const num = parseFloat(val);
            if (!isNaN(num) && num > 0) {
                state.monthlyBudget = num;
                localStorage.setItem('monthlyBudget', num.toString());
                updateSettingsUI();
                renderDashboard();
            }
        }
    });

    safeAddListener('edit-weekly-budget', 'click', () => {
        const val = prompt("Set Weekly Budget:", state.weeklyBudget.toFixed(2));
        if (val !== null) {
            const num = parseFloat(val);
            if (!isNaN(num) && num > 0) {
                state.weeklyBudget = num;
                localStorage.setItem('weeklyBudget', num.toString());
                updateSettingsUI();
                renderDashboard();
            }
        }
    });

    if (els.notificationsToggle) {
        els.notificationsToggle.addEventListener('change', (e) => {
            state.notificationsEnabled = e.target.checked;
            localStorage.setItem('notificationsEnabled', state.notificationsEnabled.toString());
        });
    }

    safeAddListener('reset-data', 'click', () => {
        if (confirm("Are you sure you want to delete all transactions and reset the app?")) {
            localStorage.clear();
            location.reload();
        }
    });

    safeAddListener('export-data', 'click', () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Amount,Category,Note\n"
            + state.expenses.map(e => `${e.date},${e.amount},${getCategoryName(e.categoryId)},${e.note || ''}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `TapTrack_Data_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function getCategoryName(id) {
    const cat = state.categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
}

// Core Rendering
function renderDashboard() {
    if (!els.totalBalance) return;
    els.totalBalance.textContent = `£${state.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const now = new Date();
    let periodExpenses = [];
    if (state.budgetPeriod === 'weekly') {
        const day = now.getDay() || 7;
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - (day - 1));
        periodExpenses = state.expenses.filter(exp => new Date(exp.date) >= startOfWeek);
        if (els.budgetPeriodLabel) els.budgetPeriodLabel.textContent = "left this week";
        if (els.activePeriodBadge) els.activePeriodBadge.textContent = "Weekly";
    } else {
        periodExpenses = state.expenses.filter(exp => {
            const d = new Date(exp.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        if (els.budgetPeriodLabel) els.budgetPeriodLabel.textContent = "left this month";
        if (els.activePeriodBadge) els.activePeriodBadge.textContent = "Monthly";
    }
    
    const activeBudget = state.budgetPeriod === 'weekly' ? state.weeklyBudget : state.monthlyBudget;
    const totalSpent = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = Math.max(activeBudget - totalSpent, 0);
    if (els.remainingAmount) els.remainingAmount.textContent = `£${remaining.toFixed(2)}`;

    if (els.ringBar) {
        const progress = Math.min(totalSpent / Math.max(activeBudget, 1), 1);
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (progress * circumference);
        els.ringBar.style.strokeDashoffset = offset;
        els.ringBar.style.stroke = progress > 0.85 ? 'var(--negative-color)' : 'var(--accent-color)';
        updateInsight(progress, totalSpent, activeBudget);
    }
    renderTransactions();
}

function updateInsight(progress, totalSpent, activeBudget) {
    if (!els.smartInsight) return;
    if (state.expenses.length === 0) {
        els.smartInsight.textContent = "Add your first expense to get started!";
    } else if (progress >= 1.0) {
        els.smartInsight.textContent = `🚨 You've exceeded your ${state.budgetPeriod} budget!`;
    } else if (progress > 0.85) {
        els.smartInsight.textContent = `⚠️ You're close to your ${state.budgetPeriod} budget limit.`;
    } else if (progress < 0.3) {
        els.smartInsight.textContent = "✅ Great work — you're well within budget.";
    } else {
        els.smartInsight.textContent = `You've spent £${totalSpent.toFixed(2)} of your £${activeBudget.toFixed(2)} ${state.budgetPeriod} budget.`;
    }
}

function renderTransactions() {
    if (!els.transactionList) return;
    if (state.expenses.length === 0) {
        els.transactionList.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No transactions yet</p></div>`;
        return;
    }
    const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedExpenses.slice(0, 20);
    els.transactionList.innerHTML = recent.map(exp => {
        const cat = state.categories.find(c => c.id === exp.categoryId) || state.categories[7];
        const date = new Date(exp.date);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `<div class="transaction-item" onclick="openEditExpense('${exp.id}')"><div class="cat-icon" style="background-color: ${cat.color}">${cat.icon}</div><div class="trans-info"><div class="trans-cat">${cat.name}</div><div class="trans-note">${exp.note || timeStr}</div></div><div class="trans-amount">-£${exp.amount.toFixed(2)}</div></div>`;
    }).join('');
}

// Flow Rendering
function renderFlows() {
    if (els.inflowsList) {
        if (state.inflows.length === 0) {
            els.inflowsList.innerHTML = `<div class="empty-state"><p>No inflows yet. Tap + to add expected income.</p></div>`;
        } else {
            els.inflowsList.innerHTML = state.inflows.map(f => `
                <div class="flow-item positive" onclick="openEditFlow('${f.id}')">
                    <div class="flow-dot"></div>
                    <div class="trans-info">
                        <div class="trans-cat">${f.name}</div>
                        <div class="trans-note">${new Date(f.date).toLocaleDateString()}</div>
                    </div>
                    <div class="trans-amount">+£${f.amount.toFixed(2)}</div>
                </div>
            `).join('');
        }
    }
    if (els.outflowsList) {
        const total = state.outflows.reduce((sum, f) => sum + f.amount, 0);
        if (els.monthlyOutflowTotal) els.monthlyOutflowTotal.textContent = `£${total.toFixed(2)}`;
        if (state.outflows.length === 0) {
            els.outflowsList.innerHTML = `<div class="empty-state"><p>No outflows tracked. Tap + to add a subscription.</p></div>`;
        } else {
            els.outflowsList.innerHTML = state.outflows.map(f => `
                <div class="flow-item negative" onclick="openEditFlow('${f.id}')">
                    <div class="flow-dot"></div>
                    <div class="trans-info">
                        <div class="trans-cat">${f.name}</div>
                        <div class="trans-note">${f.cycle || 'Monthly'}</div>
                    </div>
                    <div class="trans-amount">-£${f.amount.toFixed(2)}</div>
                </div>
            `).join('');
        }
    }
}

function renderCategorySelector() {
    if (!els.categorySelector) return;
    els.categorySelector.innerHTML = state.categories.map(cat => `
        <div class="category-item" data-id="${cat.id}">
            <div class="cat-bubble" style="background-color: ${cat.color}22; color: ${cat.color}">${cat.icon}</div>
            <span class="cat-label">${cat.name}</span>
        </div>
    `).join('');
    document.querySelectorAll('#category-selector .category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#category-selector .category-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            state.selectedCategory = item.dataset.id;
            hapticFeedback(10);
        });
    });
}

function switchView(viewId) {
    if (!els.views) return;
    els.views.forEach(view => {
        view.classList.remove('active');
        if (view.id === viewId) view.classList.add('active');
    });
    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'flows') renderFlows();
    if (viewId === 'settings') updateSettingsUI();
}

function renderCategoriesList() {
    if (!els.categoriesList) return;
    els.categoriesList.innerHTML = state.categories.map(cat => {
        const total = state.expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
        return `
            <div class="category-row">
                <div class="cat-icon" style="background-color: ${cat.color}">${cat.icon}</div>
                <div class="trans-info" onclick="editCategory('${cat.id}')">
                    <div class="trans-cat">${cat.name}</div>
                    <div class="trans-note">${state.expenses.filter(e => e.categoryId === cat.id).length} transactions</div>
                </div>
                <div class="trans-amount" onclick="deleteCategory('${cat.id}')" style="color: var(--negative-color)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </div>
            </div>`;
    }).join('');
}

function updateSettingsUI() {
    if (els.themeSelect) els.themeSelect.value = state.theme;
    if (els.budgetPeriodSelect) els.budgetPeriodSelect.value = state.budgetPeriod;
    if (els.monthlyBudgetValue) els.monthlyBudgetValue.textContent = `£${state.monthlyBudget.toFixed(2)}`;
    if (els.weeklyBudgetValue) els.weeklyBudgetValue.textContent = `£${state.weeklyBudget.toFixed(2)}`;
    if (state.budgetPeriod === 'monthly') {
        if (els.monthlyActiveStatus) { els.monthlyActiveStatus.textContent = 'Active'; els.monthlyActiveStatus.classList.add('active-indicator'); }
        if (els.weeklyActiveStatus) { els.weeklyActiveStatus.textContent = ''; els.weeklyActiveStatus.classList.remove('active-indicator'); }
    } else {
        if (els.weeklyActiveStatus) { els.weeklyActiveStatus.textContent = 'Active'; els.weeklyActiveStatus.classList.add('active-indicator'); }
        if (els.monthlyActiveStatus) { els.monthlyActiveStatus.textContent = ''; els.monthlyActiveStatus.classList.remove('active-indicator'); }
    }
    if (els.notificationsToggle) els.notificationsToggle.checked = state.notificationsEnabled;
}

// Modal Handlers
function openModal(editingId = null) {
    if (!els.quickAddModal) return;
    
    if (editingId) {
        const exp = state.expenses.find(e => e.id === editingId);
        if (!exp) return;
        els.expenseAmount.value = exp.amount;
        els.expenseNote.value = exp.note;
        els.editingExpenseId.value = editingId;
        els.deleteExpenseBtn.style.display = 'block';
        state.selectedCategory = exp.categoryId;
        renderCategorySelector();
        document.querySelector(`#category-selector .category-item[data-id="${exp.categoryId}"]`)?.classList.add('selected');
    } else {
        els.expenseAmount.value = '';
        els.expenseNote.value = '';
        els.editingExpenseId.value = '';
        els.deleteExpenseBtn.style.display = 'none';
        state.selectedCategory = null;
        renderCategorySelector();
    }

    els.quickAddModal.style.display = 'flex';
    setTimeout(() => els.quickAddModal.classList.add('active'), 10);
    if (els.expenseAmount) els.expenseAmount.focus();
    if (!state.selectedCategory) {
        const otherCat = document.querySelector('#category-selector .category-item[data-id="8"]');
        if (otherCat) otherCat.click();
    }
}

function closeModal() {
    if (!els.quickAddModal) return;
    els.quickAddModal.classList.remove('active');
    setTimeout(() => els.quickAddModal.style.display = 'none', 400);
}

window.openEditExpense = (id) => openModal(id);

function saveExpense() {
    const amount = parseFloat(els.expenseAmount.value);
    if (isNaN(amount) || amount <= 0) { hapticFeedback([20, 50, 20]); return; }
    
    const editingId = els.editingExpenseId.value;
    if (editingId) {
        const index = state.expenses.findIndex(e => e.id === editingId);
        if (index !== -1) {
            // Adjust balance: add old amount back, subtract new amount
            state.totalBalance += state.expenses[index].amount;
            state.expenses[index] = { ...state.expenses[index], amount, categoryId: state.selectedCategory || '8', note: els.expenseNote.value };
            state.totalBalance -= amount;
        }
    } else {
        const newExpense = { id: Date.now().toString(), amount, categoryId: state.selectedCategory || '8', note: els.expenseNote.value, date: new Date().toISOString() };
        state.expenses.push(newExpense);
        state.totalBalance -= amount;
    }

    localStorage.setItem('expenses', JSON.stringify(state.expenses));
    localStorage.setItem('totalBalance', state.totalBalance.toString());
    renderDashboard();
    closeModal();
    hapticFeedback(20);
}

function deleteExpense() {
    const editingId = els.editingExpenseId.value;
    if (!editingId) return;
    if (confirm("Delete this expense?")) {
        const index = state.expenses.findIndex(e => e.id === editingId);
        if (index !== -1) {
            state.totalBalance += state.expenses[index].amount;
            state.expenses.splice(index, 1);
            localStorage.setItem('expenses', JSON.stringify(state.expenses));
            localStorage.setItem('totalBalance', state.totalBalance.toString());
            renderDashboard();
            closeModal();
            hapticFeedback([50, 50]);
        }
    }
}

function openFlowModal(editingId = null) {
    const title = document.getElementById('flow-modal-title');
    const cycleField = document.getElementById('cycle-field');
    const nameInput = document.getElementById('flow-name');
    const amountInput = document.getElementById('flow-amount');
    const dateInput = document.getElementById('flow-date');
    const cycleInput = document.getElementById('flow-cycle');
    
    if (editingId) {
        const flows = state.activeFlowTab === 'inflows' ? state.inflows : state.outflows;
        const flow = flows.find(f => f.id === editingId);
        if (!flow) return;
        
        title.textContent = state.activeFlowTab === 'inflows' ? 'Edit Inflow' : 'Edit Outflow';
        nameInput.value = flow.name;
        amountInput.value = flow.amount;
        dateInput.value = flow.date.split('T')[0];
        if (flow.cycle) cycleInput.value = flow.cycle;
        els.editingFlowId.value = editingId;
        els.deleteFlowBtn.style.display = 'block';
    } else {
        title.textContent = state.activeFlowTab === 'inflows' ? 'Add Inflow' : 'Add Outflow';
        nameInput.value = '';
        amountInput.value = '';
        dateInput.value = new Date().toISOString().split('T')[0];
        els.editingFlowId.value = '';
        els.deleteFlowBtn.style.display = 'none';
    }

    cycleField.style.display = state.activeFlowTab === 'inflows' ? 'none' : 'block';
    els.addFlowModal.style.display = 'flex';
    setTimeout(() => els.addFlowModal.classList.add('active'), 10);
}

window.openEditFlow = (id) => openFlowModal(id);

function closeFlowModal() {
    els.addFlowModal.classList.remove('active');
    setTimeout(() => els.addFlowModal.style.display = 'none', 400);
}

function saveFlow() {
    const name = document.getElementById('flow-name').value;
    const amount = parseFloat(document.getElementById('flow-amount').value);
    const date = document.getElementById('flow-date').value;
    const cycle = document.getElementById('flow-cycle').value;
    const editingId = els.editingFlowId.value;

    if (!name || isNaN(amount)) return;

    const flowData = { name, amount, date: date || new Date().toISOString(), cycle: state.activeFlowTab === 'outflows' ? cycle : null };

    if (editingId) {
        const flows = state.activeFlowTab === 'inflows' ? state.inflows : state.outflows;
        const index = flows.findIndex(f => f.id === editingId);
        if (index !== -1) flows[index] = { ...flows[index], ...flowData };
    } else {
        const newFlow = { id: Date.now().toString(), ...flowData };
        if (state.activeFlowTab === 'inflows') state.inflows.push(newFlow);
        else state.outflows.push(newFlow);
    }

    localStorage.setItem(state.activeFlowTab, JSON.stringify(state.activeFlowTab === 'inflows' ? state.inflows : state.outflows));
    renderFlows();
    closeFlowModal();
    hapticFeedback(20);
}

function deleteFlow() {
    const editingId = els.editingFlowId.value;
    if (!editingId) return;
    if (confirm("Delete this flow?")) {
        const flows = state.activeFlowTab === 'inflows' ? state.inflows : state.outflows;
        const index = flows.findIndex(f => f.id === editingId);
        if (index !== -1) {
            flows.splice(index, 1);
            localStorage.setItem(state.activeFlowTab, JSON.stringify(flows));
            renderFlows();
            closeFlowModal();
            hapticFeedback([50, 50]);
        }
    }
}

function openCategoriesModal() {
    els.categoriesModal.style.display = 'flex';
    setTimeout(() => els.categoriesModal.classList.add('active'), 10);
    renderCategoriesList();
}

function closeCategoriesModal() {
    els.categoriesModal.classList.remove('active');
    setTimeout(() => els.categoriesModal.style.display = 'none', 400);
}

window.editCategory = (id) => {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;
    const newName = prompt("Edit Category Name:", cat.name);
    if (newName) {
        cat.name = newName;
        localStorage.setItem('categories', JSON.stringify(state.categories));
        renderCategoriesList();
        renderCategorySelector();
    }
};

window.deleteCategory = (id) => {
    if (state.categories.length <= 1) { alert("You must have at least one category."); return; }
    if (confirm("Delete this category? Transactions in this category will be moved to 'Other'.")) {
        const index = state.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            state.expenses.forEach(e => { if (e.categoryId === id) e.categoryId = '8'; });
            state.categories.splice(index, 1);
            localStorage.setItem('categories', JSON.stringify(state.categories));
            localStorage.setItem('expenses', JSON.stringify(state.expenses));
            renderCategoriesList();
            renderCategorySelector();
            renderDashboard();
        }
    }
};

function hapticFeedback(pattern) { if ('vibrate' in navigator) navigator.vibrate(pattern); }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (confirm("New version available! Refresh now?")) window.location.reload();
                    }
                });
            });
        });
    });
}
