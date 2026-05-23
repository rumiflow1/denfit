// Inside your Backend Email Controller
import { getSignupEmail, getLoginEmail, getOTPEmail, getOrderEmail } from '../utils/AtelierEmails.js';

export const dispatchEmail = async (req, res) => {
  const { email, displayName, actionType, data } = req.body;

  let htmlContent = "";
  let subject = "";

  // This logic ensures we use the EXACT look from AtelierEmails.js
  switch(actionType) {
    case 'SIGNUP':
      htmlContent = getSignupEmail(displayName);
      subject = "The Sanctuary Awaits | Welcome to Ethereal Couture";
      break;
    case 'LOGIN':
      htmlContent = getLoginEmail(displayName);
      subject = "Security Protocol | New Login Detected";
      break;
    case 'FORGOT_PASSWORD':
      htmlContent = getOTPEmail(data.otp);
      subject = "Vault Access Recovery";
      break;
    case 'ORDER_CONFIRMATION':
      htmlContent = getOrderEmail(displayName, data.orderId, data.total);
      subject = "Acquisition Secured";
      break;
    // Add other cases (Abandoned cart, delivered, etc) here...
  }

  await sendEmail({ to: email, subject: subject, html: htmlContent });
  res.status(200).json({ success: true });
};