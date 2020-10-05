const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'norrlandsordern@gmail.com',
    pass: process.env.EMAIL_PASSWORD,
  },
})

exports.send = (to, subject, content) => {
  const mailOptions = {
    from: 'norrlandsordern@gmail.com',
    to: to,
    subject: subject,
    text: content,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log(err)
    else console.log('Email sent')
  });
}