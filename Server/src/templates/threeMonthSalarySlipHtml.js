
const threeMonthSalarySlipHtml = (data) => {
    const {
        letterhead,
        letterheadFooter,
        company,
        employee,
        months,
        formattedMonths,
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
      @page {
          size: A4;
          margin: 10mm; /* Small margin to maximize space for tables */
      }

      html, body {
          margin: 0;
          padding: 0;
          width: 100%;
      }
      
      body {
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          box-sizing: border-box;
          font-size: 10px; /* Slightly smaller font for portrait tables */
          min-height: 100vh;
          /* Removed position: relative to allow absolute positioning relative to page */
          /* Removed flexbox */
          ${hasLetterhead ? `
          padding: 150px 50px 100px 50px; /* Increased bottom padding to prevent overlap */
          ` : `
          padding: 40px 40px 100px 40px;
          `}
      }
      /* Background Header - Fixed to Page 1 */
      .letterhead-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 180px; /* Only show the top portion */
          object-fit: cover;
          object-position: top;
          z-index: -1;
          display: block;
      }
      
      .content-wrapper {
        position: relative;
        z-index: 10;
      }

      .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background-color: white; /* White background to prevent overlap */
          padding: 15px;
          ${!hasLetterhead ? `
          border-bottom: 2px solid ${themeColor};
          padding-bottom: 15px;
          ` : ''}
      }
      
      .company-info h1 {
          color: ${themeColor};
          margin: 0 0 5px 0;
          font-size: 22px;
          text-transform: uppercase;
      }
      
      .company-info p {
          margin: 2px 0;
          color: #6b7280;
          font-size: 10px;
      }
      
      .slip-title {
          text-align: right;
          width: 100%;
      }
      
      .slip-title h2 {
          margin: 0;
          font-size: 16px;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 1px;
      }
      
      .slip-title p {
          margin: 5px 0 0 0;
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
      }

      .info-grid {
          /* Change from grid to flex/block for better print safety */
          display: flex;
          /* Removed flex-wrap to force side-by-side */
          gap: 15px;
          margin-bottom: 20px;
      }

      .info-box {
          background-color: rgba(255, 255, 255, 0.9);
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          flex: 1; /* Distribute space evenly */
          width: 48%; /* Ensure they take up roughly half the space each */
      }

      .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 10px;
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

      .comparison-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          background-color: rgba(255, 255, 255, 0.9);
          font-size: 10px;
      }

      .comparison-table th {
          border-bottom: 2px solid ${themeColor};
          color: #111827;
          padding: 8px 6px;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9px;
          letter-spacing: 0.5px;
      }
      
      .comparison-table td {
          padding: 7px 6px;
          border-bottom: 1px solid #e5e7eb;
      }
      
      .comparison-table tr:last-child td {
          border-bottom: none;
      }
      
      .col-amount {
          text-align: right;
          font-family: 'Courier New', Courier, monospace;
          font-weight: 600;
      }

      .col-description {
          width: 35%;
      }

      .col-month {
          width: 15%;
          text-align: right;
      }

      .col-total {
          width: 20%;
          text-align: right;
          font-weight: 700;
      }

      .total-row td {
          font-weight: 700;
          border-top: 2px solid ${themeColor};
          color: #111827;
          background-color: ${lightThemeColor};
      }

      .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          margin: 15px 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
      }

      .net-salary-box {
          border: 1px solid #e5e7eb;
          border-left: 6px solid ${themeColor};
          background-color: white;
          color: #111827;
          padding: 12px;
          border-radius: 4px;
          text-align: center;
          margin-top: 15px;
          display: inline-block;
          float: right;
          min-width: 220px;
      }
      
      .net-salary-label {
          font-size: 10px;
          opacity: 0.9;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-weight: 600;
      }
      
      .net-salary-amount {
          font-size: 20px;
          font-weight: 800;
      }

      .footer {
          margin-top: 30px;
          text-align: center;
          color: #9ca3af;
          font-size: 9px;
          clear: both;
          padding-top: 15px;
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
      /* Container for each month to keep it together */
      .month-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          background-color: #fff;
          page-break-inside: auto; /* Allow splitting if necessary to fill Page 1 */
      }
      
      /* Ensure header stays with comparison table if possible, but allow break */
      .comparison-table {
          page-break-inside: auto;
      }
      
      .month-header {
          border-bottom: 2px solid ${themeColor};
          padding-bottom: 8px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
      }

      /* Footer image positioning - only on last page */
      .footer-image-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          text-align: center;
          page-break-before: auto;
          z-index: 20;
      }

      .footer-image-container img {
          width: 100%;
          max-width: 100%;
          height: auto;
          display: block;
      }
  </style>
</head>
<body>
  ${hasLetterhead ? `<img src="${letterhead}" class="letterhead-image" alt="Letterhead" />` : ''}
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
            <h2>3-Month Salary Statement</h2>
            <p>${formattedMonths[0]} to ${formattedMonths[2]}</p>
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


    <!-- Monthly Details Loop -->
    ${[0, 1, 2].map(index => {
        const monthName = formattedMonths[index];
        const monthEarningsTotal = totals.earnings[index];
        const monthDeductionsTotal = totals.deductions[index];
        const monthNetSalary = netSalary[index];

        return `
        <div class="month-container">
            <div class="month-header">${monthName}</div>
            
            <!-- Vertical Layout for Earnings and Deductions within the Month -->
            <div>
                <!-- Earnings -->
                <div style="margin-bottom: 20px;">
                    <div class="section-title" style="margin-top: 0;">Earnings</div>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th class="col-description">Description</th>
                                <th class="col-amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${earnings.map(earn => `
                                <tr>
                                    <td>${earn.title}</td>
                                    <td class="col-amount">₹${earn.amounts[index].toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td>Total Earnings</td>
                                <td class="col-amount">₹${monthEarningsTotal.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Deductions -->
                <div>
                    <div class="section-title" style="margin-top: 0;">Deductions</div>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th class="col-description">Description</th>
                                <th class="col-amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deductions.map(ded => `
                                <tr>
                                    <td>${ded.title}</td>
                                    <td class="col-amount">₹${ded.amounts[index].toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td>Total Deductions</td>
                                <td class="col-amount">₹${monthDeductionsTotal.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Net Salary for Month -->
            <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                 <div style="background-color: ${lightThemeColor}; padding: 8px 15px; border-radius: 4px; border: 1px solid ${themeColor}; display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: 600; font-size: 11px; text-transform: uppercase;">Net Pay for ${monthName}:</span>
                    <span style="font-weight: 700; font-size: 14px;">₹${monthNetSalary.toLocaleString('en-IN')}</span>
                 </div>
            </div>
        </div>
        `;
    }).join('')}
    
    <!-- Grand Total Section -->
    <div class="month-container" style="background-color: #f9fafb; border-color: #d1d5db;">
        <div class="month-header" style="border-bottom-color: #9ca3af; color: #111827;">Total Summary (3 Months)</div>
        <table class="comparison-table">
             <tbody>
                <tr>
                    <td class="col-description">Total Earnings</td>
                    <td class="col-amount">₹${totals.earnings[3].toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td class="col-description">Total Deductions</td>
                    <td class="col-amount">₹${totals.deductions[3].toLocaleString('en-IN')}</td>
                </tr>
                 <tr class="total-row" style="font-size: 12px;">
                    <td class="col-description">Total Net Payable</td>
                    <td class="col-amount">₹${netSalary[3].toLocaleString('en-IN')}</td>
                </tr>
             </tbody>
        </table>
    </div>

    <!-- Total Amount in Words -->
    <div style="overflow: hidden; margin-top: 20px;">
        <div style="float: left; width: 60%; padding-top: 15px;">
            <p style="margin: 0; color: #6b7280; font-size: 10px; text-transform: uppercase;">Total Amount in words (3 Months)</p>
            <p style="margin: 5px 0 0 0; font-weight: 600; color: #111827; font-size: 11px;">${amountInWords || 'Zero'} Only</p>
        </div>
        <div class="net-salary-box">
            <div class="net-salary-label">Total Net Payable</div>
            <div class="net-salary-amount">₹${netSalary[3].toLocaleString('en-IN')}</div>
        </div>
    </div>

    <!-- Footer only if NO letterhead -->
    ${!hasLetterhead ? `
    <div class="footer">
        <p>This is a system-generated 3-month salary statement and does not require a physical signature.</p>
        <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
    ` : ''}

    <!-- Footer Image (if provided) -->
    ${letterheadFooter ? `
    <div class="footer-image-container">
        <img src="${letterheadFooter}" alt="Footer" />
    </div>
    ` : ''}
  </div>

</body>
</html>
  `;
};

export default threeMonthSalarySlipHtml;
