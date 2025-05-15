const registrationSuccessEmailBody = (name: string, activationCode: number) => `
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
          background-color:rgb(211, 104, 65); /* Dark theme background */
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
        .activation-code {
          font-size: 28px;
          color: #ff7f50; /* Orange accent color */
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
          <h1>Welcome to Movementum Studio!</h1>
        </div>
        <div class="content">
          <h2>Hello, ${name}</h2>
          <p>Thank you for registering with Movementum Studio. To activate your account, please use the following activation code:</p>
          <div class="activation-code">${activationCode || 'XXXXXX'}</div>
          <p>Enter this code on the activation page within the next 5 minutes. If you don't verify your account, it will be deleted from our database and you will need to register again.</p>
          <p>If you didn't register, ignore this email.</p>
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

export default registrationSuccessEmailBody;
