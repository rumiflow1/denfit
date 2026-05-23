import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testMail() {
    console.log("Starting Email Test...");
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "denfitreturns@gmail.com",
            pass: "hkbi mpsh igzk eshw" // Hardcoded for 100% test success
        }
    });

    try {
        const info = await transporter.sendMail({
            from: '"TEST" <denfitreturns@gmail.com>',
            to: "denfit09@gmail.com", // Apni email yahan likhein
            subject: "Final Root Cause Test",
            text: "Bhai, agar ye email aa gayi, toh machine theek hai, sirf logic ka masla hai."
        });
        console.log("✅ SUCCESS! Email sent: " + info.messageId);
    } catch (error) {
        console.error("❌ FAILED! Error logic:", error);
    }
}

testMail();
