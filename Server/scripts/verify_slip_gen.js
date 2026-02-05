
import fs from 'fs';
import puppeteer from 'puppeteer';
import salarySlipHtml from '../src/templates/salarySlipHtml.js';
import { convertNumberToWords } from '../src/utils/numberToWords.js';

const run = async () => {
    console.log("Starting PDF verification...");

    const letterheadPath = 'd:/deploy/Digitos-Payroll-software/Server/logo/custom_letterhead.png';
    let letterheadBase64 = null;
    if (fs.existsSync(letterheadPath)) {
        const imageBuffer = fs.readFileSync(letterheadPath);
        letterheadBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }

    const mockData = {
        letterhead: letterheadBase64,
        company: {
            name: "Digitos It Solutions Pvt Ltd",
            address: "Hudco Colony, Chhatrapati Sambhajinagar, Maharashtra",
            email: "info@digitositsolutions.com",
            phone: "+91 98765 43210"
        },
        employee: {
            name: "Rahul Sharma",
            id: "EMP-001",
            designation: "Software Engineer",
            department: "Engineering",
            bankName: "HDFC Bank",
            accountNumber: "50100452369874",
            ifsc: "HDFC0001234",
            branch: "Chh. Sambhaji Nagar"
        },
        month: "Jan 2026",
        earnings: [
            { title: "Basic Salary", amount: 50000 },
            { title: "HRA", amount: 20000 },
            { title: "Special Allowance", amount: 15000 }
        ],
        deductions: [
            { title: "Provident Fund", amount: 1800 },
            { title: "Professional Tax", amount: 200 }
        ],
        totals: {
            totalEarnings: 85000,
            totalDeductions: 2000
        },
        netSalary: 83000,
        amountInWords: convertNumberToWords(83000)
    };

    try {
        const html = salarySlipHtml(mockData);

        console.log("Launching Puppeteer...");
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });

        await browser.close();

        fs.writeFileSync('test_salary_slip.pdf', pdfBuffer);
        console.log("PDF generated successfully: test_salary_slip.pdf");

    } catch (e) {
        console.error("Verification failed:", e);
    }
};

run();
