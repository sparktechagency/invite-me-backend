const resetPasswordEmailBody = (name: string, resetCode: number) => `
  <html lang="en">
    <head>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f7f9fc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color:rgb(235, 105, 57); /* Orange background for reset */
          padding: 30px 0;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          color: #ffffff;
          text-align: center;
        }
        .header img {
          width: 120px; /* Adjust logo size */
          margin-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 26px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .content {
          padding: 30px;
          color: #333333;
        }
        .content h2 {
          font-size: 24px;
          color: #333333;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .content p {
          font-size: 16px;
          color: #666666;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        .reset-code {
          font-size: 28px;
          color: #ff7f50;
          font-weight: 700;
          text-align: center;
          margin-bottom: 25px;
          background-color: #f4f4f4;
          padding: 15px;
          border-radius: 8px;
        }
        .footer {
          padding: 20px;
          font-size: 14px;
          color: #999999;
          text-align: center;
          background-color: #f7f9fc;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        .footer p {
          margin: 5px 0;
        }
        .footer a {
          color: #ff7f50;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://res.cloudinary.com/dp6nuvot3/image/upload/v1746078264/kaupy8omgv069w3dn4p4.png" alt="Movementum Studio Logo">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello, ${name}</h2>
          <p>We received a request to reset your password. Please use the code below to proceed with resetting your password:</p>
          <div class="reset-code">${resetCode || 'XXXXXX'}</div>
          <p>Enter this code on the password reset page within the next 5 minutes. If you didn't request a password reset, you can ignore this email.</p>
          <p>If you have any questions, feel free to contact us at <a href="mailto:support@movementumstudio.com">support@movementumstudio.com</a>.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Movementum Studio. All rights reserved.</p>
          <p><a href="https://movementumstudio.com/privacy">Privacy Policy</a> | <a href="https://movementumstudio.com/contact">Contact Us</a></p>
        </div>
      </div>
    </body>
  </html>
`;

export default resetPasswordEmailBody;
