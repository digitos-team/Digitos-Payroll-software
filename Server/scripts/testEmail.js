import dotenv from "dotenv";
import { sendEmail } from "../src/utils/Mailer.js";

dotenv.config();

(async () => {
  try {
    const to = process.env.TEST_EMAIL_RECIPIENT || process.argv[2];
    if (!to) {
      console.error(
        "No recipient specified. Set TEST_EMAIL_RECIPIENT in .env or pass as first arg"
      );
      process.exit(1);
    }

    const subject = "Test Email from admin-backend";
    const text = "This is a test email to verify mailer configuration.";

    const info = await sendEmail({ to, subject, text, html: `<p>${text}</p>` });
    console.log("Test email sent successfully:", info.messageId || info);
    process.exit(0);
  } catch (err) {
    console.error("Test email failed:", err?.message || err);
    process.exit(2);
  }
})();
