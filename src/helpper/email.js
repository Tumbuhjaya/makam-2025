const nodemailer = require('nodemailer')
var connection = require('../database').connection;
var sql_enak = require('../database/mysql_enak.js').connection;
require('dotenv').config(); 

const ejs = require('ejs');
const path = require('path');
const email = function (email, subject, isi) { 
    console.log(email, subject, isi);
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
           user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
        });
    var mainOptions = {
        from: 'HRV Konsultan',
        to:email,
        subject: subject,
        html:`
  <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #333333;"></h2>
      <p style="color: #666666;">${isi}.</p>
      
      <div style="margin-top: 20px;">
        <a href="https://pindah.fosan.id/riset/usulan" style="display: inline-block; background-color: #007BFF; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Kembali</a>
      </div>
      
      <p style="color: #999999; margin-top: 20px;">If you have any questions, feel free to <a href="#" style="color: #007BFF;">contact our support team</a>.</p>
    </div>
  </div>
` 
    };
let a =''
    transporter.sendMail(mainOptions, function (err, info) {
        if (err) {
            console.log(err);
            a = err
        } else {
            console.log('Message sent: ' + info.response + ' else');
            a = 'Message sent: ' + info.response
        }
    });
    console.log(a);
    return a

}
module.exports = {
    email
}
