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
            html: `<p>Click <a href="http://localhost:3000/verify-email/${token}">here</a> to verify your account</p>`,
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