const nodemailer = require('nodemailer')

const sendVerificationEmail = async (email, token, name) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const mailOptions = {
      from: '"Solve Litigation" <' + process.env.EMAIL + '>',
      to: email,
      subject: 'Account Verification - Solve Litigation',
      html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Account Verification</title>
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
              padding-bottom: 25px;
              font-size: 40px;
            }
      
            /* Container styles */
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 12px;
              border: 1px solid #e0e0e0;
            }
      
            .content {
              padding: 15px;
              font-size: medium;
              padding-top: 30px;
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
              font-size: medium;
              padding-right: 30px;
            }
      
            .user {
              font-size: medium;
              padding-right: 30px;
              padding-bottom: 8px;
            }
      
            .footer {
              margin-top: 20px;
              font-size: medium;
              color: rgb(56, 55, 55);
              padding: 30px;
              background: #eeecec;
            }
            a {
              color: rgb(56, 55, 55);
              text-decoration: none;
            }
      
            .footer-text {
              text-align: center;
            }
      
            /* Button hover effect */
            .button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1>Account Verification</h1>
              <p class="user">Dear ${name},</p>
              <p class="text">
                Thank you for signing up with <strong>Solve Litigation</strong>.
                Please click the button below to verify your account
              </p>
              <a href="https://www.solvelitigation.com/verify-email/${token}"
                ><button class="button">Verify Account</button></a
              >
              <p style="margin-bottom: 20px">
                Thanks,<br /><strong>Solve Litigation Team</strong>
              </p>
            </div>
            <div>
              <div class="footer">
                <p class="footer-text">
                  &copy; 2024
                  <a href="https://www.solvelitigation.com/">Solve Litigation</a>
                </p>
              </div>
            </div>
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

const sendResetPasswordEmail = async (email, token, name) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const mailOptions = {
      from: '"Solve Litigation" <' + process.env.EMAIL + '>',
      to: email,
      subject: 'Reset Password - Solve Litigation',
      html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Reset Password</title>
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
              padding-bottom: 25px;
              font-size: 40px;
            }
      
            /* Container styles */
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 12px;
              border: 1px solid #e0e0e0;
            }
      
            .content {
              padding: 15px;
              font-size: medium;
              padding-top: 30px;
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
              font-size: medium;
              padding-right: 30px;
            }
      
            .user {
              font-size: medium;
              padding-right: 30px;
              padding-bottom: 8px;
            }

            .footer {
              margin-top: 20px;
              font-size: medium;
              color: rgb(56, 55, 55);
              padding: 30px;
              background: #eeecec;
            }
      
            .footer-text {
              text-align: center;
            }

            a {
              color: rgb(56, 55, 55);
              text-decoration: none;
            }
      
            /* Button hover effect */
            .button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1>Reset Password</h1>
              <p class="user">Dear ${name},</p>
              <p class="text">
                A password reset has been requested for your account. If this was you,
                please use the link below to reset your password.
              </p>
              <a href="https://www.solvelitigation.com/reset-password/${token}"
                ><button class="button">Reset Password</button></a
              >
              <p>Thanks,<br /><strong>Solve Litigation Team</strong></p>
            </div>
            <div>
              <div class="footer">
                <p class="footer-text">
                  &copy; 2024
                  <a href="https://www.solvelitigation.com/">Solve Litigation</a>
                </p>
              </div>
            </div>
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

const shareCitationLink = async (email, link, name) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const mailOptions = {
      from: '"Solve Litigation" <' + process.env.EMAIL + '>',
      to: email,
      subject: 'Share Judgement',
      html: `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Share Legal Judgment</title>
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
        padding-bottom: 25px;
        font-size: 30px;
        color: #0056b3;
      }

      /* Container styles */
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 12px;
        border: 1px solid #e0e0e0;
      }

      .content {
        padding: 15px;
        font-size: medium;
        padding-top: 30px;
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
        font-size: medium;
        padding-right: 30px;
      }

      .footer {
        margin-top: 20px;
        font-size: medium;
        color: rgb(56, 55, 55);
        padding: 30px;
        background: #eeecec;
      }

      .footer-text {
        text-align: center;
      }

      a {
        color: rgb(56, 55, 55);
        text-decoration: none;
        cursor: pointer;
      }

      /* Button hover effect */
      .button:hover {
        background-color: #0056b3;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <h1>Solve Litigation</h1>
        <p class="text">Hey there,</p>
        <p class="text">
          I stumbled upon this intriguing legal judgment on Solve Litigation, a
          fantastic website that provides comprehensive legal solutions,
          judgments, and study materials. Thought you might find it interesting!
        </p>
        <p class="text">Check it out here:</p>
        <p class="text">
          <a href=${link}><button class="button">View Judgment</button></a>
        </p>
        <p>Best, <br /><strong>${name}</strong></p>
      </div>
      <div>
        <div class="footer">
          <p class="footer-text">
            &copy; 2024
            <a href="https://www.solvelitigation.com/">Solve Litigation</a>
          </p>
        </div>
      </div>
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

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  shareCitationLink,
}
