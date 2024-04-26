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
      html: `<!DOCTYPE html>
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
              color: #0056b3;
              padding-bottom: 20px;
            }
      
            /* Container styles */
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              padding-top: 70px;
              padding-bottom: 70px;
              text-align: center;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
            }
      
            /* Button styles */
            .button {
              display: inline-block;
              font-size: 16px;
              margin-bottom: 10px;
              padding: 12px 24px;
              margin-top: 20px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 2px;
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
            <p>
              Thank you for signing up with <strong>Solve Litigation</strong>. Please
              click the button below to verify your email address:
            </p>
            <a href="https://www.solvelitigation.com/verify-email/${token}" class="button"
              >Verify Email</a
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
            color: #0056b3;
            padding-bottom: 20px;
          }
    
          /* Container styles */
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            padding-top: 70px;
            padding-bottom: 70px;
            text-align: center;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
          }
    
          /* Button styles */
          .button {
            display: inline-block;
            font-size: 16px;
            margin-bottom: 10px;
            padding: 12px 24px;
            margin-top: 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 2px;
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
          <p>Dear User,</p>
          <p>
            Click on the button below to reset your password
          </p>
          <a href="https://www.solvelitigation.com/reset-password/${token}" class="button"
            >Reset Password</a
          >
          <p>Best regards,<br /><strong>Solve Litigation</strong></p>
        </div>
      </body>
    </html>`,
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.log(error)
  }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail }
