import fs from 'fs';
import path from 'path';

export async function sendEmail({
  to,
  subject,
  html,
  text,
  type = 'general',
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  type?: string;
}) {
  const recipients = Array.isArray(to) ? to.join(', ') : to;
  console.log(`[Email Service] Sending "${subject}" to [${recipients}]`);

  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../../logs/emails');
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    // Ignore if directory exists
  }

  // Create a log file
  const filename = `${Date.now()}_${type}.html`;
  const filePath = path.join(logsDir, filename);

  const logContent = `
<!--
  TO: ${recipients}
  SUBJECT: ${subject}
  DATE: ${new Date().toISOString()}
-->
<hr/>
${html}
  `;

  try {
    fs.writeFileSync(filePath, logContent.trim(), 'utf-8');
    console.log(`[Email Service] Mock email saved to: ${path.relative(process.cwd(), filePath)}`);
  } catch (err) {
    console.error('[Email Service] Failed to save mock email log:', err);
  }
}

export async function sendDrawPublishedAlert(recipients: string[], drawDetails: { month: number; year: number; numbers: number[] }) {
  const subject = `🏆 Draw Results Published for ${drawDetails.month}/${drawDetails.year}!`;
  const text = `The official draw for ${drawDetails.month}/${drawDetails.year} has been executed. The winning numbers are: ${drawDetails.numbers.join(', ')}. Log in to your dashboard to see if you matched!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; background-color: #090d16; color: #ffffff; border-radius: 12px; border: 1px solid #1f2937;">
      <h2 style="color: #10b981;">🏆 Draw Results Published!</h2>
      <p>Hi Golfer,</p>
      <p>The official draw for <strong>${drawDetails.month}/${drawDetails.year}</strong> has been executed and published by the admin panel.</p>
      <div style="background-color: #111827; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #374151; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #9ca3af; text-transform: uppercase; font-weight: bold;">Winning Numbers</p>
        <div style="font-size: 24px; font-weight: 800; letter-spacing: 5px; color: #10b981;">
          ${drawDetails.numbers.join(' - ')}
        </div>
      </div>
      <p>Log in to your Player Dashboard to check if you matched 3, 4, or 5 numbers and entered the prize pools!</p>
      <a href="http://localhost:3000/dashboard" style="display: inline-block; background-color: #10b981; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px;">View My Dashboard</a>
      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Golf Charity Subscription Platform. Helping charities and rewarding players.</p>
    </div>
  `;

  await sendEmail({
    to: recipients,
    subject,
    text,
    html,
    type: 'draw_published',
  });
}

export async function sendWinnerAlert(userEmail: string, userName: string, prizeAmount: number, matchCount: number) {
  const subject = `🎉 Congratulations! You won in the Golf Charity Draw!`;
  const text = `Dear ${userName}, congratulations! You matched ${matchCount} numbers in the monthly draw and won a prize of ₹${prizeAmount.toFixed(2)}. Log in to upload your scorecard proof and claim your winnings!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; background-color: #090d16; color: #ffffff; border-radius: 12px; border: 1px solid #1f2937;">
      <h2 style="color: #fbbf24;">🎉 Congratulations, You Won!</h2>
      <p>Hi ${userName},</p>
      <p>We are thrilled to inform you that you matched <strong>${matchCount} numbers</strong> in the latest monthly golf draw!</p>
      <div style="background-color: #111827; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #374151; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #9ca3af; text-transform: uppercase; font-weight: bold;">Your Prize Payout</p>
        <div style="font-size: 32px; font-weight: 900; color: #fbbf24;">
          ₹${prizeAmount.toFixed(2)}
        </div>
      </div>
      <p>To release your payout, please log in and upload a screenshot proof of your score from your official golf tracker software.</p>
      <a href="http://localhost:3000/dashboard/winnings" style="display: inline-block; background-color: #fbbf24; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px;">Claim My Prize</a>
      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;" />
      <p style="font-size: 12px; color: #6b7280;">Golf Charity Subscription Platform. Subject to verification of scorecard credentials.</p>
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    text,
    html,
    type: 'winner_alert',
  });
}
