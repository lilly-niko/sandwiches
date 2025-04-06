const express = require('express'); // getting express from our node_molues
const path = require('path');
const app = express(); // calling our express function here
const mysql = require('mysql2'); // getting mysql from node_molues
const dotenv = require('dotenv'); // getting dotenv from node_modules
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var session = require('express-session');
const flash = require('express-flash');
const Email = require('email-templates');
const puppeteer = require('puppeteer');
var cronJob = require('cron').CronJob;


dotenv.config({ path: './.env' }); // as we dont want to share our database user and pass so .env ( we can name it as any like xyz.env its just it should have extension of .env)
const PORT = process.env.PORT || 3007; // creating a port where our server should start
const JWT_SECRET = 'your_jwt_secret_key';

hbs.registerHelper('dateNew', function (isoFormatDateString) {
  var dateParts = isoFormatDateString.split("-").reverse().join('.');
  return dateParts;
});
hbs.registerHelper('sum', function (arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += parseFloat(arr[i].price) * parseInt(arr[i].quantity);
  }
  return sum.toFixed(2);
});
hbs.registerHelper('sum_quant', function (arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += parseInt(arr[i].quantity);
  }
  return sum;
});

function pad(num, len) {
  return 3 + Array(len + 1 - num.toString().length).join('0') + num;
}
hbs.registerHelper('zeroFill', function (number) {
  let result = pad(number, 9);
  return result;
});
hbs.registerHelper('dateTimeNew', function (isoFormatDateString) {
  var datearr = isoFormatDateString.split(" ");
  var dateParts = datearr[0].split("-").reverse().join('.');
  var timeParts = datearr[1].substr(0, 5);
  return dateParts + " " + timeParts;
});
hbs.registerHelper('increment', function (number) {
  number++
  return number;
});
hbs.registerHelper('numberFormat', function (number) {
  return parseFloat(number).toFixed(3);
});
hbs.registerHelper('priceFormat', function (number) {
  return parseFloat(number).toFixed(2);
});
hbs.registerHelper('getStatus', function (read) {
  if (read) {
    return `read`;
  }
  else
    return `unread`;
});
hbs.registerHelper('checkFinished', function (status) {
  if (status == 1) {
    return false;
  }
  else
    return true;
});
hbs.registerHelper('checkTaskFinished', function (status) {
  if (status == 4) {
    return false;
  }
  else
    return true;
});
hbs.registerHelper('checkEndButton', function (status) {
  if (status == 6) {
    return false;
  }
  else
    return true;
});
hbs.registerHelper('initials', function (email) {
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  else
    return "A";
});
hbs.registerHelper('get_month', function (month) {
  switch (month) {
    case 1: return 'януари';
    case 2: return 'февруари';
    case 3: return 'март';
    case 4: return 'април';
    case 5: return 'май';
    case 6: return 'юни';
    case 7: return 'юли';
    case 8: return 'август';
    case 9: return 'септември';
    case 10: return 'октомври';
    case 11: return 'ноември';
    case 12: return 'декември';
  }
});
hbs.registerHelper('get_type', function (role) {
  switch (role) {
    case 1: return 'Физическо лице';
    case 2: return 'Юридическо лице';
  }
});
hbs.registerHelper('paymentType', function (type) {
  switch (type) {
    case 1: return 'По сметка';
    case 2: return 'В брой';
  }
});
hbs.registerHelper('check_admin', function (role) {
  if (role === 'admin') {
    return true;
  }
  else
    return false;
});
hbs.registerHelper('check_accounting', function (role) {
  if (role === 'admin_01') {
    return true;
  }
  else
    return false;
});
hbs.registerHelper('priorityConvert', function (priority) {
  switch (priority) {
    case 0:
      return '<i data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="Нисък " class="ri-arrow-down-double-fill ri-2x" style="color:lightblue;"></i>';
    case 1:
      return '<i data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="Нормален " class="ri-subtract-line ri-2x" style="color:gray;"></i>';
    case 2:
      return '<i data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="Висок " class="ri-arrow-up-double-fill ri-2x" style="color:orange;"></i>';
  }
});
hbs.registerHelper('statusMailConvert', function (status) {
  switch (status) {
    case 0:
      return "<span style= 'color:white;' class='badge bg-warning'>Непрегледана</span>";
    case 1:
      return "<span style= 'color:white;' class='badge bg-dark'>Неодобрена</span>";
    case 2:
      return "<span style= 'color:white;' class='badge bg-info'>Насрочена за изпращане</span>";
    case 3:
      return '<span style= "color:white;" class="badge bg-primary">Изпратена</span>';
    case 4:
      return '<span style= "color:white;" class="badge bg-success">Платена</span>';
    case 5:
      return '<span style= "color:white;" class="badge bg-danger">Просрочена </span>';
  }
});
hbs.registerHelper('statusConvert', function (status) {
  switch (status) {
    case 0:
      return "<span style= 'color:white;' class='badge bg-secondary'>Незапочната</span>";
    case 1:
      return "<span style= 'color:gray;' class='badge bg-light'>Изпратена</span>";
    case 2:
      return "<span style= 'color:white;' class='badge bg-info'>Потвърдена лаборатория</span>";
    case 3:
      return "<span style= 'color:white;' class='badge bg-success'>Готова за вземане</span>";
    case 4:
      return '<span style= "color:white;" class="badge bg-warning">Зададена на пилот</span>';
    case 5:
      return '<span style= "color:white;" class="badge bg-info">Приета логистик</span>';
    case 6:
      return '<span style= "color:white;" class="badge bg-info">Приета пилот</span>';
    case 7:
      return '<span style= "color:white;" class="badge bg-primary">Начало на работа</span>';
    case 8:
      return '<span style= "color:white;" class="badge bg-success">Завършена</span>';
  }
});
hbs.registerHelper('json', function (obj) {
  return JSON.stringify(obj);
});
hbs.registerHelper('multiply', function (price, quantity) {
  return (parseFloat(price) * parseInt(quantity)).toFixed(2);
});
hbs.registerHelper('splitAddress', function (address, num) {
  var index = address.indexOf(",");
  switch (num) {
    case 0: return address.slice(0, index);
    case 1: return address.slice(index + 1);
  }
});
//creating connection with our databae
const db = mysql.createPool({
  host: "localhost",
  user: "bioagent_root", // my username
  password: "Tarator@98", // my password
  database: "bioagent_sandwiches",
  dateStrings: "true",
  multipleStatements: "true",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

//connecting our databse and checking everything works fine

/*db.connect((error) => {
  if (error) {
    console.log(error)
  }
  else {
    console.log("MySQL database connected.....")
  }
})
db.on('error', (err) => {
  db.error('Database error:', err.message);

  // Handle connection lost error
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Connection lost. Reconnecting...');
    db.connect();
  } else {
    throw err;
  }
});
*/
let listOfIds = [];
let generatePDFfromURL = async (id) => {

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3007/faktura/' + id, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4' });

  await browser.close();
  return pdf;
}
async function processArray(array) {

  let propertyList = [];
  for await (let row of array) {
    console.log("Here");
    const response = await fetch("http://localhost:3007/createDebt", {
      method: "POST",
      body: JSON.stringify({
        client_id: row.id
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
    const debt = await response.json();
    console.log(debt);
    if (!debt.error) {
      let pdf = await generatePDFfromURL(debt.debt_id);
      row.pdf = pdf;
      row.number = pad(debt.debt_id, 9);
      var dateParts = debt.date_issued.split("-").reverse().join('.');
      row.date = dateParts;
      row.value = debt.sum_to_pay.toFixed(2);
      console.log(row);
      propertyList.push(row);
    }
  }
  console.log("1: " + propertyList);
  return propertyList;

}
const email = new Email({
  message: {
    from: 'no_reply_sot@tetradev.eu'
  },
  send: true,
  transport: {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
    secure: true,
    dkim: {
      domainName: 'tetradev.eu',
      keySelector: 'mail', // The key you used in your DKIM TXT DNS Record
      privateKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArtkv1ZNE3FuJPlDQRHyxptRfLkJ0fi3/usman4izyFXpO2++GuHjub4IpOxySzt+b5w4G2DpWSEJ95Y4TPnQssiYW28Zrdg/wLNNtXMhystcAcsCzKQvwkRYi1lzp70FfWzS1ulLKjA7UKwxaqnMY6Pac0DS7eayYENB/EmlRZJgxbhS3uwHGVre094GrTZjvYo2DcTgQnG/ELJSf3OVDzcYh2n5Wfyl4nnwXNCUKWrjjCekzwKdPx5vzEha+rAXn1wsx1Kr+BgYFKO/ohJUxZ25Sn7IlC50RVN3GbotQhEfJ+pt2VlZ5tJJL3EzFtfg7g39J/h+8+DnNmHUnbykcQIDAQAB'
      // Content of you private key
    },
    auth: {
      user: "slave1",
      pass: "citadel"
    }
  }
});


var cronJ = new cronJob("00 22 6 * *", function () {
  console.log("Tick");
  db.query("Select id,email from clients where TIMESTAMPDIFF(MONTH, last_issued_date, curdate()) = factura_period or last_issued_date is null;", async (err, result) => {
    if (err) {
      console.log(err);
    } else {
      listOfIds = result;
      console.log(listOfIds);
      let email_data = await processArray(listOfIds);
      console.log("2: " + email_data);
      /*email_data.forEach((person) => {
        email
          .send({
            template: 'debt_message',
            message: {
              to: person.email,
              attachments: [
                {   // utf-8 string as an attachment
                  filename: 'factura.pdf',
                  content: Buffer.from(person.pdf)
                }
              ]
            },
            locals: person
          })
          .then((res) => {
            console.log('res.originalMessage', res.originalMessage)
          })
          .catch(console.error);
      })*/
    }
  });

  /* transport.sendMail(mailOptions, (error, info) => {
     if (error) {
         return console.log(error);
     }
     console.log('Message sent: %s', info.messageId);
 });
 */

  console.log("end");
}, undefined, true, "Europe/Sofia");

var cronJSend = new cronJob("00 06 08 * *", function () {
  console.log("Tick");
  db.query("Select debt_id as number,email,sum_to_pay as value ,last_issued_date as date from clients join debt on clients.id= debt.client_id where to_send=1 and fak_status != 3;", async (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      for await (let row of result) {
        let pdf = await generatePDFfromURL(row.number);
        row.number = pad(row.number, 9);
        email
          .send({
            template: 'debt_message',
            message: {
              to: ['express_sot@abv.bg', 'lilia.a.nikolaeva@gmail.com', row.email],
              attachments: [
                {   // utf-8 string as an attachment
                  filename: 'factura_' + row.number + '.pdf',
                  content: Buffer.from(pdf)
                }
              ]
            },
            locals: row
          })
          .then((res) => {
            console.log('res.originalMessage', res.originalMessage);
            db.query('update debt set fak_status = 3 where debt_id= ?;', [row.number], (error, result) => {
              if (error) {
                console.log('error');
              } else {
                console.log("sent");
              }
            })
          })
          .catch(console.error);
      }
    }
  });

  /* transport.sendMail(mailOptions, (error, info) => {
     if (error) {
         return console.log(error);
     }
     console.log('Message sent: %s', info.messageId);
 });
 */

  console.log("end");
}, undefined, true, "Europe/Sofia");
/*

(async () => {
  let pdf = await main();
  console.log(pdf);
  const email = new Email({
    message: {
      from: 'no_reply_sot@tetradev.eu'
    },
    send: true,
    transport: {
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail',
      secure: true,
      dkim: {
        domainName: 'tetradev.eu',
        keySelector: 'mail', // The key you used in your DKIM TXT DNS Record
        privateKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArtkv1ZNE3FuJPlDQRHyxptRfLkJ0fi3/usman4izyFXpO2++GuHjub4IpOxySzt+b5w4G2DpWSEJ95Y4TPnQssiYW28Zrdg/wLNNtXMhystcAcsCzKQvwkRYi1lzp70FfWzS1ulLKjA7UKwxaqnMY6Pac0DS7eayYENB/EmlRZJgxbhS3uwHGVre094GrTZjvYo2DcTgQnG/ELJSf3OVDzcYh2n5Wfyl4nnwXNCUKWrjjCekzwKdPx5vzEha+rAXn1wsx1Kr+BgYFKO/ohJUxZ25Sn7IlC50RVN3GbotQhEfJ+pt2VlZ5tJJL3EzFtfg7g39J/h+8+DnNmHUnbykcQIDAQAB'
        // Content of you private key
      },
      auth: {
        user: "slave1",
        pass: "citadel"
      }
    }
  });


  const people = [
    { number: '001', date: '25.02.2025', value: '25.99' },
    { number: '002', date: '25.02.2025', value: '55.00' }
  ];

  people.forEach((person) => {
    email
      .send({
        template: 'debt_message',
        message: {
          to: 'aasergyy@gmail.com',
          attachments: [
            {   // utf-8 string as an attachment
              filename: 'factura.pdf',
              content: Buffer.from(pdf)
            }
          ]
        },
        locals: person
      })
      .then((res) => {
        console.log('res.originalMessage', res.originalMessage)
      })
      .catch(console.error);
  })
})()
  
/*async function printPDF() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3007/faktura', {waitUntil: 'networkidle0'});
  const pdf = await page.pdf({ path: 'bla.pdf',format: 'A4' });
 
  await browser.close();
  console.log('PDF generated successfully');
}
printPDF() ;
async function generatePDFfromURL(url, outputPath) {
  try {
    const response = await axios.get(url);
    const text = response.data;
      window.jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF();
    doc.html("<html>Bla bla</html>", {
      callback: function (doc) {
        doc.save(outputPath);
        console.log('PDF generated successfully');
      }
  })
  } catch (error) {
    console.error('Error fetching URL:', error);
  }
}

// Usage
generatePDFfromURL('http://localhost:3007/faktura', 'test.pdf');


*/

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

// console.log(__dirname)


//parse URL-encoded bodies ( as sent by HTML forms )
app.use(express.urlencoded({ limit: '100mb', extended: false }));

//pasrse JSON bodies( as sent by API clients )
app.use(express.json({ limit: '100mb' }));

app.use(cookieParser());

//setting our view engine , it will allows how we render our html
// app.set('view engine' , 'ejs');
// app.set('view engine', 'ejs');
app.set('view engine', 'hbs');

hbs.registerPartials(__dirname + '/views/partials');

//define routes

app.use(session({
  secret: JWT_SECRET,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
  resave: false
}));

app.use(flash());
app.use((req, res, next) => {
  app.locals.success = req.flash('success');
  req.app.locals.error = req.flash('error');
  next();
});
function checkLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    var err = new Error("User not logged in!");
    next(err);
  }
}

app.get('/', checkLogin, (req, res, next) => {
  res.render("profile", {
    user_details: req.session.user
  });
});
app.use('/', function (err, req, res, next) {
  res.redirect('/login');
});
app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/register', (req, res) => {
  res.render('register');
});
app.post('/register', async (req, res) => {
  const { name, username, password } = req.body;

  try {
    // CHECK IF USER ALREADY EXISTS
    db.query('SELECT * FROM users WHERE username = ?', [username], async (error, rows) => {
      if (rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // HASH THE PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      // SAVE THE USER IN THE DATABASE 
      db.query('INSERT INTO users (name, username, password) VALUES (?, ?, ?)', [name, username, hashedPassword], async (error, result) => {
        if (error) {
          console.log(error.sqlMessage)
          // set flash message
          req.flash('error', 'Запис с такова ид съществува!');
          // redirect to user page
          return res.redirect('/register');
        } else {
          // set flash message
          req.flash('success', 'Записът е успешно добавен!');
          // redirect to user page
          return res.redirect('/register');
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log(username);
    // CHECK IF USER EXISTS OR NOT
    db.query('SELECT * FROM users WHERE username = ?', [username], async (error, result) => {
      console.log(result);
      const user = result[0];
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      // CHECK IF INPUT PASSWORD IS VALID FOR INPUT EMAIL
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // CREATE THE JWT TOKEN
      //const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      req.session.user = {
        id: result[0].id,
        username: result[0].username,
        name: result[0].name
      };
      // SET THE JWT TOKEN IN THE COOKIE
      /* res.cookie('token', token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'Strict',
         maxAge: 3600000 // 1 HR EXPIRATION
       });
       */

      return res.redirect('/clients');
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/test', (req, res, next) => {

  res.render("pdf_en", {
  });

});
app.get('/contragents', (req, res, next) => {
  const query = "Select * from contragents";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.render("contragents", {
        data: result
      });
    }
  });
});
app.post("/addContragent", (req, res) => {
  const { eik, name, type, address, transport_num } = req.body;

  db.query('INSERT INTO contragents SET ?', { eik: eik, type: type, name_firm: name, address: address, transport_num: transport_num }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', 'Запис с такова ид съществува!');
      // redirect to user page
      return res.redirect('/contragents');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/contragents');
    }
  });
});
app.post("/deleteContragents/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = "delete From contragents Where id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/contragents')
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно изтрит!');
      // redirect to user page
      return res.redirect('/contragents');
    }
  })
});
app.post("/editContragent", (req, res) => {
  const { eik_edit, type_edit, name_edit, address_edit, id_edit, transport_num_edit } = req.body;

  db.query('Update contragents SET ? where id=' + id_edit, { eik: eik_edit, type: type_edit, name_firm: name_edit, address: address_edit, transport_num: transport_num_edit }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/contragents');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/contragents');
    }
  });
});
app.get('/products', (req, res, next) => {
  const query = "Select incoming_goods.*,DATE(datetime) AS date, products.*, contragents.name_firm, contragents.transport_num from incoming_goods join products on incoming_goods.product_id=products.id join contragents on suplier_id=contragents.id order by date desc;";
  db.query(query, (err, result_goods) => {
    if (err) {
      console.log(err);
    } else {
      db.query("Select * from products", (err, result_prod) => {
        if (err) {
          console.log(err);
        } else {
          db.query("Select * from contragents where type=1", (err, result_supp) => {
            if (err) {
              console.log(err);
            } else {
              res.render("goods", {
                data: result_goods,
                goods: result_prod,
                suppliers: result_supp
              });
            }
          });
        }
      });
    }
  });
});
app.post("/addProduct", (req, res) => {
  const { delivery_datetime, type, batch, quant, kilo, supplier, faktura } = req.body;
  let left_quant = parseFloat(quant) * parseFloat(kilo);
  db.query('INSERT INTO incoming_goods SET ?', { datetime: delivery_datetime, product_id: type, quantity: quant, kilo: kilo, batch: batch, suplier_id: supplier, faktura: faktura, left_quant: left_quant }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/products');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/products');
    }
  });
});
app.post("/addNewProduct", (req, res) => {
  const { name, packaging, storage, type } = req.body;
  db.query('INSERT INTO products SET ?;', { name: name, type: type, packaging: packaging, storage: storage }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/products');
    } else {

      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/products');
    }
  });
});
app.post("/deleteProducts/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = "delete From incoming_goods Where id_n = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/products')
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно изтрит!');
      // redirect to user page
      return res.redirect('/products');
    }
  })
});
app.post("/editProduct", (req, res) => {
  const { delivery_datetime_edit, type_edit, batch_edit, quant_edit, quant_old, kilo_edit, kilo_old, supplier_edit, faktura_edit, id_edit } = req.body;
  var old_all = parseFloat(kilo_old) * parseFloat(quant_old);
  var new_all = parseFloat(kilo_edit) * parseFloat(quant_edit);
  var quant_left = parseFloat(new_all) - parseFloat(old_all);
  db.query("Update incoming_goods SET datetime='" + delivery_datetime_edit + " ',batch='" + batch_edit + "',product_id=" + type_edit + ",quantity=" + quant_edit + ",kilo=" + kilo_edit + ",suplier_id=" + supplier_edit + ",faktura='" + faktura_edit + "',left_quant= left_quant +" + quant_left + " where id_n=" + id_edit + ";", (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/products');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/products');
    }
  });
});
app.get('/tasks', (req, res, next) => {
  const query = "Select * from tasks join sandwiches on tasks.type=sandwiches.id order by date DESC";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      const query = "Select * from incoming_goods where left_quant>0 order by datetime ASC;";
      db.query(query, (err, result_goods) => {
        if (err) {
          console.log(err);
        } else {
          db.query("Select * from sandwiches", (err, result_s) => {
            if (err) {
              console.log(err);
            } else {
              db.query("SELECT * FROM `sandwiches_products` join products on product_id= products.id ;", (err, result_rs) => {
                if (err) {
                  console.log(err);
                } else {
                  res.render("tasks", {
                    data: result,
                    sandwich: result_s,
                    recipie: result_rs,
                    storage: result_goods
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

app.get("/printExpedition/:id_print/:firm/:date", (req, res, next) => {
  const { id_print, date, firm } = req.params;
  const query = "Select expedition.*,name,price,packaging,batch_num,name_firm,eik,address, date_add(tasks.date, INTERVAL 10 DAY) AS exp_date from expedition join tasks on expedition.product_id=tasks.idntfr join sandwiches on tasks.type=sandwiches.id join contragents on expedition.client_id= contragents.id Where expedition.date =? and name_firm=?";
  const firm_q = "Select name_firm,eik,address from contragents Where name_firm=?";
  db.query(query, [date, firm], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/tasks')
    } else {
      db.query(firm_q, [firm], (err, firm_data) => {
        if (err) {
          // set flash message
          console.log(err.sqlMessage);
          req.flash('error', err.sqlMessage);
          // redirect to user page
          return res.redirect('/tasks')
        } else {
          var clientJson =
            res.render('pdf', {
              task: result,
              id: id_print,
              date: date,
              firm: firm_data
            });
        }
      })
    }
  })
});
app.get("/printTask/:id_print", (req, res, next) => {
  const { id_print } = req.params;
  const query = "Select * from tasks join sandwiches on tasks.type=sandwiches.id Where date = ?;";
  const query_sum = "Select coalesce(sum(quantity),-1) as sum from tasks Where date = ?;";
  db.query(query, [id_print], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/tasks')
    } else {
      db.query(query_sum, [id_print], (err, result_sum) => {
        if (err) {
          // set flash message
          console.log(err.sqlMessage);
          req.flash('error', err.sqlMessage);
          // redirect to user page
          return res.redirect('/tasks')
        } else {
          var clientJson =
            res.render('certif_pdf', {
              task: result,
              date: id_print
            });
        }
      })
    }
  })
});
app.post("/deleteTasks/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = "delete From tasks Where idntfr = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/tasks')
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно изтрит!');
      // redirect to user page
      return res.redirect('/tasks');
    }
  })
});

app.post("/addTask", (req, res) => {
  const { date, type, quant, packaging } = req.body;

  var products = req.body.products;
  var quantities = req.body.quantities;

  var ids = req.body.ids.split(",");
  var quants_new = req.body.quants_new.split(",");
  let update_q = "";
  let insert_q = "";

  if (!Array.isArray(quantities)) {
    quantities = [quantities];
  }
  if (!Array.isArray(products)) {
    products = [products];
  }


  var batch = "L";
  var barr = date.split("-");
  const reversed = barr.reverse();
  reversed.forEach(item => {
    if (item.length > 2) {
      item = item.slice(2);
    }
    batch += item;
  });

  db.query('INSERT INTO tasks SET ?;SELECT LAST_INSERT_ID() as test;', { date: date, type: type, quantity: quant, batch_num: batch, left_quant: quant }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/tasks');
    } else {
      var query = "";
      var sandwich_id = result[1][0].test;
      ids.forEach((item, index) => {
        update_q += 'Update incoming_goods set left_quant = left_quant - ' + quants_new[index] + ' where id_n= ' + item + ';';
        insert_q += ' Insert into used_products(product_id, quantity, task_id) VALUES (' + item + ',' + quants_new[index] + ',' + sandwich_id + ');';
      });
      db.query(update_q, (error, result) => {
        if (error) {
          // set flash message
          req.flash('error', error.sqlMessage);
          // redirect to user page
          return res.redirect('/tasks');
        } else {
          db.query(insert_q, (error, result) => {
            if (error) {
              // set flash message
              req.flash('error', error.sqlMessage);
              // redirect to user page
              return res.redirect('/tasks');
            } else {
              // set flash message
              req.flash('success', "Записът е добавен успешно");
              // redirect to user page
              return res.redirect('/tasks');

            }

            //var batch= date.replaceAll("-","");


          });
        }
      });
    }
  });
});
app.post("/editTask", (req, res) => {
  const { date_edit, type_edit, quant_edit, id_edit } = req.body;
  //var batch= date.replaceAll("-","");
  var batch = "L";
  var barr = date_edit.split("-");
  const reversed = barr.reverse();
  reversed.forEach(item => {
    if (item.length > 2) {
      item = item.slice(2);
    }
    batch += item;
  });
  db.query('Update tasks SET ? where idntfr=' + id_edit, { date: date_edit, type: type_edit, quantity: quant_edit, batch_num: batch }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/tasks');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/tasks');
    }
  });
});
app.get('/expedition', (req, res, next) => {
  const query = "Select expedition.*,name_firm,batch_num,sandwiches.name, packaging from expedition join contragents on client_id=contragents.id join tasks on tasks.idntfr=product_id join sandwiches on tasks.type=sandwiches.id order by date desc;";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      db.query("Select * from contragents where type=0", (err, result_s) => {
        if (err) {
          console.log(err);
        } else {
          db.query("Select * from tasks join sandwiches on tasks.type=sandwiches.id where left_quant>0", (err, result_t) => {
            if (err) {
              console.log(err);
            } else {
              res.render("expedition", {
                data: result,
                clients: result_s,
                tasks: result_t
              });
            }
          });
        }
      });
    }
  });
});
app.post("/addExport", (req, res) => {
  const { date, product_id, quant, fak_num, fak_date, client_id } = req.body;
  db.query('INSERT INTO expedition SET ?', { date: date, product_id: product_id, quantity: quant, fak_num: fak_num, fak_date: fak_date, client_id: client_id }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/expedition');
    } else {
      db.query('Update tasks set left_quant=left_quant - ? where idntfr= ?', [quant, product_id], (error, result) => {
        if (error) {
          // set flash message
          req.flash('error', error.sqlMessage);
          // redirect to user page
          return res.redirect('/expedition');
        } else {
          // set flash message
          req.flash('success', 'Записът е успешно добавен!');
          // redirect to user page
          return res.redirect('/expedition');
        }
      });
    }
  });
});
app.post("/editExport", (req, res) => {
  const { fak_num_edit, fak_date_edit, client_id_edit, date_edit, product_id_edit, quant_edit, id_edit } = req.body;

  db.query('Update expedition SET ? where id_e=' + id_edit, { date: date_edit, type: type_edit, quantity: quant_edit, batch_num: batch }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/tasks');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/tasks');
    }
  });
});
app.post("/deleteExport", (req, res) => {
  const { id, quant, product_id } = req.body;
  console.log(id);
  const query = "delete From expedition Where id_e = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/expedition')
    } else {
      db.query('Update tasks set left_quant=left_quant + ? where idntfr= ?', [quant, product_id], (error, result) => {
        if (err) {
          // set flash message
          console.log(err.sqlMessage);
          req.flash('error', err.sqlMessage);
          // redirect to user page
          return res.redirect('/expedition')
        } else {
          // set flash message
          req.flash('success', 'Записът е успешно изтрит!');
          // redirect to user page
          return res.redirect('/expedition');
        }
      })
    }
  })
});
app.get('/warehouse', (req, res, next) => {
  const query = "Select incoming_goods.*,products.* from incoming_goods join products on incoming_goods.product_id=products.id where storage=1 and left_quant>0;";
  db.query(query, (err, result_goods) => {
    if (err) {
      console.log(err);
    } else {
      db.query("Select incoming_goods.*,products.* from incoming_goods join products on incoming_goods.product_id=products.id where storage=2 and left_quant>0;", (err, result_prod) => {
        if (err) {
          console.log(err);
        } else {
          db.query("Select incoming_goods.*,products.* from incoming_goods join products on incoming_goods.product_id=products.id where storage=0 and left_quant>0;", (err, result_bread) => {
            if (err) {
              console.log(err);
            } else {
              db.query("Select tasks.*,name, date_add(tasks.date, INTERVAL 10 DAY) AS exp_date from tasks join sandwiches on tasks.type=sandwiches.id where left_quant>0;", (err, result_supp) => {
                if (err) {
                  console.log(err);
                } else {
                  res.render("warehouse", {
                    data_1: result_goods,
                    data_2: result_prod,
                    data_bread: result_bread,
                    production: result_supp
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});
app.get('/recipies', (req, res, next) => {
  const query = "Select products.* from products;";
  db.query(query, (err, result_goods) => {
    if (err) {
      console.log(err);
    } else {
      db.query("Select * from sandwiches;", (err, result_prod) => {
        if (err) {
          console.log(err);
        } else {
          db.query("Select incoming_goods.*,products.* from incoming_goods join products on incoming_goods.product_id=products.id where storage=0 and quantity>0;", (err, result_bread) => {
            if (err) {
              console.log(err);
            } else {
              db.query("SELECT * FROM `sandwiches_products` join products on product_id= products.id ;", (err, result_supp) => {
                if (err) {
                  console.log(err);
                } else {
                  res.render("recipies", {
                    data: result_prod,
                    products: result_goods,
                    data_bread: result_bread,
                    recipie: result_supp
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});
app.post("/addRecipie", (req, res) => {
  const { name, packaging, weight } = req.body;
  var products = req.body.products;
  var quantities = req.body.quantities;
  if (!Array.isArray(quantities)) {
    quantities = [quantities];
  }
  if (!Array.isArray(products)) {
    products = [products];
  }

  db.query("INSERT INTO sandwiches(name,packaging, weight) values('" + name + "','" + packaging + "','" + weight + "');SELECT LAST_INSERT_ID() as test;", (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/recipies')
    } else {
      var query = "";
      var sandwich_id = result[1][0].test;
      products.forEach((element, index) => query += "Insert Into sandwiches_products( `product_id`, `quantity`, `recipe_id`) VALUES ('" + element + "','" + quantities[index] + "','" + sandwich_id + "');");
      db.query(query, (error, result) => {
        if (error) {
          // set flash message
          req.flash('error', error.sqlMessage);
          // redirect to user page
          return res.redirect('/expedition');
        } else {
          // set flash message
          req.flash('success', "Записът е добавен успешно");
          // redirect to user page
          return res.redirect('/recipies');

        }
      })
    }
  })
});
app.post("/deleteRecipies", (req, res) => {
  const { ids } = req.body;
  const query = "delete From sandwiches Where id in (?)";
  db.query(query, [ids], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/recipies')
    } else {
      db.query('delete From sandwiches_products Where recipe_id in (?)', [ids], (error, result) => {
        if (err) {
          // set flash message
          console.log(err.sqlMessage);
          req.flash('error', err.sqlMessage);
          // redirect to user page
          return res.redirect('/recipies')
        } else {
          // set flash message
          req.flash('success', 'Записът е успешно изтрит!');
          // redirect to user page
          return res.redirect('/recipies');
        }
      })
    }
  })
});
app.post("/deleteStorage", (req, res) => {
  const { ids } = req.body;
  const query = "Update incoming_goods set left_quant= 0 Where id_n in (?)";
  db.query(query, [ids], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/warehouse')
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно изтрит!');
      // redirect to user page
      return res.redirect('/warehouse');
    }
  })
});
app.post("/deleteSandwiches", (req, res) => {
  const { ids } = req.body;
  const query = "Update tasks set left_quant= 0 Where idntfr in (?)";
  db.query(query, [ids], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.redirect('/warehouse')
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно изтрит!');
      // redirect to user page
      return res.redirect('/warehouse');
    }
  })
});

app.get('/form', (req, res, next) => {
  res.render("registration_form", {});
});
app.get('/objects_form/:id', (req, res, next) => {
  res.render("object_form", {});
});
app.get('/faktura/:id', (req, res, next) => {
  const { id } = req.params;
  const query = "SELECT objects.*,month(last_issued_date) as last_month, month(curdate()) as now_month, factura_period FROM objects join debt on debt.client_id = objects.client_id join clients on clients.id= debt.client_id where debt_id= ?";
  db.query(query, [id], (err, result_objects) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
    } else {
      db.query("SELECT clients.*,debt.debt_id as num, debt.date_issued FROM debt join clients on clients.id = debt.client_id where debt_id= ?", [id], (err, result_client) => {
        if (err) {
          // set flash message
          console.log(err.sqlMessage);
        } else {
          // set flash message
          res.render("faktura_pdf", {
            objects: result_objects,
            client_info: result_client[0]
          });
        }
      })
    }
  })
});
app.post('/view_faktura', (req, res) => {
  const { id } = req.body;
  const query = "Update debt set is_checked = 1, fak_status=1 where debt_id= ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
    } else {
      // set flash message
      console.log(result);
      console.log(result.affectedRows);
      return res.json({ url: "/faktura/" + id, is_changed: result.changedRows });
    }
  })
});
app.post('/mark_faktura', (req, res) => {
  const { id } = req.body;
  const query = "Update debt set to_send = 1, fak_status =2 where debt_id= ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      return res.sendStatus(400);
    } else {
      // set flash message
      return res.sendStatus(200);
    }
  })
});
app.get('/clients', checkLogin, (req, res, next) => {
  const query = "Select * from clients";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.render("clients", {
        data: result
      });
    }
  });
});
app.use('/clients', function (err, req, res, next) {
  res.redirect('/');
});
app.post("/addClient", (req, res) => {
  let { bulstat, name, type, address, phone, email, mol, factura_date, factura_period, object_id, object_address, monthly_tax, dds, dds_num, payment_type } = req.body;
  if (typeof object_id === "undefined") {
    object_id = []
  };
  if (!Array.isArray(object_id)) {
    object_id = [object_id];
  }
  if (typeof object_address === "undefined") {
    object_address = []
  };
  if (!Array.isArray(object_address)) {
    object_address = [object_address];
  }
  if (typeof monthly_tax === "undefined") {
    monthly_tax = []
  };
  if (!Array.isArray(monthly_tax)) {
    monthly_tax = [monthly_tax];
  }
  let query = "";
  db.query('INSERT INTO clients SET ?', { bulstat: bulstat, type: type, name: name, address: address, phone: phone, email: email, mol: mol, factura_date: factura_date, factura_period: factura_period, dds: dds, dds_num: dds_num, payment_type: payment_type }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', 'Запис с такова ид съществува!');
      // redirect to user page
      return res.redirect('/form');
    } else {
      const lastInsertedId = result.insertId;
      /*for (let i = 0; i < object_id.length; i++) {
        query += `INSERT INTO objects (id,client_id, address, responsible, tax) values ('` + object_id[i] + `','` + lastInsertedId + `','` + object_address[i] + `','Test Test','` + monthly_tax[i] + `');`;
      };
      if (query) {
        db.query(query, (error, result) => {
          if (error) {
            // set flash message
            req.flash('error', error.sqlMessage);
            // redirect to user page
            return res.redirect('/objects');
          } else {
            // set flash message
            req.flash('success', 'Записът е успешно добавен!');
            // redirect to user page
            return res.redirect('/clients');
          }
        });
      }
      else {*/
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.json({ client_id: lastInsertedId, client_name: name });
    }
  });
});
app.post("/deleteObject/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = "delete From objects Where id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.sendStatus(400);
    } else {
      // set flash message
      //req.flash('success', 'Записът е успешно изтрит!');
      // redirect to user page
      return res.sendStatus(200);
    }
  })
});

app.post("/editObject", (req, res) => {
  const { object_id_edit, object_address_edit, monthly_tax_edit, info_edit } = req.body;
 
  db.query('Update objects SET ? where id=' + object_id_edit, { address: object_address_edit, tax: monthly_tax_edit, info: info_edit}, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/objects');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно променен!');
      // redirect to user page
      return res.redirect('/objects');
    }
  });
});
app.post("/deleteClient/:id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  const query = "delete From clients Where id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      // set flash message
      console.log(err.sqlMessage);
      req.flash('error', err.sqlMessage);
      // redirect to user page
      return res.sendStatus(400);
    } else {
      // set flash message
      //req.flash('success', 'Записът е успешно изтрит!');
      // redirect to user page
      return res.sendStatus(200);
    }
  })
});
app.post("/editClient", (req, res) => {
  const { bulstat_edit, name_edit, address_edit, id_edit, email_edit,phone_edit,
    last_paid_edit,fak_period_edit } = req.body;
 
  db.query('Update clients SET ? where id=' + id_edit, { bulstat: bulstat_edit, name: name_edit, address: address_edit, email: email_edit, phone: phone_edit, factura_period: fak_period_edit, factura_date:last_paid_edit }, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/clients');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно променен!');
      // redirect to user page
      return res.redirect('/clients');
    }
  });
});
app.get('/objects', checkLogin, (req, res, next) => {
  const query = "Select objects.*, name from objects join clients on objects.client_id= clients.id;";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      db.query('Select * from clients', (error, result_clients) => {
        if (err) {
          // set flash message
          console.log(err.sqlMessage);
          req.flash('error', err.sqlMessage);
          // redirect to user page
          return res.redirect('/objects')
        } else {
          res.render("objects", {
            data: result,
            clients: result_clients
          });
        }
      });
    }
  });
});
app.use('/objects', function (err, req, res, next) {
  res.redirect('/');
});
app.post("/addObject", (req, res) => {
  let { client_id, object_id, object_address, info, monthly_tax } = req.body;
  let query = "INSERT INTO objects(id, address, info, tax, client_id) VALUES ";
  if (!Array.isArray(object_id)) {
    object_id = [object_id];
  }
  if (!Array.isArray(object_address)) {
    object_address = [object_address];
  }
  if (!Array.isArray(info)) {
    info = [info];
  }
  if (!Array.isArray(monthly_tax)) {
    monthly_tax = [monthly_tax];
  }
  for (let i = 0; i < object_id.length; i++) {
    query += '(' + object_id[i] + ', "' + object_address[i] + '", "' + info[i] + '",' + monthly_tax[i] + ', ' + client_id + '),';
  }
  query = query.slice(0, -1) + ';';
  db.query(query, (error, result) => {
    if (error) {
      // set flash message
      req.flash('error', error.sqlMessage);
      // redirect to user page
      return res.redirect('/objects');
    } else {
      // set flash message
      req.flash('success', 'Записът е успешно добавен!');
      // redirect to user page
      return res.redirect('/objects');
    }
  });
});
app.get('/debt', checkLogin, (req, res, next) => {
  const query = "Select debt.*,month(date_issued) as month, name, email from debt join clients on client_id= clients.id order by clients.id desc;";
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.render("debt_view", {
        data: result
      });
    }
  });
});
app.use('/debt', function (err, req, res, next) {
  res.redirect('/');
});
app.post('/sendMail', async (req, res) => {
  const { debt_id, date_issued, sum_to_pay, mail } = req.body;
  let row = {};
  let pdf = await generatePDFfromURL(debt_id);
  row.number = pad(debt_id, 9);
  row.date = date_issued;
  row.value = sum_to_pay;
  email
    .send({
      template: 'debt_message',
      message: {
        to: ['express_sot@abv.bg', 'lilia.a.nikolaeva@gmail.com', mail],
        attachments: [
          {   // utf-8 string as an attachment
            filename: 'factura_' + row.number + '.pdf',
            content: Buffer.from(pdf)
          }
        ]
      },
      locals: row
    })
    .then((res) => {
      console.log('res.originalMessage', res.originalMessage);
      db.query('update debt set fak_status = 3 where debt_id= ?;', [debt_id], (error, result) => {
        if (error) {
          return res.sendStatus(400);
        } else {
          return res.sendStatus(200);
        }
      })
    })
    .catch(console.error);
});
app.post("/createDebt", (req, res) => {
  const { client_id } = req.body;
  db.query('INSERT INTO debt SET ?;', { client_id: client_id }, (error, result) => {
    if (error) {
      console.log(error.sqlMessage);
      return res.json({ error: error.sqlMessage });
    } else {
      db.query('select * from debt where debt_id= ?;', [result.insertId], (error, debt_info) => {
        if (error) {
          throw error;
        } else {
          return res.json(debt_info[0]);
        }
      })
    }
  });
});
//listening our express() here
app.listen(PORT, () => {
  console.log(`Server started on Port :  ${PORT}`)
});
