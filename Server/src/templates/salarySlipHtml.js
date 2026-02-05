
const salarySlipHtml = (data) => {
    const {
        letterhead,
        company,
        employee,
        month,
        earnings,
        deductions,
        totals,
        netSalary,
        amountInWords
    } = data;

    // Yellow theme matched to letterhead (Pale shade)
    const themeColor = "#FEF08A"; // Yellow-200
    const themeTextColor = "#1f2937"; // Dark text for contrast on yellow
    const lightThemeColor = "#FEFCE8"; // Yellow-50 (Lighter background for totals)

    // If letterhead exists, we use it as background and hide default header/footer
    const hasLetterhead = !!letterhead;

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      @page {
          size: A4;
          margin: 0;
      }

      html, body {
          margin: 0;
          padding: 0;
          width: 210mm;
          height: 297mm;
          overflow: hidden;
      }
      
      body {
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          box-sizing: border-box;
          font-size: 12px;
          position: relative;
          ${hasLetterhead ? `
          padding: 130px 50px 50px 50px; 
          ` : `
          padding: 40px;
          `}
      }

      /* Background Header Only - Crops the footer icons */
      .letterhead-header-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 180px; /* Only show the top 180px of the image */
          background-image: url('${letterhead}');
          background-size: 100% auto;
          background-position: top;
          background-repeat: no-repeat;
          z-index: -1;
      }
      
      .content-wrapper {
        position: relative;
        z-index: 10;
      }

      .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          margin-bottom: 30px;
          ${!hasLetterhead ? `
          border-bottom: 2px solid ${themeColor};
          padding-bottom: 20px;
          ` : ''}
      }
      
      .company-info h1 {
          color: ${themeColor};
          margin: 0 0 5px 0;
          font-size: 24px;
          text-transform: uppercase;
      }
      
      .company-info p {
          margin: 2px 0;
          color: #6b7280;
      }
      
      .slip-title {
          text-align: right;
          width: 100%;
      }
      
      .slip-title h2 {
          margin: 0;
          font-size: 18px;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 1px;
      }
      
      .slip-title p {
          margin: 5px 0 0 0;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
      }

      .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
      }

      .info-box {
          background-color: rgba(255, 255, 255, 0.9); /* Slight transparency for bg */
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
      }

      .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
      }
      
      .info-row:last-child {
          margin-bottom: 0;
      }

      .label {
          color: #6b7280;
          font-weight: 500;
      }

      .value {
          color: #111827;
          font-weight: 600;
      }

      .salary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          background-color: rgba(255, 255, 255, 0.9);
      }

      .salary-table th {
          border-bottom: 2px solid ${themeColor};
          color: #111827;
          padding: 10px;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
      }
      
      .salary-table td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
      }
      
      .salary-table tr:last-child td {
          border-bottom: none;
      }
      
      .col-amount {
          text-align: right;
          font-family: 'Courier New', Courier, monospace;
          font-weight: 600;
      }

      .total-row td {
          font-weight: 700;
          border-top: 2px solid ${themeColor};
          color: #111827;
      }

      .net-salary-box {
          border: 1px solid #e5e7eb;
          border-left: 6px solid ${themeColor};
          background-color: white;
          color: #111827;
          padding: 15px;
          border-radius: 4px;
          text-align: center;
          margin-top: 20px;
          display: inline-block;
          float: right;
          min-width: 250px;
      }
      
      .net-salary-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-weight: 600;
      }
      
      .net-salary-amount {
          font-size: 24px;
          font-weight: 800;
      }

      .footer {
          margin-top: 60px;
          text-align: center;
          color: #9ca3af;
          font-size: 10px;
          clear: both;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
      }
      
      /* Only show watermark if NO letterhead */
      ${!hasLetterhead ? `
      .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(0,0,0,0.03);
          z-index: -1;
          font-weight: 800;
          white-space: nowrap;
          pointer-events: none;
      }
      ` : ''}

      /* Utility */
      .text-right { text-align: right; }
      .w-50 { width: 50%; vertical-align: top; }
  </style>
</head>
<body>
  ${hasLetterhead ? `<div class="letterhead-header-bg"></div>` : ''}
  ${!hasLetterhead ? `<div class="watermark">${company.name}</div>` : ''}

  <div class="content-wrapper">
    <!-- Header -->
    <div class="header">
        ${!hasLetterhead ? `
        <div class="company-info">
            <h1>${company.name}</h1>
            <p>${company.address || ""}</p>
            <p>${company.email || ""} | ${company.phone || ""}</p>
        </div>
        ` : ''}
        
        <div class="slip-title">
            <h2>Salary Slip</h2>
            <p>${month}</p>
        </div>
    </div>

    <!-- Employee Info -->
    <div class="info-grid">
        <div class="info-box">
            <div class="info-row">
                <span class="label">Employee Name</span>
                <span class="value">${employee.name}</span>
            </div>
            <div class="info-row">
                <span class="label">Employee ID</span>
                <span class="value">${employee.id}</span>
            </div>
            <div class="info-row">
                <span class="label">Designation</span>
                <span class="value">${employee.designation}</span>
            </div>
            <div class="info-row">
                <span class="label">Department</span>
                <span class="value">${employee.department}</span>
            </div>
        </div>
        <div class="info-box">
            <div class="info-row">
                <span class="label">Bank Name</span>
                <span class="value">${employee.bankName || "N/A"}</span>
            </div>
            <div class="info-row">
                <span class="label">Account No.</span>
                <span class="value">${employee.accountNumber || "N/A"}</span>
            </div>
            <div class="info-row">
                <span class="label">IFSC Code</span>
                <span class="value">${employee.ifsc || "N/A"}</span>
            </div>
            <div class="info-row">
                <span class="label">Branch Name</span>
                <span class="value">${employee.branch || "N/A"}</span>
            </div>
        </div>
    </div>

    <!-- Salary Details (Vertical Layout) -->
    <table class="salary-table">
        <thead>
            <tr>
                <th width="80%">Earnings</th>
                <th width="20%" class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${earnings.map(earn => `
                <tr>
                    <td>${earn.title}</td>
                    <td class="col-amount">₹${earn.amount.toLocaleString('en-IN')}</td>
                </tr>
            `).join('')}
            <tr class="total-row">
                <td>Total Earnings</td>
                <td class="col-amount">₹${totals.totalEarnings.toLocaleString('en-IN')}</td>
            </tr>
        </tbody>
    </table>

    <div style="height: 5px;"></div>

    <table class="salary-table">
        <thead>
            <tr>
                <th width="80%">Deductions</th>
                <th width="20%" class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${deductions.map(ded => `
                <tr>
                    <td>${ded.title}</td>
                    <td class="col-amount">₹${ded.amount.toLocaleString('en-IN')}</td>
                </tr>
            `).join('')}
            <tr class="total-row">
                <td>Total Deductions</td>
                <td class="col-amount">₹${totals.totalDeductions.toLocaleString('en-IN')}</td>
            </tr>
        </tbody>
    </table>

    <!-- Net Salary -->
    <div style="overflow: hidden;">
        <div style="float: left; width: 60%; padding-top: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 11px; text-transform: uppercase;">Amount in words</p>
            <p style="margin: 5px 0 0 0; font-weight: 600; color: #111827;">${amountInWords || 'Zero'} Only</p>
        </div>
        <div class="net-salary-box">
            <div class="net-salary-label">Net Payable</div>
            <div class="net-salary-amount">₹${netSalary.toLocaleString('en-IN')}</div>
        </div>
    </div>

    <!-- Footer only if NO letterhead -->
    ${!hasLetterhead ? `
    <div class="footer">
        <p>This is a system-generated payslip and does not require a physical signature.</p>
        <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
    ` : ''}
  </div>

</body>
</html>
  `;
};

export default salarySlipHtml;
