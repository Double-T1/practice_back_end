const express = require('express');
const bodyParser = require('body-parser');
//for front-end and back-end at the same IP
const cors = require('cors'); 
//library for linking to the database
const db = require('knex')({
  client: 'pg',
  connection: {
    connectionString: "postgres://input_hours_user:7jykg1EzXBMuivb2St8eUGqcEyH2pQpc@dpg-cm1fa921hbls73ai3tg0-a.singapore-postgres.render.com/input_hours",
    host: "dpg-cm1fa921hbls73ai3tg0-a",
    port: 5432,
    user: "input_hours_user",
    database: "input_hours",
    password: '7jykg1EzXBMuivb2St8eUGqcEyH2pQpc',
    ssl: { rejectUnauthorized: false }
  }
});
//my functions
const admin = require("./admin/admin.js");
const welcome = require("./welcome/welcome.js");
const content = require("./content/content.js");
//for password encryption
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
app.use(bodyParser.json());
//for local use only
app.use(cors());

//for checking through POSTMAN on localhost
app.listen(3000, () => {
	console.log("we're on 3000");
})

admin(app,db); //for admin use only
welcome(app,db,bcrypt,saltRounds); //for the welcome home page	
content(app,db,bcrypt,saltRounds); //for the actual content page

