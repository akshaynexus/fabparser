const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PDFInspector {
    constructor() {
        this.statementsDir = './statements';
    }

    // Get all PDF files
    getPdfFiles() {
        try {
            if (!fs.existsSync(this.statementsDir)) {
                console.error(`Statements directory '${this.statementsDir}' not found.`);
                return [];
            }
            
            const files = fs.readdirSync(this.statementsDir);
            const pdfFiles = files
                .filter(file => file.toLowerCase().endsWith('.pdf'))
                .map(file => path.join(this.statementsDir, file));
            
            console.log(`Found ${pdfFiles.length} PDF files:`, pdfFiles.map(f => path.basename(f)));
            return pdfFiles;
        } catch (error) {
            console.error('Error reading statements directory:', error.message);
            return [];
        }
    }

    // Check if pdftotext is available
    checkPdfToText() {
        try {
            execSync('which pdftotext', { stdio: 'pipe' });
            return true;
        } catch {
            console.log('pdftotext not found. Trying to install poppler-utils...');
            try {
                // Try to install on macOS
                execSync('brew install poppler', { stdio: 'inherit' });
                return true;
            } catch {
                console.log('Could not install poppler-utils. Please install manually:');
                console.log('macOS: brew install poppler');
                console.log('Ubuntu: sudo apt-get install poppler-utils');
                return false;
            }
        }
    }

    // Extract text from PDF using pdftotext
    extractPdfText(pdfPath) {
        try {
            const textPath = pdfPath.replace('.pdf', '_extracted.txt');
            execSync(`pdftotext "${pdfPath}" "${textPath}"`, { stdio: 'pipe' });
            
            if (fs.existsSync(textPath)) {
                const text = fs.readFileSync(textPath, 'utf8');
                fs.unlinkSync(textPath); // Clean up temp file
                return text;
            }
            return null;
        } catch (error) {
            console.error(`Error extracting text from ${path.basename(pdfPath)}:`, error.message);
            return null;
        }
    }

    // Analyze text content for patterns
    analyzeText(text, filename) {
        console.log(`\n=== ANALYZING ${filename} ===`);
        console.log(`Text length: ${text.length} characters`);
        
        // Split into lines for analysis
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log(`Total lines: ${lines.length}`);
        
        // Look for FAB bank patterns
        console.log('\n--- BANK IDENTIFICATION ---');
        const fabPatterns = [
            /first\s+arab\s+bank/i,
            /FAB/,
            /أبوظبي/,
            /bank.*statement/i,
            /account.*statement/i
        ];
        
        for (const pattern of fabPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                console.log(`Found pattern "${pattern}": ${matches[0]}`);
            }
        }
        
        // Look for account information
        console.log('\n--- ACCOUNT INFORMATION ---');
        const accountPatterns = [
            /account.*number.*(\d{4,})/i,
            /account.*holder.*([A-Z\s]+)/i,
            /statement.*period.*([\d\/\-]+).*to.*([\d\/\-]+)/i,
            /opening.*balance.*([\d,]+\.?\d*)/i,
            /closing.*balance.*([\d,]+\.?\d*)/i
        ];
        
        for (const pattern of accountPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                console.log(`Found: ${matches[0]}`);
            }
        }
        
        // Look for transaction patterns
        console.log('\n--- TRANSACTION PATTERNS ---');
        const transactionPatterns = [
            /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // Date patterns
            /\d{1,2}\/\d{1,2}\s+.*?\s+[\d,]+\.?\d*/g, // Date + description + amount
            /(debit|credit|withdrawal|deposit)/gi,
            /AED\s*[\d,]+\.?\d*/gi,
            /balance.*[\d,]+\.?\d*/gi
        ];
        
        for (const pattern of transactionPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                console.log(`Pattern "${pattern}": Found ${matches.length} matches`);
                if (matches.length <= 5) {
                    console.log(`Examples: ${matches.slice(0, 3).join(', ')}`);
                } else {
                    console.log(`First 3 examples: ${matches.slice(0, 3).join(', ')}`);
                }
            }
        }
        
        // Look for table structures
        console.log('\n--- TABLE STRUCTURE ANALYSIS ---');
        const potentialTableLines = lines.filter(line => {
            // Lines that might be transaction rows
            const hasDate = /\d{1,2}\/\d{1,2}/.test(line);
            const hasAmount = /[\d,]+\.?\d*/.test(line);
            const hasMultipleParts = line.split(/\s+/).length >= 3;
            return hasDate && hasAmount && hasMultipleParts;
        });
        
        console.log(`Potential transaction lines: ${potentialTableLines.length}`);
        if (potentialTableLines.length > 0) {
            console.log('Sample transaction lines:');
            potentialTableLines.slice(0, 5).forEach((line, i) => {
                console.log(`  ${i + 1}: ${line}`);
            });
        }
        
        // Check for specific problematic patterns
        console.log('\n--- POTENTIAL ISSUES ---');
        
        // Check for encoding issues
        const hasNonAscii = /[^\x00-\x7F]/.test(text);
        if (hasNonAscii) {
            console.log('⚠️  Contains non-ASCII characters (possible encoding issues)');
        }
        
        // Check for multi-column layout
        const longLines = lines.filter(line => line.length > 100);
        if (longLines.length > 10) {
            console.log('⚠️  Many long lines detected (possible multi-column layout)');
            console.log(`Sample long line: ${longLines[0].substring(0, 150)}...`);
        }
        
        // Check for table headers
        const tableHeaders = lines.filter(line => 
            /date.*description.*amount/i.test(line) ||
            /transaction.*date.*balance/i.test(line) ||
            /reference.*particulars/i.test(line)
        );
        
        if (tableHeaders.length > 0) {
            console.log(`✅ Found table headers: ${tableHeaders.length}`);
            tableHeaders.forEach(header => console.log(`  Header: ${header}`));
        } else {
            console.log('⚠️  No clear table headers found');
        }
        
        return {
            filename,
            textLength: text.length,
            lineCount: lines.length,
            potentialTransactions: potentialTableLines.length,
            hasNonAscii,
            hasLongLines: longLines.length > 10,
            hasTableHeaders: tableHeaders.length > 0
        };
    }

    // Main inspection function
    async inspect() {
        console.log('=== PDF INSPECTOR ===');
        console.log('Inspecting FAB bank statement PDFs without parser...\n');
        
        // Check if pdftotext is available
        if (!this.checkPdfToText()) {
            console.error('Cannot proceed without pdftotext. Please install poppler-utils.');
            return;
        }
        
        const pdfFiles = this.getPdfFiles();
        if (pdfFiles.length === 0) {
            console.log('No PDF files found to inspect.');
            return;
        }
        
        const results = [];
        
        for (const pdfFile of pdfFiles) {
            console.log(`\nExtracting text from ${path.basename(pdfFile)}...`);
            const text = this.extractPdfText(pdfFile);
            
            if (text) {
                const analysis = this.analyzeText(text, path.basename(pdfFile));
                results.push(analysis);
                
                // Save extracted text for manual inspection
                const textFile = pdfFile.replace('.pdf', '_debug.txt');
                fs.writeFileSync(textFile, text);
                console.log(`✅ Raw text saved to ${path.basename(textFile)} for manual inspection`);
            } else {
                console.log(`❌ Failed to extract text from ${path.basename(pdfFile)}`);
            }
        }
        
        // Summary
        console.log('\n=== INSPECTION SUMMARY ===');
        console.log(`Total PDFs inspected: ${results.length}`);
        
        const issues = {
            encoding: results.filter(r => r.hasNonAscii).length,
            layout: results.filter(r => r.hasLongLines).length,
            noHeaders: results.filter(r => !r.hasTableHeaders).length,
            noTransactions: results.filter(r => r.potentialTransactions === 0).length
        };
        
        console.log('\nPotential Issues:');
        console.log(`  Encoding issues: ${issues.encoding} files`);
        console.log(`  Layout issues: ${issues.layout} files`);
        console.log(`  Missing headers: ${issues.noHeaders} files`);
        console.log(`  No transactions found: ${issues.noTransactions} files`);
        
        if (results.length > 0) {
            console.log('\nRecommendations:');
            if (issues.encoding > 0) {
                console.log('  - Check text encoding in _debug.txt files');
            }
            if (issues.layout > 0) {
                console.log('  - PDF may have complex multi-column layout');
            }
            if (issues.noHeaders > 0) {
                console.log('  - Look for transaction table structure manually');
            }
            if (issues.noTransactions > 0) {
                console.log('  - Verify transaction format patterns');
            }
        }
        
        console.log('\nNext steps:');
        console.log('1. Check the _debug.txt files to understand the actual PDF content');
        console.log('2. Identify the exact transaction format used by FAB');
        console.log('3. Update the parser regex patterns accordingly');
    }
}

// Run the inspector
if (require.main === module) {
    const inspector = new PDFInspector();
    inspector.inspect().catch(console.error);
}

module.exports = PDFInspector; 