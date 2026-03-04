require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify/${token}`;

    console.log("Sending email to:", email);
    console.log("Verification URL:", verificationUrl);

    try {
        const info = await transporter.sendMail({
            from: `"Auth Service" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify Your Email",
            html: `
              <h2>Email Verification</h2>
              <a href="${verificationUrl}">Verify Email</a>
            `
        });

        console.log("✅ Email sent:", info.response);
    } catch (error) {
        console.error("❌ Email failed:", error.message);
        throw error;
    }
};