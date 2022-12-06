require('dotenv').config()
const { EmailClient } = require('@azure/communication-email');

const client = new EmailClient(process.env.ACS_CONNECTION_STRING);

exports.send = async (toEmail, toName, subject, content) => {
  const emailMessage = {
    sender: "DoNotReply@8874a356-3ce5-4513-b2a3-cbba35fb1a2b.azurecomm.net",
    content: {
      subject: subject,
      plainText: content,
    },
    recipients: {
      to: [
        {
          email: toEmail,
          displayName: toName,
        },
      ],
    },
  };
  const response = await client.send(emailMessage);
  console.log(response)
}