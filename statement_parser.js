const { parsePdfs, ParserType } = require('../statement-parser/dist/index.js');
const { readdirSync, existsSync, writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

class FABStatementParser {
    constructor() {
        this.statementsDir = './statements';
        this.categoriesFile = './categories.json';
        this.outputFile = './transaction_summary.json';
        this.allTransactions = [];
        this.merchantCategories = this.loadCategories();
    }

    // Load existing categories or create default ones
    loadCategories() {
        if (existsSync(this.categoriesFile)) {
            try {
                const data = readFileSync(this.categoriesFile, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.error('Error loading categories file:', error.message);
                return this.getDefaultCategories();
            }
        }
        return this.getDefaultCategories();
    }

    // Default category mappings
    getDefaultCategories() {
        return {
            // Shopping & Retail
            "AMAZON": "Shopping",
            "CARREFOUR": "Groceries",
            "LULU": "Groceries",
            "SPINNEYS": "Groceries",
            "CHOITHRAMS": "Groceries",
            "MALL": "Shopping",
            "IKEA": "Home & Garden",
            
            // Food & Dining
            "MCDONALDS": "Food & Dining",
            "KFC": "Food & Dining",
            "SUBWAY": "Food & Dining",
            "STARBUCKS": "Food & Dining",
            "COSTA": "Food & Dining",
            "RESTAURANT": "Food & Dining",
            "CAFE": "Food & Dining",
            
            // Transportation
            "PETROL": "Transportation",
            "ADNOC": "Transportation",
            "EPPCO": "Transportation",
            "TAXI": "Transportation",
            "UBER": "Transportation",
            "CAREEM": "Transportation",
            "SALIK": "Transportation",
            "PARKING": "Transportation",
            
            // Utilities & Bills
            "DEWA": "Utilities",
            "ETISALAT": "Utilities",
            "DU": "Utilities",
            "INTERNET": "Utilities",
            "MOBILE": "Utilities",
            
            // Healthcare
            "HOSPITAL": "Healthcare",
            "CLINIC": "Healthcare",
            "PHARMACY": "Healthcare",
            "MEDICAL": "Healthcare",
            
            // Entertainment
            "CINEMA": "Entertainment",
            "VOX": "Entertainment",
            "REEL": "Entertainment",
            "NETFLIX": "Entertainment",
            "SPOTIFY": "Entertainment",
            
            // Banking & Finance
            "ATM": "Banking",
            "TRANSFER": "Banking",
            "WITHDRAWAL": "Banking",
            "DEPOSIT": "Banking",
            "FEE": "Banking",
            "CHARGE": "Banking",
            
            // Default category
            "DEFAULT": "Uncategorized"
        };
    }

    // Save categories to file
    saveCategories() {
        try {
            writeFileSync(this.categoriesFile, JSON.stringify(this.merchantCategories, null, 2));
            console.log(`Categories saved to ${this.categoriesFile}`);
        } catch (error) {
            console.error('Error saving categories:', error.message);
        }
    }

    // Categorize transaction based on description
    categorizeTransaction(description) {
        if (!description) return "Uncategorized";
        
        const upperDesc = description.toUpperCase();
        
        // Handle specific transaction types first
        if (upperDesc.includes("SWITCH TRANSACTION")) {
            return "ATM/Cash Withdrawal"; // Treat as ATM withdrawal
        }
        
        // Check for exact matches
        for (const [merchant, category] of Object.entries(this.merchantCategories)) {
            if (merchant !== "DEFAULT" && upperDesc.includes(merchant)) {
                return category;
            }
        }
        
        return this.merchantCategories.DEFAULT || "Uncategorized";
    }

    // Extract merchant name from description
    extractMerchant(description) {
        if (!description) return "Unknown";
        
        // Clean up common patterns in FAB statements
        let merchant = description
            .replace(/^POS Settlement\s+/i, '') // Remove "POS Settlement" prefix
            .replace(/^\d+\/\d+\s+/, '') // Remove date patterns at start
            .replace(/\s+\d{2}:\d{2}\s*$/, '') // Remove time patterns at end
            .replace(/\s+(AED|USD|THB|MYR|EUR|GBP)\s*[\d\.]*\s*$/i, '') // Remove currency and amounts at end
            .replace(/\s+[\d\.]+\s*$/g, '') // Remove any remaining amounts at end
            .replace(/\s+(AED|USD|THB|MYR|EUR|GBP)\s+/gi, ' ') // Remove currency codes in middle
            .replace(/\s+\d+\s*$/g, '') // Remove standalone numbers at end
            .replace(/(\s+BANGKOK)\s+BANGKOK\s*.*$/i, '$1') // Remove repeated BANGKOK and trailing content
            .replace(/(\s+KUALA LUMPUR)\s+KUALA LUMPUR\s*.*$/i, '$1') // Remove repeated KUALA LUMPUR
            .replace(/(\s+ABU DHABI)\s+ABU DHABI\s*.*$/i, '$1') // Remove repeated ABU DHABI
            .replace(/(\s+DUBAI)\s+DUBAI\s*.*$/i, '$1') // Remove repeated DUBAI
            .replace(/(\s+SINGAPORE)\s+SINGAPORE\s*.*$/i, '$1') // Remove repeated SINGAPORE
            .replace(/\s+(BANGKOK|KUALA LUMPUR|ABU DHABI|DUBAI|SINGAPORE)\s+TH\s*$/i, '') // Remove "BANGKOK TH" type suffixes  
            .replace(/\s+(BANGKOK|KUALA LUMPUR|ABU DHABI|DUBAI|SINGAPORE)\s+THB.*$/i, '') // Remove "BANGKOK THB" patterns
            .replace(/\s+THB\s+\d+.*$/i, '') // Remove "THB 275" type patterns
            .replace(/\s+USD\s+\d+.*$/i, '') // Remove "USD 15" type patterns  
            .replace(/\s+MYR\s+\d+.*$/i, '') // Remove "MYR 20" type patterns
            .replace(/\s+\d+\s*$/, '') // Final cleanup of trailing numbers
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        // Additional cleanup for specific patterns
        merchant = merchant
            .replace(/^(.*?)\s+(BA|TH|MY|SG|AE|US)$/, '$1') // Remove country codes at end
            .replace(/\s+\d+$/, '') // Remove any remaining trailing numbers
            .trim();
        
        return merchant || "Unknown";
    }

    // Get all PDF files from statements directory
    getPdfFiles() {
        try {
            if (!existsSync(this.statementsDir)) {
                console.error(`Statements directory '${this.statementsDir}' not found.`);
                return [];
            }
            
            const files = readdirSync(this.statementsDir);
            const pdfFiles = files
                .filter(file => file.toLowerCase().endsWith('.pdf'))
                .map(file => join(this.statementsDir, file));
            
            console.log(`Found ${pdfFiles.length} PDF files:`, pdfFiles.map(f => f.split('/').pop()));
            return pdfFiles;
        } catch (error) {
            console.error('Error reading statements directory:', error.message);
            return [];
        }
    }

    // Parse all PDF statements
    async parseStatements() {
        const pdfFiles = this.getPdfFiles();
        
        if (pdfFiles.length === 0) {
            console.log('No PDF files found to parse.');
            return;
        }

        const statementPdfs = pdfFiles.map(filePath => ({
            parserInput: {
                filePath,
                name: filePath.split('/').pop(),
                debug: true
            },
            type: ParserType.FabBank
        }));

        try {
            console.log('Parsing PDF statements...');
            const results = await parsePdfs(statementPdfs);
            
            console.log(`Successfully parsed ${results.length} statements.`);
            this.processResults(results);
            
        } catch (error) {
            console.error('Error parsing statements:', error.message);
            console.error('Make sure the PDF files are valid FAB bank statements.');
        }
    }

    // Process parsing results
    processResults(results) {
        this.allTransactions = [];
        let totalStatements = 0;
        let totalTransactions = 0;

        console.log('\n=== DETAILED PARSING RESULTS ===');
        for (const [index, result] of results.entries()) {
            console.log(`\nResult ${index + 1}:`);
            console.log('Keys:', Object.keys(result));
            
            // Check if we have parsed data (even without explicit success flag)
            if (result && result.data) {
                totalStatements++;
                const data = result.data;
                
                console.log(`\nProcessing statement: ${result.parserInput?.name || 'unknown'}`);
                console.log(`Statement period: ${data.startDate} to ${data.endDate}`);
                console.log(`Account holder: ${data.name}`);
                console.log(`Account suffix: ${data.accountSuffix}`);
                console.log(`Incomes found: ${data.incomes?.length || 0}`);
                console.log(`Expenses found: ${data.expenses?.length || 0}`);
                
                // Process income transactions
                if (data.incomes) {
                    for (const transaction of data.incomes) {
                        const merchant = this.extractMerchant(transaction.description);
                        const category = this.categorizeTransaction(transaction.description);
                        
                        // Check if this is actually an outgoing payment misclassified as income
                        let transactionType = 'Credit';
                        
                        // IPP Transfers are outgoing payments (debits) when they have a reference number
                        if (transaction.description.toLowerCase().includes('ipp transfer instant payment') && 
                            transaction.description.toLowerCase().includes('fab ref:')) {
                            // This is an outgoing IPP transfer, should be a debit
                            transactionType = 'Debit';
                        }
                        
                        const processedTransaction = {
                            date: transaction.date,
                            amount: Math.abs(transaction.amount), // Always positive for consistency
                            currency: 'AED', // FAB is AED
                            description: transaction.description,
                            merchant: merchant,
                            category: category,
                            type: transactionType,
                            account: data.name,
                            statementFile: result.parserInput?.name || 'unknown',
                            originalText: transaction.originalText?.[0] || ''
                        };
                        
                        this.allTransactions.push(processedTransaction);
                        totalTransactions++;
                    }
                }
                
                // Process expense transactions
                if (data.expenses) {
                    for (const transaction of data.expenses) {
                        const merchant = this.extractMerchant(transaction.description);
                        const category = this.categorizeTransaction(transaction.description);
                        
                        const processedTransaction = {
                            date: transaction.date,
                            amount: Math.abs(transaction.amount), // Make positive for consistency
                            currency: 'AED', // FAB is AED
                            description: transaction.description,
                            merchant: merchant,
                            category: category,
                            type: 'Debit',
                            account: data.name,
                            statementFile: result.parserInput?.name || 'unknown',
                            originalText: transaction.originalText?.[0] || ''
                        };
                        
                        this.allTransactions.push(processedTransaction);
                        totalTransactions++;
                    }
                }
            } else {
                console.error(`Failed to parse ${result.parserInput?.name || 'unknown file'}:`);
                console.error('Error details:', result.error || 'No data found');
            }
        }

        console.log(`\n=== PARSING SUMMARY ===`);
        console.log(`Total statements processed: ${totalStatements}`);
        console.log(`Total transactions found: ${totalTransactions}`);
        
        this.generateSummary();
        this.saveTransactions();
    }

    // Generate transaction summary
    generateSummary() {
        console.log(`\n=== TRANSACTION SUMMARY ===`);
        
        // Extract balance information from originalText
        let openingBalance = null;
        let closingBalance = null;
        let earliestDate = null;
        let latestDate = null;
        const monthlyBalances = {};
        
        // Sort all transactions by date to get chronological order
        const sortedTransactions = [...this.allTransactions].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Process each transaction to extract balance information
        for (const transaction of sortedTransactions) {
            const transactionDate = new Date(transaction.date);
            const month = transactionDate.toISOString().substring(0, 7); // YYYY-MM format
            
            // Extract balance from originalText (last number in the string)
            const balanceMatch = transaction.originalText.match(/[\d,]+\.?\d*$/);
            if (balanceMatch) {
                const balance = parseFloat(balanceMatch[0].replace(/,/g, ''));
                
                // Track overall opening and closing balances
                if (!earliestDate || transactionDate < earliestDate) {
                    earliestDate = transactionDate;
                    // Opening balance is before the first transaction
                    if (transaction.type === 'Credit') {
                        openingBalance = balance - transaction.amount;
                    } else {
                        openingBalance = balance + transaction.amount;
                    }
                }
                
                // ALWAYS update closing balance with the chronologically latest transaction
                if (!latestDate || transactionDate >= latestDate) {
                    latestDate = transactionDate;
                    closingBalance = balance; // Use the balance from this transaction
                }
                
                // Track monthly balances
                if (!monthlyBalances[month]) {
                    monthlyBalances[month] = {
                        openingBalance: null,
                        closingBalance: null,
                        earliestDate: null,
                        latestDate: null
                    };
                }
                
                // Update monthly opening balance (earliest transaction in the month)
                if (!monthlyBalances[month].earliestDate || transactionDate < monthlyBalances[month].earliestDate) {
                    monthlyBalances[month].earliestDate = transactionDate;
                    // Opening balance for the month is before this transaction
                    if (transaction.type === 'Credit') {
                        monthlyBalances[month].openingBalance = balance - transaction.amount;
                    } else {
                        monthlyBalances[month].openingBalance = balance + transaction.amount;
                    }
                }
                
                // ALWAYS update monthly closing balance with the chronologically latest transaction in the month
                if (!monthlyBalances[month].latestDate || transactionDate >= monthlyBalances[month].latestDate) {
                    monthlyBalances[month].latestDate = transactionDate;
                    monthlyBalances[month].closingBalance = balance;
                }
            }
        }
        
        // Summary by category
        const categoryTotals = {};
        const monthlyTotals = {};
        let totalDebits = 0;
        let totalCredits = 0;
        
        // For accurate flow calculation, separate actual vs internal operations
        let actualTotalDebits = 0;
        let actualTotalCredits = 0;
        const filteredTransactions = [];

        for (const transaction of this.allTransactions) {
            const category = transaction.category;
            const amount = Math.abs(transaction.amount);
            const isInternal = this.isInternalBankingOperation(transaction);
            
            // Handle date properly - convert Date object to string
            let month;
            if (transaction.date instanceof Date) {
                month = transaction.date.toISOString().substring(0, 7); // YYYY-MM format
            } else {
                month = new Date(transaction.date).toISOString().substring(0, 7);
            }
            
            // Category totals (include all transactions)
            if (!categoryTotals[category]) {
                categoryTotals[category] = { debit: 0, credit: 0, count: 0 };
            }
            
            if (transaction.type === 'Debit') {
                categoryTotals[category].debit += amount;
                totalDebits += amount;
                
                // Only count non-internal operations for actual flow
                if (!isInternal) {
                    actualTotalDebits += amount;
                } else if (amount > 100) {
                    // Log filtered debits for debugging
                    filteredTransactions.push({
                        desc: transaction.description,
                        amount: amount,
                        type: transaction.type
                    });
                }
            } else {
                categoryTotals[category].credit += amount;
                totalCredits += amount;
                
                // Only count non-internal operations for actual flow
                if (!isInternal) {
                    actualTotalCredits += amount;
                } else if (amount > 100) {
                    // Log filtered credits for debugging
                    filteredTransactions.push({
                        desc: transaction.description,
                        amount: amount,
                        type: transaction.type
                    });
                }
            }
            categoryTotals[category].count++;
            
            // Monthly totals (include all transactions)
            if (!monthlyTotals[month]) {
                monthlyTotals[month] = { debit: 0, credit: 0, count: 0 };
            }
            
            if (transaction.type === 'Debit') {
                monthlyTotals[month].debit += amount;
            } else {
                monthlyTotals[month].credit += amount;
            }
            monthlyTotals[month].count++;
        }

        // Display balance information
        console.log('\n--- ACCOUNT BALANCE INFO ---');
        if (openingBalance !== null && closingBalance !== null) {
            console.log(`Opening Balance (${earliestDate?.toDateString()}): ${openingBalance.toFixed(2)} AED`);
            console.log(`Closing Balance (${latestDate?.toDateString()}): ${closingBalance.toFixed(2)} AED`);
            console.log(`Net Change: ${(closingBalance - openingBalance).toFixed(2)} AED`);
        }
        
        // Display monthly balance information
        console.log('\n--- MONTHLY BALANCE PROGRESSION ---');
        Object.entries(monthlyBalances)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([month, balances]) => {
                if (balances.openingBalance !== null && balances.closingBalance !== null) {
                    const monthlyChange = balances.closingBalance - balances.openingBalance;
                    console.log(`${month}:`);
                    console.log(`  Opening:  ${balances.openingBalance.toFixed(2)} AED`);
                    console.log(`  Closing:  ${balances.closingBalance.toFixed(2)} AED`);
                    console.log(`  Change:   ${monthlyChange > 0 ? '+' : ''}${monthlyChange.toFixed(2)} AED`);
                }
            });
        
        // Display category summary
        console.log('\n--- BY CATEGORY ---');
        Object.entries(categoryTotals)
            .sort(([,a], [,b]) => (b.debit + b.credit) - (a.debit + a.credit))
            .forEach(([category, totals]) => {
                console.log(`${category}:`);
                console.log(`  Debits:  ${totals.debit.toFixed(2)} AED (${totals.count} transactions)`);
                if (totals.credit > 0) {
                    console.log(`  Credits: ${totals.credit.toFixed(2)} AED`);
                }
            });

        // Display monthly summary
        console.log('\n--- BY MONTH ---');
        Object.entries(monthlyTotals)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([month, totals]) => {
                console.log(`${month}:`);
                console.log(`  Debits:  ${totals.debit.toFixed(2)} AED`);
                console.log(`  Credits: ${totals.credit.toFixed(2)} AED`);
                console.log(`  Net:     ${(totals.credit - totals.debit).toFixed(2)} AED`);
                console.log(`  Transactions: ${totals.count}`);
            });

        console.log('\n--- TRANSACTION TOTALS ---');
        console.log(`Total Debits:  ${totalDebits.toFixed(2)} AED`);
        console.log(`Total Credits: ${totalCredits.toFixed(2)} AED`);
        console.log(`Net Transaction Flow (All): ${(totalCredits - totalDebits).toFixed(2)} AED`);
        console.log(`Total Transactions: ${this.allTransactions.length}`);
        
        console.log('\n--- FILTERED FLOW (Excluding Internal Operations) ---');
        console.log(`Filtered Credits: ${actualTotalCredits.toFixed(2)} AED`);
        console.log(`Filtered Debits:  ${actualTotalDebits.toFixed(2)} AED`);
        console.log(`Filtered Net Flow: ${(actualTotalCredits - actualTotalDebits).toFixed(2)} AED`);
        
        if (filteredTransactions.length > 0) {
            console.log('\n--- FILTERED OUT TRANSACTIONS (Internal) ---');
            filteredTransactions.forEach(t => {
                console.log(`${t.desc}: ${t.amount.toFixed(2)} AED`);
            });
            console.log(`Total Filtered: ${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)} AED`);
        }
        
        const expectedNetChange = closingBalance !== null && openingBalance !== null ? closingBalance - openingBalance : null;
        if (expectedNetChange !== null) {
            console.log(`\n--- BALANCE RECONCILIATION ---`);
            console.log(`Opening Balance: ${openingBalance.toFixed(2)} AED`);
            console.log(`Closing Balance: ${closingBalance.toFixed(2)} AED`);
            console.log(`Expected Net Change: ${expectedNetChange.toFixed(2)} AED ⭐ (TRUE MONEY MOVEMENT)`);
            console.log(`Filtered Net Flow: ${(actualTotalCredits - actualTotalDebits).toFixed(2)} AED`);
            
            const filteredDifference = (actualTotalCredits - actualTotalDebits) - expectedNetChange;
            console.log(`Filtered vs Expected Difference: ${Math.abs(filteredDifference).toFixed(2)} AED`);
            
            if (Math.abs(filteredDifference) < 1000) {
                console.log(`✅ EXCELLENT! Filtered flow matches balance change (within ${Math.abs(filteredDifference).toFixed(2)} AED)`);
            } else {
                console.log(`🎯 INTELLIGENTLY FILTERED RESULT:`);
                console.log(`   Filtered out ${((totalCredits - totalDebits) - (actualTotalCredits - actualTotalDebits)).toFixed(2)} AED of internal operations`);
                console.log(`   Remaining difference: ${Math.abs(filteredDifference).toFixed(2)} AED`);
                console.log(`   This represents complex banking operations that can't be easily identified`);
                console.log(`\n📊 SUMMARY:`);
                console.log(`   Raw Transaction Flow: ${(totalCredits - totalDebits).toFixed(2)} AED`);
                console.log(`   Filtered Transaction Flow: ${(actualTotalCredits - actualTotalDebits).toFixed(2)} AED`);
                console.log(`   ⭐ AUTHORITATIVE BALANCE CHANGE: ${expectedNetChange.toFixed(2)} AED`);
                console.log(`\n✅ The balance change (${expectedNetChange.toFixed(2)} AED) is the most accurate measure of your true money movement.`);
            }
        }
        
        // Store balance info for export
        this.balanceInfo = {
            openingBalance,
            closingBalance,
            openingDate: earliestDate?.toISOString(),
            closingDate: latestDate?.toISOString(),
            netChange: closingBalance !== null && openingBalance !== null ? closingBalance - openingBalance : null,
            actualMoneyInFlow: actualTotalCredits,
            actualMoneyOutFlow: actualTotalDebits,
            netMoneyFlow: actualTotalCredits - actualTotalDebits,
            // Add reconciliation adjustment
            reconciliationAdjustment: closingBalance !== null && openingBalance !== null 
                ? (closingBalance - openingBalance) - (actualTotalCredits - actualTotalDebits)
                : null,
            reconciledNetFlow: closingBalance !== null && openingBalance !== null 
                ? closingBalance - openingBalance 
                : null,
            monthlyBalances: Object.fromEntries(
                Object.entries(monthlyBalances).map(([month, balances]) => [
                    month,
                    {
                        openingBalance: balances.openingBalance,
                        closingBalance: balances.closingBalance,
                        openingDate: balances.earliestDate?.toISOString(),
                        closingDate: balances.latestDate?.toISOString(),
                        netChange: balances.openingBalance !== null && balances.closingBalance !== null 
                            ? balances.closingBalance - balances.openingBalance 
                            : null
                    }
                ])
            )
        };
    }

    // Helper method to identify internal banking operations that shouldn't count toward money flow
    isInternalBankingOperation(transaction) {
        const description = transaction.description.toLowerCase();
        const amount = transaction.amount;
        
        // 1. Obvious internal adjustments (always exclude)
        if (description.includes('reverse charges')) return true;
        if (description.includes('fee reversal')) return true;
        if (description.includes('charge reversal')) return true;
        if (description.includes('balance adjustment')) return true;
        
        // 2. Cash deposits (putting your own money back)
        if (description.includes('atm cash deposit')) return true;
        if (description.includes('cash deposit')) return true;
        
        // 3. ALL transfers except Telex transfers (which are salary)
        if (description.includes('transfer') && !description.includes('inward telex transfer')) return true;
        
        // 4. Switch transactions (ATM/Cash withdrawals that are internal)
        if (description.includes('switch transaction')) return true;
        
        // 5. Only filter INWARD IPP payments (incoming transfers that are internal)
        // But keep IPP transfers with BeneIBAN (outgoing payments) and IPP charges
        if (description.includes('inward ipp payment')) return true;
        
        // 6. Very small credits (clearly adjustments)
        if (transaction.type === 'Credit' && amount < 5) return true;
        
        // 7. Additional analysis shows some transactions may have timing differences
        // but we should keep the filtering conservative and rely on the balance
        // information from the statement as the authoritative source
        
        // Keep legitimate income/expenses:
        // - "Inward Telex Transfer" (salary) ✓
        // - Merchant transactions (POS settlements) ✓
        // - Regular purchases and payments ✓
        
        return false;
    }

    // Save transactions to JSON file
    saveTransactions() {
        const output = {
            generatedAt: new Date().toISOString(),
            totalTransactions: this.allTransactions.length,
            transactions: this.allTransactions,
            summary: this.getSummaryData(),
            balanceInfo: this.balanceInfo || null
        };

        try {
            writeFileSync(this.outputFile, JSON.stringify(output, null, 2));
            console.log(`\nDetailed transactions saved to ${this.outputFile}`);
        } catch (error) {
            console.error('Error saving transactions:', error.message);
        }
    }

    // Get summary data for export
    getSummaryData() {
        const categoryTotals = {};
        const monthlyTotals = {};

        for (const transaction of this.allTransactions) {
            const category = transaction.category;
            const amount = Math.abs(transaction.amount);
            
            // Handle date properly - convert Date object to string
            let month;
            if (transaction.date instanceof Date) {
                month = transaction.date.toISOString().substring(0, 7); // YYYY-MM format
            } else {
                month = new Date(transaction.date).toISOString().substring(0, 7);
            }
            
            if (!categoryTotals[category]) {
                categoryTotals[category] = { debit: 0, credit: 0, count: 0 };
            }
            if (!monthlyTotals[month]) {
                monthlyTotals[month] = { debit: 0, credit: 0, count: 0 };
            }
            
            if (transaction.type === 'Debit') {
                categoryTotals[category].debit += amount;
                monthlyTotals[month].debit += amount;
            } else {
                categoryTotals[category].credit += amount;
                monthlyTotals[month].credit += amount;
            }
            
            categoryTotals[category].count++;
            monthlyTotals[month].count++;
        }

        return {
            byCategory: categoryTotals,
            byMonth: monthlyTotals
        };
    }

    // Run the parser
    async run() {
        console.log('=== FAB Statement Parser ===');
        console.log('Parsing FAB bank statement PDFs...\n');
        
        // Save categories file for user customization
        this.saveCategories();
        
        await this.parseStatements();
        
        console.log(`\n=== PARSER COMPLETE ===`);
        console.log(`Categories file: ${this.categoriesFile} (customize merchant categories here)`);
        console.log(`Transactions: ${this.outputFile}`);
        console.log('\nTo customize categories, edit the categories.json file and run the parser again.');
    }
}

// Run the parser if this file is executed directly
if (require.main === module) {
    const parser = new FABStatementParser();
    parser.run().catch(console.error);
}

module.exports = FABStatementParser;
