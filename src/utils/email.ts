import nodemailer from 'nodemailer';

const sendEmail = async (options: { to: string; subject: string; html: string }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "denfitreturns@gmail.com",
            pass: "hkbi mpsh igzk eshw",
        },
    });

    return await transporter.sendMail({
        from: '"ETHEREAL COUTURE" <denfitreturns@gmail.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
    });
};

export default sendEmail;