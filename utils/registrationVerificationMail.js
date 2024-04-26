const nodemailer = require('nodemailer')

const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Account Verification - Solve Litigation',
      html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Email Verification</title>
          <style>
            /* Reset styles */
            body,
            h1,
            p {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
      
            h1 {
              padding-bottom: 20px;
              font-size: 40px;
            }
      
            /* Container styles */
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 30px;
              padding-top: 50px;
              padding-bottom: 50px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
            }
      
            /* Button styles */
            .button {
              font-size: 16px;
              font-weight: bold;
              margin-top: 15px;
              margin-bottom: 15px;
              border-color: transparent;
              padding: 12px 24px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 2px;
            }
      
            .text {
              font-size: 14px;
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
            <p class="text">Dear User,</p>
            <p class="text">
              Thank you for signing up with <strong>Solve Litigation</strong>. Please
              click the button below to verify your email address:
            </p>
            <a href="https://www.solvelitigation.com/verify-email/${token}"
              ><button class="button">Verify Email</button></a
            >
            <p style="margin-bottom: 20px">
              Best regards,<br /><strong>Solve Litigation</strong>
            </p>
          </div>
        </body>
      </html>
      
      `,
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.log(error)
  }
}

const sendResetPasswordEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Reset Password - Solve Litigation',
      html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Email Verification</title>
          <style>
            /* Reset styles */
            body,
            h1,
            p {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
      
            h1 {
              padding-bottom: 20px;
              font-size: 40px;
            }
      
            /* Container styles */
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 30px;
              padding-top: 50px;
              padding-bottom: 50px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
            }
      
            /* Button styles */
            .button {
              font-size: 16px;
              font-weight: bold;
              margin-top: 15px;
              margin-bottom: 15px;
              border-color: transparent;
              padding: 12px 24px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 2px;
            }
      
            .text {
              font-size: 14px;
            }
      
            /* Button hover effect */
            .button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset Password</h1>
            <p class="text">Dear User,</p>
            <p class="text">
              A password reset has been requested for your account. If this was you,
              please use the link below to reset your password.
            </p>
            <a href="https://www.solvelitigation.com/reset-password/${token}"
              ><button class="button">Reset Password</button></a
            >
            <p>Best regards,<br /><strong>Solve Litigation</strong></p>
          </div>
        </body>
      </html>
      
      `,
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.log(error)
  }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail }
