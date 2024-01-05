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
//for password encryption
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
app.use(bodyParser.json());
app.use(cors());

//for checking through POSTMAN
app.listen(3000, () => {
	console.log("we're on 3000");
})

app.get("/allUser", (req,res) => {
	console.log("haha");
	db.select("*").from("users")
		.then(user => {
			if (user.length) {
				res.json(user);
			} else {
				res.json("no user");
			}
		})
		.catch(err => res.status(400).json("server issue"))
})

app.get("/", (req,res) => {
	return res.json("front page");
})

app.delete("/deleteAll", (req,res) => {
	db("users")
		.returning("name")
		.del()
		.then(() => {
			res.json("all data is deleted"); 
		})
		.catch(err => res.status(400).json("something went wrong"));
})


app.post("/register", (req,res) => {
	const { name, email, password } = req.body;
	bcrypt.hash(password, saltRounds, (error, hash) => {
    db("users")
		.returning("*")
		.insert({
			name: name,
			email: email,
			password: hash,
			joined: new Date()
		})
		.then(newUser => {
			res.json(newUser[0]);
		})
		.catch(err => res.status(400).json("invalid registration"))
  })
})

app.post("/signin", (req,res) => {
	const { email, password } = req.body;
	db.select("*").from("users")
		.where("email","=",email)
		.then(user => {
			console.log(user);
			if (user.length) {
				bcrypt.compare(password, user[0].password, (error, result) => {
					console.log(result);
					if (result) {
						res.json(user[0]);
					} else {
						res.status(400).json("password doesn't match");
					}
				})
			} else {
				res.status(400).json("email doesn't exist");
			}
		})
		.catch(err => res.status(400).json("can't find the user"))
}) 

app.put("/input", (req,res) => {
	const { id, minutes } = req.body;
	db("users")
		.returning("minutes")
		.where("id","=",id)
		.increment("minutes",minutes)
		.then(totalMinutes => {
			res.json(totalMinutes[0].minutes);
		})
		.catch(err => res.status(400).json("an error occured, please try later"))
})

app.get("/profile/:id", (req,res) => {
	const { id } = req.params;
	db.select("*").from("users")
		.where("id","=",id)
		.then(user => {
			if (user.length) {
				res.json(user[0]);
			} else {
				res.json("cannot find the corresponding user")
			}
		})
		.catch(err => res.status(400).json("invalid search"));
})

app.delete("/delete/:id", (req,res) => {
	const { id } = req.params;
	db("users")
		.returning("name")
		.where("id","=",id)
		.del()
		.then(name => {
			if (name.length) {
				res.json(name[0]);
			} else {
				 res.json("non-existent user")
			}
		})
		.catch(err => res.status(400).json("something went wrong"));
})

/*
/ => GET
/signin => POST log in with an existing user
/register => POST register a new user
/profile/:id => GET stats of a certain user
/time => PUT log in the amount of minutes
/delete
*/