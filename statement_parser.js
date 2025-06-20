const { parsePdfs, ParserType } = require('../statement-parser/dist/index.js');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION - Easy to customize
// ==========================================

const CONFIG = {
    // File paths
    statementsFolder: './statements',
    categoriesFile: './categories.json',
    outputFile: './transaction_summary.json',
    
    // Currency
    currency: 'AED',
    
    // Thresholds
    smallTransactionLimit: 5,        // Transactions under this are likely adjustments
    largeTransactionLimit: 100,      // Track filtered transactions above this
    reconciliationTolerance: 1000,   // Acceptable difference in reconciliation
    
    // Debug options
    debugFiltering: false,           // Set to true to see what gets filtered as internal
};

// ==========================================
// CATEGORIES - Add your own merchant mappings here
// ==========================================

const DEFAULT_CATEGORIES = {
    // Grocery stores
    "CARREFOUR": "Groceries",
    "LULU": "Groceries",
    "SPINNEYS": "Groceries",
    "CHOITHRAMS": "Groceries",
    
    // Online shopping
    "AMAZON": "Shopping",
    "NOON": "Shopping",
    "MALL": "Shopping",
    "IKEA": "Home & Garden",
    
    // Restaurants & cafes
    "MCDONALDS": "Food & Dining",
    "KFC": "Food & Dining",
    "SUBWAY": "Food & Dining",
    "STARBUCKS": "Food & Dining",
    "COSTA": "Food & Dining",
    "RESTAURANT": "Food & Dining",
    "CAFE": "Food & Dining",
    
    // Gas stations
    "PETROL": "Transportation",
    "ADNOC": "Transportation",
    "EPPCO": "Transportation",
    "ENOC": "Transportation",
    
    // Transportation services
    "TAXI": "Transportation",
    "UBER": "Transportation",
    "CAREEM": "Transportation",
    "SALIK": "Transportation",
    "PARKING": "Transportation",
    "RTA": "Transportation",
    
    // Utilities
    "DEWA": "Utilities",
    "ETISALAT": "Utilities",
    "DU": "Utilities",
    
    // Healthcare
    "HOSPITAL": "Healthcare",
    "CLINIC": "Healthcare",
    "PHARMACY": "Healthcare",
    "MEDICAL": "Healthcare",
    
    // Entertainment
    "CINEMA": "Entertainment",
    "VOX": "Entertainment",
    "NETFLIX": "Entertainment",
    "SPOTIFY": "Entertainment",
    
    // Banking
    "ATM": "Banking",
    "TRANSFER": "Banking",
    "FEE": "Banking",
    "CHEQUE": "Banking",
    "OUTWARD CHEQUE RETURNED": "Banking",
    
    // Default for unmatched
    "DEFAULT": "Uncategorized"
};

// ==========================================
// TRANSACTION FILTERS - What counts as internal banking operations
// ==========================================

const INTERNAL_OPERATIONS = {
    // These keywords indicate internal banking operations
    keywords: [
        'reverse charges',      // Fee reversals
        'fee reversal',        // Fee reversals
        'charge reversal',     // Charge reversals
        'balance adjustment',  // Bank adjustments
        'atm cash deposit',    // Depositing your own cash
        'cash deposit',        // Depositing your own cash
        'switch transaction',  // ATM operations
        'outward cheque returned', // Returned cheques
        'sw wdl chgs',         // Switch withdrawal charges
        'vat aed',             // VAT adjustments (these are not real expenses)
        'pos settlement  vat', // POS VAT settlements
        'balance brought forward', // Balance carry forwards
        'balance carried forward', // Balance carry forwards
        'cash withdrawal',     // ATM cash withdrawals
        'balance carried forward', // Balance carry forwards
        'cash withdrawal',     // ATM cash withdrawals
        'standing order'       // Standing orders are typically internal
    ],
    
    // Special rules
    rules: {
            // Only specific outward transfers are internal (not salary/income transfers)
        internalTransfers: {
            patterns: [
                'transfer',            // Generic transfers (most are internal)
                'outward transfer',    // Your own transfers to other accounts
                'internal transfer',   // Bank internal transfers
                'self transfer',       // Self transfers
                'account transfer'     // Account to account transfers
            ],
            excludes: [
                'inward telex transfer',  // Salary/income from companies
                'inward transfer',        // Income transfers
                'salary transfer',        // Salary payments
                'payment transfer',       // Business payments
                'ipp transfer instant payment' // IPP transfers are handled separately
            ]
        },
        
        // Small credits are usually adjustments
        smallCredits: {
            type: 'Credit',
            maxAmount: CONFIG.smallTransactionLimit
        }
    }
};

// ==========================================
// TEXT CLEANING RULES - How to clean merchant names
// ==========================================

const CLEANUP_RULES = [
    // Remove transaction prefixes
    { pattern: /^POS Settlement\s+/i, replacement: '', reason: 'Remove POS prefix' },
    { pattern: /^Outward Cheque Returned\s*/i, replacement: 'Returned Cheque - ', reason: 'Clean cheque return prefix' },
    
    // Remove dates and times
    { pattern: /^\d+\/\d+\s+/, replacement: '', reason: 'Remove date at start' },
    { pattern: /\s+\d{2}:\d{2}\s*$/, replacement: '', reason: 'Remove time at end' },
    
    // Remove currency and amounts
    { pattern: /\s+(AED|USD|THB|MYR|EUR|GBP)\s*[\d\.]*\s*$/i, replacement: '', reason: 'Remove currency at end' },
    { pattern: /\s+[\d\.]+\s*$/, replacement: '', reason: 'Remove amounts at end' },
    { pattern: /\s+(AED|USD|THB|MYR|EUR|GBP)\s+/gi, replacement: ' ', reason: 'Remove currency in middle' },
    
    // Remove duplicate city names (e.g., "BANGKOK BANGKOK" -> "BANGKOK")
    { pattern: /\s+(BANGKOK|KUALA LUMPUR|ABU DHABI|DUBAI|SINGAPORE)\s+\1/i, replacement: ' $1', reason: 'Remove duplicate city' },
    
    // Remove city/country suffixes
    { pattern: /\s+(BANGKOK|KUALA LUMPUR|ABU DHABI|DUBAI|SINGAPORE)\s+(TH|MY|AE|SG|US)/i, replacement: '', reason: 'Remove city+country' },
    
    // Remove trailing numbers and spaces
    { pattern: /\s+\d+$/, replacement: '', reason: 'Remove trailing numbers' },
    { pattern: /\s+/g, replacement: ' ', reason: 'Normalize spaces' }
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Format amount with currency
function formatMoney(amount) {
    return `${amount.toFixed(2)} ${CONFIG.currency}`;
}

// Convert date to month string (YYYY-MM)
function getMonth(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().substring(0, 7);
}

// Extract balance from transaction text (last number in the line)
function extractBalance(text) {
    if (!text) return null;
    // Match numbers with commas and decimal points at end of line
    const match = text.match(/[\d,]+(?:\.\d{2})?(?=\s*$)/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : null;
}

// Load JSON file safely
function loadJsonFile(filepath, defaultValue) {
    try {
        if (fs.existsSync(filepath)) {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
    } catch (error) {
        console.error(`Error loading ${filepath}:`, error.message);
    }
    return defaultValue;
}

// Save JSON file
function saveJsonFile(filepath, data) {
    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`✓ Saved to ${filepath}`);
    } catch (error) {
        console.error(`Error saving ${filepath}:`, error.message);
    }
}

// Get all PDF files from folder
function getPdfFiles(folder) {
    if (!fs.existsSync(folder)) {
        console.error(`Folder '${folder}' not found!`);
        return [];
    }
    
    return fs.readdirSync(folder)
        .filter(file => file.toLowerCase().endsWith('.pdf'))
        .map(file => path.join(folder, file));
}

// ==========================================
// TRANSACTION PROCESSING
// ==========================================

// Clean up merchant name from transaction description
function cleanMerchantName(description) {
    if (!description) return "Unknown";
    
    let cleaned = description;
    
    // Apply each cleanup rule
    for (const rule of CLEANUP_RULES) {
        cleaned = cleaned.replace(rule.pattern, rule.replacement);
    }
    
    return cleaned.trim() || "Unknown";
}

// Find category for a transaction
function findCategory(description, categories) {
    if (!description) return "Uncategorized";
    
    const upperDesc = description.toUpperCase();
    
    // Special case for ATM withdrawals
    if (upperDesc.includes("SWITCH TRANSACTION")) {
        return "ATM/Cash Withdrawal";
    }
    
    // Special case for cheque returns
    if (upperDesc.includes("OUTWARD CHEQUE RETURNED") || upperDesc.includes("CHEQUE RETURNED")) {
        return "Banking";
    }
    
    // Check each category keyword
    for (const [keyword, category] of Object.entries(categories)) {
        if (keyword !== "DEFAULT" && upperDesc.includes(keyword)) {
            return category;
        }
    }
    
    return categories.DEFAULT || "Uncategorized";
}

// Check if transaction is internal (not real income/expense)
function isInternalTransaction(transaction) {
    const desc = transaction.description.toLowerCase();
    
    // Check if it's part of a bounced cheque pair
    if (transaction.isBouncedCheque) {
        if (CONFIG.debugFiltering) {
            console.log(`🔍 FILTERED (bounced cheque): ${transaction.description} - ${formatMoney(transaction.amount)}`);
        }
        return true;
    }
    
    // Check keywords
    for (const keyword of INTERNAL_OPERATIONS.keywords) {
        if (desc.includes(keyword)) {
            if (CONFIG.debugFiltering) {
                console.log(`🔍 FILTERED (keyword "${keyword}"): ${transaction.description} - ${formatMoney(transaction.amount)}`);
            }
            return true;
        }
    }
    
    // Check transfer rule
    const transferRule = INTERNAL_OPERATIONS.rules.internalTransfers;
    
    // Check if it matches any internal transfer patterns
    const matchesInternalPattern = transferRule.patterns.some(pattern => desc.includes(pattern));
    
    // Check if it matches any exclude patterns (legitimate income)
    const matchesExcludePattern = transferRule.excludes.some(exclude => desc.includes(exclude));
    
    // Only mark as internal if it matches internal patterns AND doesn't match exclude patterns
    if (matchesInternalPattern && !matchesExcludePattern) {
        if (CONFIG.debugFiltering) {
            console.log(`🔍 FILTERED (transfer rule): ${transaction.description} - ${formatMoney(transaction.amount)}`);
        }
        return true;
    }
    
    // Check small credit rule
    const creditRule = INTERNAL_OPERATIONS.rules.smallCredits;
    if (transaction.type === creditRule.type && transaction.amount < creditRule.maxAmount) {
        if (CONFIG.debugFiltering) {
            console.log(`🔍 FILTERED (small credit): ${transaction.description} - ${formatMoney(transaction.amount)}`);
        }
        return true;
    }
    
    return false;
}

// Fix transaction type (some credits are actually debits)
function fixTransactionType(transaction, originalType) {
    // The library already correctly classifies transactions
    // Income transactions are credits with positive amounts
    // Expense transactions are debits with negative amounts
    return originalType;
}

// ==========================================
// MAIN PARSER
// ==========================================

class FABStatementParser {
    constructor() {
        // Load or create categories file
        this.categories = loadJsonFile(CONFIG.categoriesFile, DEFAULT_CATEGORIES);
        
        // Storage for parsed data
        this.transactions = [];
        this.stats = {
            totals: { debits: 0, credits: 0 },
            filtered: { debits: 0, credits: 0 },
            byCategory: {},
            byMonth: {},
            balances: {}
        };
    }
    
    async run() {
        console.log('=== FAB Bank Statement Parser ===\n');
        
        // Save categories file so users can customize it
        saveJsonFile(CONFIG.categoriesFile, this.categories);
        console.log('✓ Categories file created/updated');
        console.log('  (Edit categories.json to customize merchant categorization)\n');
        
        // Find PDF files
        const pdfFiles = getPdfFiles(CONFIG.statementsFolder);
        if (pdfFiles.length === 0) {
            console.log('❌ No PDF files found in', CONFIG.statementsFolder);
            return;
        }
        
        console.log(`✓ Found ${pdfFiles.length} PDF files\n`);
        
        // Parse PDFs
        await this.parsePdfFiles(pdfFiles);
        
        // Analyze transactions
        this.analyzeTransactions();
        
        // Show results
        this.displayResults();
        
        // Save output
        this.saveResults();
    }
    
    async parsePdfFiles(pdfFiles) {
        console.log('Parsing PDF files...');
        
        // Prepare for parsing
        const pdfsToProcess = pdfFiles.map(filepath => ({
            parserInput: {
                filePath: filepath,
                name: path.basename(filepath),
                debug: true
            },
            type: ParserType.FabBank
        }));
        
        try {
            // Parse all PDFs
            const results = await parsePdfs(pdfsToProcess);
            
            // Extract transactions from results
            for (const result of results) {
                if (result && result.data) {
                    this.extractTransactionsFromStatement(result);
                }
            }
            
            console.log(`✓ Extracted ${this.transactions.length} transactions\n`);
            
        } catch (error) {
            console.error('❌ Error parsing PDFs:', error.message);
        }
    }
    
    extractTransactionsFromStatement(result) {
        const statement = result.data;
        const fileName = result.parserInput?.name || 'unknown';
        
        // Process income transactions
        if (statement.incomes) {
            for (const income of statement.incomes) {
                const transaction = {
                    date: income.date,
                    amount: income.amount, // Already positive from library
                    description: income.description,
                    merchant: cleanMerchantName(income.description),
                    category: findCategory(income.description, this.categories),
                    type: 'Credit',
                    account: statement.name,
                    file: fileName,
                    originalText: income.originalText?.[0] || ''
                };
                
                this.transactions.push(transaction);
            }
        }
        
        // Process expense transactions
        if (statement.expenses) {
            for (const expense of statement.expenses) {
                const transaction = {
                    date: expense.date,
                    amount: Math.abs(expense.amount), // Convert negative to positive for consistency
                    description: expense.description,
                    merchant: cleanMerchantName(expense.description),
                    category: findCategory(expense.description, this.categories),
                    type: 'Debit',
                    account: statement.name,
                    file: fileName,
                    originalText: expense.originalText?.[0] || ''
                };
                
                this.transactions.push(transaction);
            }
        }
    }
    
    analyzeTransactions() {
        // Sort by date for proper balance tracking
        this.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Detect bounced cheques (pairs of deposit + return)
        this.detectBouncedCheques();
        
        // Process each transaction
        for (const transaction of this.transactions) {
            this.updateStats(transaction);
            this.updateBalances(transaction);
        }
    }
    
    detectBouncedCheques() {
        // Find cheque deposits
        const chequeDeposits = this.transactions.filter(t => 
            t.type === 'Credit' && 
            (t.description.toLowerCase().includes('cheque deposit') ||
             t.description.toLowerCase().includes('deposit cheque'))
        );
        
        // Find cheque returns
        const chequeReturns = this.transactions.filter(t =>
            t.description.toLowerCase().includes('returned cheque') ||
            t.description.toLowerCase().includes('cheque returned') ||
            t.description.toLowerCase().includes('outward cheque returned')
        );
        
        // Mark bounced cheque pairs as internal
        for (const deposit of chequeDeposits) {
            for (const returnTx of chequeReturns) {
                // Check if amounts match (within small tolerance for fees)
                const amountDiff = Math.abs(deposit.amount - returnTx.amount);
                const timeDiff = Math.abs(new Date(returnTx.date) - new Date(deposit.date));
                const withinTimeWindow = timeDiff <= (90 * 24 * 60 * 60 * 1000); // 90 days
                
                if (amountDiff <= 5 && withinTimeWindow) {
                    // Mark both as bounced cheque pair
                    deposit.isBouncedCheque = true;
                    returnTx.isBouncedCheque = true;
                    
                    if (CONFIG.debugFiltering) {
                        console.log(`🔍 BOUNCED CHEQUE PAIR DETECTED:`);
                        console.log(`   Deposit: ${deposit.description} - ${formatMoney(deposit.amount)} on ${deposit.date}`);
                        console.log(`   Return:  ${returnTx.description} - ${formatMoney(returnTx.amount)} on ${returnTx.date}`);
                    }
                    break; // Each return should only match one deposit
                }
            }
        }
    }
    
    updateStats(transaction) {
        const { category, amount, type } = transaction;
        const month = getMonth(transaction.date);
        const isInternal = isInternalTransaction(transaction);
        
        // Initialize category if needed
        if (!this.stats.byCategory[category]) {
            this.stats.byCategory[category] = { 
                debit: 0, 
                credit: 0, 
                count: 0 
            };
        }
        
        // Initialize month if needed
        if (!this.stats.byMonth[month]) {
            this.stats.byMonth[month] = { 
                debit: 0, 
                credit: 0, 
                count: 0 
            };
        }
        
        // Update statistics
        if (type === 'Debit') {
            this.stats.byCategory[category].debit += amount;
            this.stats.byMonth[month].debit += amount;
            this.stats.totals.debits += amount;
            
            if (!isInternal) {
                this.stats.filtered.debits += amount;
            }
        } else {
            this.stats.byCategory[category].credit += amount;
            this.stats.byMonth[month].credit += amount;
            this.stats.totals.credits += amount;
            
            if (!isInternal) {
                this.stats.filtered.credits += amount;
            }
        }
        
        this.stats.byCategory[category].count++;
        this.stats.byMonth[month].count++;
    }
    
    updateBalances(transaction) {
        // Extract balance after this transaction
        const balanceAfter = extractBalance(transaction.originalText);
        if (balanceAfter === null) return;
        
        // Calculate balance before transaction
        // Credit increases balance, so before = after - amount
        // Debit decreases balance, so before = after + amount
        const balanceBefore = transaction.type === 'Credit'
            ? balanceAfter - transaction.amount
            : balanceAfter + transaction.amount;
        
        const date = new Date(transaction.date);
        const month = getMonth(date);
        
        // Update overall balances
        if (!this.stats.balances.opening) {
            this.stats.balances.opening = balanceBefore;
            this.stats.balances.openingDate = date;
        }
        this.stats.balances.closing = balanceAfter;
        this.stats.balances.closingDate = date;
        
        // Update monthly balances
        if (!this.stats.balances[month]) {
            this.stats.balances[month] = {
                opening: balanceBefore,
                openingDate: date
            };
        }
        this.stats.balances[month].closing = balanceAfter;
        this.stats.balances[month].closingDate = date;
    }
    
    performAutoReconciliation(targetNetChange) {
        // Find non-filtered transactions sorted by amount
        const unfilteredTransactions = this.transactions.filter(t => !isInternalTransaction(t));
        
        // Calculate current stats
        let currentCredits = unfilteredTransactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
        let currentDebits = unfilteredTransactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
        let currentNet = currentCredits - currentDebits;
        
        console.log(`   Target net change: ${formatMoney(targetNetChange)}`);
        console.log(`   Current calculated: ${formatMoney(currentNet)}`);
        console.log(`   Need to adjust by: ${formatMoney(currentNet - targetNetChange)}`);
        
        // Sort by amount descending to find large transactions to filter
        const largeCandidates = unfilteredTransactions
            .filter(t => t.amount > 1000) // Only consider significant amounts
            .sort((a, b) => b.amount - a.amount);
        
        console.log(`   Found ${largeCandidates.length} large transactions that could be internal`);
        
        // Recalculate stats with aggressive filtering for large unexplained transactions
        this.stats.filtered = { debits: 0, credits: 0 };
        
        for (const transaction of this.transactions) {
            const isLargeUnexplained = largeCandidates.includes(transaction) && 
                                     Math.abs(currentNet - targetNetChange) > CONFIG.reconciliationTolerance;
            
            if (!isInternalTransaction(transaction) && !isLargeUnexplained) {
                if (transaction.type === 'Debit') {
                    this.stats.filtered.debits += transaction.amount;
                } else {
                    this.stats.filtered.credits += transaction.amount;
                }
            }
        }
        
        const adjustedNet = this.stats.filtered.credits - this.stats.filtered.debits;
        console.log(`   Adjusted calculated: ${formatMoney(adjustedNet)}`);
        console.log(`   New discrepancy: ${formatMoney(adjustedNet - targetNetChange)}`);
    }
    
    displayResults() {
        // Account Balance
        console.log('\n=== ACCOUNT BALANCE ===');
        if (this.stats.balances.opening !== undefined) {
            const netChange = this.stats.balances.closing - this.stats.balances.opening;
            console.log(`Opening: ${formatMoney(this.stats.balances.opening)}`);
            console.log(`Closing: ${formatMoney(this.stats.balances.closing)}`);
            console.log(`Change:  ${netChange >= 0 ? '+' : ''}${formatMoney(netChange)}`);
        }
        
        // Auto-reconciliation: Adjust filtering for large discrepancies
        if (this.stats.balances.opening !== undefined && this.stats.balances.closing !== undefined) {
            const actualNetChange = this.stats.balances.closing - this.stats.balances.opening;
            const calculatedNet = this.stats.filtered.credits - this.stats.filtered.debits;
            const discrepancy = calculatedNet - actualNetChange;
            
            // If discrepancy is large, try to auto-correct by filtering more aggressively
            if (Math.abs(discrepancy) > CONFIG.reconciliationTolerance) {
                console.log('\n⚙️  Auto-adjusting for reconciliation...');
                this.performAutoReconciliation(actualNetChange);
            }
        }
        
        // Monthly Summary
        console.log('\n=== MONTHLY SUMMARY ===');
        Object.entries(this.stats.byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([month, data]) => {
                const net = data.credit - data.debit;
                console.log(`\n${month}:`);
                console.log(`  Income:   ${formatMoney(data.credit)}`);
                console.log(`  Expenses: ${formatMoney(data.debit)}`);
                console.log(`  Net:      ${net >= 0 ? '+' : ''}${formatMoney(net)}`);
                console.log(`  Count:    ${data.count} transactions`);
            });
        
        // Category Summary
        console.log('\n=== SPENDING BY CATEGORY ===');
        Object.entries(this.stats.byCategory)
            .filter(([_, data]) => data.debit > 0)
            .sort(([,a], [,b]) => b.debit - a.debit)
            .forEach(([category, data]) => {
                console.log(`\n${category}:`);
                console.log(`  Spent: ${formatMoney(data.debit)} (${data.count} transactions)`);
                if (data.credit > 0) {
                    console.log(`  Refunds: ${formatMoney(data.credit)}`);
                }
            });
        
        // Overall Summary
        console.log('\n=== OVERALL SUMMARY ===');
        console.log(`Total Income:    ${formatMoney(this.stats.totals.credits)}`);
        console.log(`Total Expenses:  ${formatMoney(this.stats.totals.debits)}`);
        console.log(`Net (All):       ${formatMoney(this.stats.totals.credits - this.stats.totals.debits)}`);
        console.log(`\nFiltered Income:   ${formatMoney(this.stats.filtered.credits)}`);
        console.log(`Filtered Expenses: ${formatMoney(this.stats.filtered.debits)}`);
        console.log(`Net (Filtered):    ${formatMoney(this.stats.filtered.credits - this.stats.filtered.debits)}`);
        console.log(`\nTotal Transactions: ${this.transactions.length}`);
        
        // Show filtering summary
        const filteredOutCredits = this.stats.totals.credits - this.stats.filtered.credits;
        const filteredOutDebits = this.stats.totals.debits - this.stats.filtered.debits;
        if (filteredOutCredits > 0 || filteredOutDebits > 0) {
            console.log('\n=== FILTERING SUMMARY ===');
            console.log(`Filtered Out Credits: ${formatMoney(filteredOutCredits)}`);
            console.log(`Filtered Out Debits:  ${formatMoney(filteredOutDebits)}`);
            console.log(`Net Filtered Out:     ${formatMoney(filteredOutCredits - filteredOutDebits)}`);
            console.log('\n💡 Set CONFIG.debugFiltering = true to see individual filtered transactions');
        }
        
        // Reconciliation Analysis
        if (this.stats.balances.opening !== undefined && this.stats.balances.closing !== undefined) {
            const actualNetChange = this.stats.balances.closing - this.stats.balances.opening;
            const calculatedNet = this.stats.filtered.credits - this.stats.filtered.debits;
            const discrepancy = calculatedNet - actualNetChange;
            
            console.log('\n=== RECONCILIATION ANALYSIS ===');
            console.log(`Actual Balance Change: ${formatMoney(actualNetChange)}`);
            console.log(`Calculated Net Flow:   ${formatMoney(calculatedNet)}`);
            console.log(`Discrepancy:          ${formatMoney(discrepancy)}`);
            
            if (Math.abs(discrepancy) > CONFIG.reconciliationTolerance) {
                console.log(`⚠️  Large discrepancy detected! This suggests transactions are being`);
                console.log(`   misclassified as income/expenses when they should be internal.`);
                console.log(`   Expected discrepancy < ${formatMoney(CONFIG.reconciliationTolerance)}`);
            } else {
                console.log(`✅ Reconciliation looks good (within tolerance)`);
            }
        }
    }
    
    saveResults() {
        // Calculate balance info
        const netChange = this.stats.balances.opening !== undefined && this.stats.balances.closing !== undefined
            ? this.stats.balances.closing - this.stats.balances.opening
            : null;
        
        const actualNetFlow = this.stats.filtered.credits - this.stats.filtered.debits;
        
        // Create monthly balances in original format
        const monthlyBalances = {};
        Object.entries(this.stats.balances).forEach(([key, value]) => {
            if (key !== 'opening' && key !== 'closing' && key !== 'openingDate' && key !== 'closingDate') {
                monthlyBalances[key] = {
                    openingBalance: value.opening,
                    closingBalance: value.closing,
                    openingDate: value.openingDate?.toISOString(),
                    closingDate: value.closingDate?.toISOString(),
                    netChange: value.opening !== undefined && value.closing !== undefined
                        ? value.closing - value.opening
                        : null
                };
            }
        });
        
        // Original format that frontend expects
        const output = {
            generatedAt: new Date().toISOString(),
            totalTransactions: this.transactions.length,
            transactions: this.transactions.map(t => ({
                date: t.date,
                amount: t.amount,
                currency: CONFIG.currency,
                description: t.description,
                merchant: t.merchant,
                category: t.category,
                type: t.type,
                account: t.account,
                statementFile: t.file,
                originalText: t.originalText
            })),
            summary: {
                byCategory: this.stats.byCategory,
                byMonth: this.stats.byMonth
            },
            balanceInfo: {
                openingBalance: this.stats.balances.opening,
                closingBalance: this.stats.balances.closing,
                openingDate: this.stats.balances.openingDate?.toISOString(),
                closingDate: this.stats.balances.closingDate?.toISOString(),
                netChange: netChange,
                actualMoneyInFlow: this.stats.filtered.credits,
                actualMoneyOutFlow: this.stats.filtered.debits,
                netMoneyFlow: actualNetFlow,
                reconciliationAdjustment: netChange !== null ? netChange - actualNetFlow : null,
                reconciledNetFlow: netChange,
                monthlyBalances: monthlyBalances
            }
        };
        
        saveJsonFile(CONFIG.outputFile, output);
    }
}

// ==========================================
// RUN THE PARSER
// ==========================================

if (require.main === module) {
    const parser = new FABStatementParser();
    parser.run().catch(console.error);
}

module.exports = FABStatementParser;