// utility function to send registration verification mail

const nodemailer = require('nodemailer')

const sendVerificationEmail = async (email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "mail.nehu.ac.in",
            port: 465,
            secure: true,
            auth: {
                // TODO: replace `user` and `pass` values from <https://forwardemail.net>
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        })

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Account Verification',
            // html: `<p>Click <a href="http://localhost:3000/verify-email/${token}">here</a> to verify your account</p>`,
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    /* Reset styles */
                    body, h1, p {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
            
                    /* Container styles */
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        text-align: center;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                    }
            
                    /* Button styles */
                    .button {
                        display: inline-block;
                        font-size: 16px;
                        padding: 12px 24px;
                        margin-top: 20px;
                        background-color: #007bff;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                    }
            
                    /* Button hover effect */
                    .button:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Email Verification</h1>
                    <p>Dear User,</p>
                    <p>Thank you for signing up with our web application. Please click the button below to verify your email address:</p>
                    <a href="http://localhost:3000/verify-email/${token}" class="button">Verify Email</a>
                    <p>If you didn't sign up for our service, you can safely ignore this email.</p>
                    <p>Best regards,<br>Your Web App Team</p>
                </div>
            </body>
            </html>
            `
        }

        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.log(error)
    }
}

const sendResetPasswordEmail = async (email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "mail.nehu.ac.in",
            port: 465,
            secure: true,
            auth: {

                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        })

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Reset Password',
            html: `<p>Click <a href="http://localhost:3000/reset-password/${token}">here</a> to reset your password</p>`,

        }

        await transporter.sendMail(mailOptions)
    }
    catch (error) {
        console.log(error)
    }

}



module.exports = { sendVerificationEmail, sendResetPasswordEmail }