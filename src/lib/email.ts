import type { LoanApplication } from '../types/database';

interface EmailConfig {
  apiKey: string;
  senderEmail: string;
  enabled: boolean;
}

export async function sendEmailNotification(
  loan: LoanApplication,
  status: LoanApplication['status'],
  feedback: string | null,
  config: EmailConfig,
  isBn: boolean
): Promise<boolean> {
  if (!config.enabled || !config.apiKey || !config.senderEmail || !loan.email) {
    console.warn("⚠️ Email notifications are disabled or missing configuration.");
    return false;
  }

  const categoryName = loan.loan_category === 'personal' ? (isBn ? 'চাকরিজীবী (ব্যক্তিগত)' : 'Salaried (Personal)') :
                       loan.loan_category === 'business' ? (isBn ? 'ব্যবসায়িক' : 'Business') :
                       loan.loan_category === 'expat' ? (isBn ? 'প্রবাসী' : 'Expatriate') :
                       loan.loan_category === 'student' ? (isBn ? 'শিক্ষা' : 'Student') :
                       loan.loan_category === 'emergency' ? (isBn ? 'জরুরি' : 'Emergency') : (isBn ? 'নারী উদ্যোক্তা' : 'Women Entrepreneur');

  // Status mapping
  let statusTitle = '';
  let statusColor = '#3b82f6'; // blue
  let messageBody = '';

  if (isBn) {
    switch (status) {
      case 'under_review':
        statusTitle = 'রিভিউ চলছে (Under Review)';
        statusColor = '#8b5cf6'; // purple
        messageBody = `আপনার <b>${categoryName} লোন</b> আবেদনটি বর্তমানে আমাদের অ্যাডমিন প্যানেলে রিভিউ করা হচ্ছে। অতি শীঘ্রই পরবর্তী সিদ্ধান্ত আপনাকে জানানো হবে।`;
        break;
      case 'approved':
        statusTitle = 'অনুমোদিত (Approved)';
        statusColor = '#10b981'; // green
        messageBody = `🎉 <b>অভিনন্দন!</b> আপনার <b>${categoryName} লোন</b> আবেদনটি সফলভাবে অনুমোদিত হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।`;
        break;
      case 'rejected':
        statusTitle = 'বাতিল (Rejected)';
        statusColor = '#ef4444'; // red
        messageBody = `দুঃখিত, আপনার <b>${categoryName} লোন</b> আবেদনটি বাতিল করা হয়েছে। ${feedback ? `<br/><b>কারণ:</b> <i>${feedback}</i>` : ''}`;
        break;
      case 'action_required':
        statusTitle = 'সংশোধন প্রয়োজন (Action Required)';
        statusColor = '#f97316'; // orange
        messageBody = `⚠️ আপনার <b>${categoryName} লোন</b> আবেদনে কিছু সংশোধনী বা অতিরিক্ত নথিপত্র প্রয়োজন। <br/><b>মন্তব্য:</b> <b>${feedback}</b><br/>অনুগ্রহ করে অ্যাপে লগইন করে তথ্য আপডেট করুন।`;
        break;
      case 'completed':
        statusTitle = 'সম্পূর্ণ (Completed)';
        statusColor = '#6b7280'; // gray
        messageBody = `অভিনন্দন! আপনার <b>${categoryName} লোনটি</b> সফলভাবে পরিশোধ বা সম্পন্ন হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ।`;
        break;
      default:
        statusTitle = status;
        messageBody = `আপনার লোন স্ট্যাটাস পরিবর্তন হয়েছে: <b>${status}</b>`;
    }
  } else {
    switch (status) {
      case 'under_review':
        statusTitle = 'Under Review';
        statusColor = '#8b5cf6';
        messageBody = `Your <b>${categoryName} Loan</b> application is currently under review by our administrative team. We will update you shortly on the next steps.`;
        break;
      case 'approved':
        statusTitle = 'Approved';
        statusColor = '#10b981';
        messageBody = `🎉 <b>Congratulations!</b> Your <b>${categoryName} Loan</b> application has been successfully approved. Our representative will contact you soon.`;
        break;
      case 'rejected':
        statusTitle = 'Rejected';
        statusColor = '#ef4444';
        messageBody = `We regret to inform you that your <b>${categoryName} Loan</b> application has been rejected. ${feedback ? `<br/><b>Reason:</b> <i>${feedback}</i>` : ''}`;
        break;
      case 'action_required':
        statusTitle = 'Action Required';
        statusColor = '#f97316';
        messageBody = `⚠️ Your <b>${categoryName} Loan</b> application requires some adjustments or additional documents.<br/><b>Feedback:</b> <b>${feedback}</b><br/>Please log in to the portal and update your application.`;
        break;
      case 'completed':
        statusTitle = 'Completed';
        statusColor = '#6b7280';
        messageBody = `Congratulations! Your <b>${categoryName} Loan</b> has been successfully repaid and completed. Thank you for choosing us!`;
        break;
      default:
        statusTitle = status.replace('_', ' ');
        messageBody = `Your loan application status has been updated to: <b>${statusTitle}</b>.`;
    }
  }

  const subject = isBn 
    ? `ঋণ আবেদন আপডেট: ${statusTitle} | Provati Loan`
    : `Loan Application Status: ${statusTitle} | Provati Loan`;

  // Premium, fully responsive, glassmorphic styled email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          border: 1px solid #f1f5f9;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          padding: 40px 30px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 14px;
          color: #c7d2fe;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px 30px;
          color: #334155;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          color: #0f172a;
        }
        .message {
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 30px;
        }
        .status-badge {
          display: inline-block;
          padding: 10px 20px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #ffffff;
          margin-bottom: 30px;
          background-color: ${statusColor};
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        .details-table th, .details-table td {
          padding: 14px 16px;
          text-align: left;
          font-size: 14px;
          border-bottom: 1px solid #e2e8f0;
        }
        .details-table th {
          background-color: #f8fafc;
          font-weight: 700;
          color: #475569;
          width: 40%;
        }
        .details-table td {
          font-weight: 600;
          color: #0f172a;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
        }
        .footer a {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Provati</h1>
          <p>${isBn ? 'ঋণ সেবা লিমিটেড' : 'Loan Service Limited'}</p>
        </div>
        <div class="content">
          <div class="greeting">${isBn ? `প্রিয় ${loan.full_name},` : `Dear ${loan.full_name},`}</div>
          <div class="message">
            ${messageBody}
          </div>
          
          <div style="text-align: center;">
            <div class="status-badge">${statusTitle}</div>
          </div>

          <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">
            ${isBn ? 'ঋণের তথ্য ও বিবরণ' : 'Loan Information Details'}
          </h3>
          <table class="details-table">
            <tr>
              <th>${isBn ? 'আবেদনকারী' : 'Applicant'}</th>
              <td>${loan.full_name}</td>
            </tr>
            <tr>
              <th>${isBn ? 'লোন আইডি' : 'Loan ID'}</th>
              <td style="font-family: monospace; font-size: 13px;">#${loan.id.split('-')[0].toUpperCase()}</td>
            </tr>
            <tr>
              <th>${isBn ? 'লোন বিভাগ' : 'Category'}</th>
              <td>${categoryName}</td>
            </tr>
            <tr>
              <th>${isBn ? 'পরিমাণ' : 'Amount'}</th>
              <td style="color: #4f46e5; font-size: 16px; font-weight: 800;">৳${loan.amount.toLocaleString()} BDT</td>
            </tr>
            <tr>
              <th>${isBn ? 'মেয়াদ' : 'Tenure'}</th>
              <td>${loan.tenure_months} ${isBn ? 'মাস' : 'Months'}</td>
            </tr>
            <tr>
              <th>${isBn ? 'মাসিক কিস্তি (EMI)' : 'Monthly EMI'}</th>
              <td>৳${loan.emi_amount.toLocaleString()} BDT</td>
            </tr>
          </table>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Provati Loan Service. All Rights Reserved.</p>
          <p>${isBn ? 'যেকোনো প্রয়োজনে আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।' : 'If you have any questions, please feel free to reach our support.'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.senderEmail,
        to: [loan.email],
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend API failed to send email:", errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending notification email via Resend:", error);
    return false;
  }
}
