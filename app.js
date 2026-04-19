// State Management
const state = {
    totalBalance: parseFloat(localStorage.getItem('totalBalance')) || 0.00,
    monthlyBudget: parseFloat(localStorage.getItem('monthlyBudget')) || 450.00,
    expenses: JSON.parse(localStorage.getItem('expenses')) || [],
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
    selectedCategory: null
};

// UI Elements
const els = {
    totalBalance: document.getElementById('total-balance'),
    remainingAmount: document.getElementById('remaining-amount'),
    smartInsight: document.getElementById('smart-insight'),
    transactionList: document.getElementById('transaction-list'),
    quickAddModal: document.getElementById('quick-add-modal'),
    ringBar: document.querySelector('.progress-ring__bar'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseNote: document.getElementById('expense-note'),
    categorySelector: document.getElementById('category-selector')
};

// Initialization
function init() {
    setupEventListeners();
    renderDashboard();
    renderCategorySelector();
    
    // Check for Deep Link (Quick Add)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === 'true' || urlParams.get('quickadd') === 'true') {
        openModal();
    }
}

function setupEventListeners() {
    document.getElementById('quick-add-trigger').addEventListener('click', openModal);
    document.getElementById('add-btn-top').addEventListener('click', openModal);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('save-expense').addEventListener('click', saveExpense);
    
    // Tab switching
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // View switching logic would go here
        });
    });

    // Close modal on overlay click
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

// Core Functions
function renderDashboard() {
    // 1. Update Balance
    els.totalBalance.textContent = `£${state.totalBalance.toFixed(2)}`;

    // 2. Calculate Monthly Spend
    const now = new Date();
    const currentMonthExpenses = state.expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = Math.max(state.monthlyBudget - totalSpent, 0);
    
    els.remainingAmount.textContent = `£${remaining.toFixed(2)}`;

    // 3. Update Progress Ring
    const progress = Math.min(totalSpent / state.monthlyBudget, 1);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (progress * circumference);
    els.ringBar.style.strokeDashoffset = offset;
    
    // Ring Color change if over budget
    els.ringBar.style.stroke = progress > 0.85 ? 'var(--negative-color)' : 'var(--accent-color)';

    // 4. Smart Insight
    updateInsight(progress, totalSpent);

    // 5. Transaction List
    renderTransactions();
}

function updateInsight(progress, totalSpent) {
    if (state.expenses.length === 0) {
        els.smartInsight.textContent = "Add your first expense to get started!";
    } else if (progress >= 1.0) {
        els.smartInsight.textContent = "🚨 You've exceeded your monthly budget!";
    } else if (progress > 0.85) {
        els.smartInsight.textContent = "⚠️ You're close to your monthly budget limit.";
    } else if (progress < 0.3) {
        els.smartInsight.textContent = "✅ Great work — you're well within budget.";
    } else {
        els.smartInsight.textContent = `You've spent £${totalSpent.toFixed(2)} of your £${state.monthlyBudget.toFixed(2)} budget.`;
    }
}

function renderTransactions() {
    if (state.expenses.length === 0) {
        els.transactionList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No transactions yet</p>
            </div>`;
        return;
    }

    const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedExpenses.slice(0, 20);

    els.transactionList.innerHTML = recent.map(exp => {
        const cat = state.categories.find(c => c.id === exp.categoryId) || state.categories[7];
        return `
            <div class="transaction-item">
                <div class="cat-icon" style="background-color: ${cat.color}">${cat.icon}</div>
                <div class="trans-info">
                    <div class="trans-cat">${cat.name}</div>
                    <div class="trans-note">${exp.note || new Date(exp.date).toLocaleDateString()}</div>
                </div>
                <div class="trans-amount">-£${exp.amount.toFixed(2)}</div>
            </div>
        `;
    }).join('');
}

function renderCategorySelector() {
    els.categorySelector.innerHTML = state.categories.map(cat => `
        <div class="category-item" data-id="${cat.id}">
            <div class="cat-bubble" style="background-color: ${cat.color}33; color: ${cat.color}">
                ${cat.icon}
            </div>
            <span class="cat-label">${cat.name}</span>
        </div>
    `).join('');

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            state.selectedCategory = item.dataset.id;
        });
    });
}

// Modal Handlers
function openModal() {
    els.quickAddModal.classList.add('active');
    els.expenseAmount.focus();
    // Pre-select 'Other'
    const otherCat = document.querySelector('.category-item[data-id="8"]');
    if (otherCat) otherCat.click();
}

function closeModal() {
    els.quickAddModal.classList.remove('active');
    els.expenseAmount.value = '';
    els.expenseNote.value = '';
}

function saveExpense() {
    const amount = parseFloat(els.expenseAmount.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    const newExpense = {
        id: Date.now().toString(),
        amount: amount,
        categoryId: state.selectedCategory || '8',
        note: els.expenseNote.value,
        date: new Date().toISOString()
    };

    state.expenses.push(newExpense);
    state.totalBalance -= amount;

    // Save to LocalStorage
    localStorage.setItem('expenses', JSON.stringify(state.expenses));
    localStorage.setItem('totalBalance', state.totalBalance.toString());

    renderDashboard();
    closeModal();

    // Haptic feedback simulation
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

// Start App
init();

// Register Service Worker for Offline Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker failed', err));
    });
}
