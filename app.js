const express = require('express');
//for front-end and back-end at the same IP
const cors = require('cors'); 

const db = require('./db.js');
//for password encryption
const bcrypt = require('bcrypt');
const saltRounds = 10;
//for authentification
const jwt= require('jsonwebtoken');

//my functions
const admin = require("./admin/admin.js");
const welcome = require("./welcome/welcome.js");
const content = require("./content/content.js");



const app = express();
//the purpose of this??
app.use(express.json());
//for local use only
app.use(cors());

//for checking through POSTMAN on localhost
app.listen(3000, () => {
	console.log("we're on 3000");
})

admin(app,db); //for admin use only
welcome(app,db,bcrypt,saltRounds,jwt); //for the welcome home page	
content(app,db,bcrypt,saltRounds,jwt); //for the actual content page

