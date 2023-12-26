const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); //for front-end and back-end at the same IP
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


const app = express();
app.use(bodyParser.json());
app.use(cors());

for checking through POSTMAN only
app.listen(3000, () => {
	console.log("we're on 3000");
})

app.get("/alluser", (req,res) => {
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

app.post("/signin", (req,res) => {
	const { email, password } = req.body;
	db.select("*").from("users")
		.where("email","=",email)
		.andWhere('password',"=",password)
		.then(user => {
			if (user.length) {
				res.json(user[0]);
			} else {
				res.status(400).json("cannnot find such user");
			}
		})
		.catch(err => res.status(400).json("can't find the user"))
}) 

app.post("/register", (req,res) => {
	const { name, email, password } = req.body;
	db("users")
		.returning("*")
		.insert({
			name: name,
			email: email,
			password: password,
			joined: new Date()
		})
		.then(newUser => {
			res.json(newUser[0]);
		})
		.catch(err => res.status(400).json("invalid registration"))
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

app.put("/input", (req,res) => {
	const { id, minutes } = req.body;
	console.log(id,minutes);
	db("users")
		.returning("minutes")
		.where("id","=",id)
		.increment("minutes",minutes)
		.then(totalMinutes => {
			res.json(totalMinutes[0].minutes);
		})
		.catch(err => res.status(400).json("an error occured, please try later"))
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