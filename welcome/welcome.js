const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL_USER,
    pass: process.env.AUTH_EMAIL_PASS
  }
});

const createTable = (db) => {
  return db.schema.createTableIfNotExists('temp_tokens', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable();
    table.string('name').notNullable();
    table.string("hashpassword").notNullable();
    table.string('token').notNullable();
  });
};

const dropTable = (db) => {
  return db.schema.dropTable('temp_tokens');
};

const register = (app,db,bcrypt,saltRounds) => {
	//better to make it in the databse with a deadline
	//const validationMap = new Map(); 

	app.post("/register", async (req,res) => {
		const { name, email, password } = req.body;
		try {
			//check if the email is already registered 
			const user = await db.select("*").from("users").where("email","=",email);
			if (user.length) {
				throw new Error("email already registered, please try another email", {cause: "known"});
			}

			//how to deal with error ?? 
			const hashPassword = await bcrypt.hash(password,saltRounds);
			if (!hashPassword) {
				throw new Error("password not encrypted", {cause: "known"});
			}

			await createTable(db);
			const validationToken = Math.random().toString(36).substr(2, 8);
			const tempData = await db("temp_tokens").returning("*").insert({
				email: email,
				name: name,
				hashpassword: hashPassword,
				token: validationToken
			})
			//console.log("tempData: ", tempData);
			if (!tempData) {
				throw "someting went wrong with the databse";
			}
			//validationMap.set(validationToken,{name, email, hashPassword});

			var mailOptions = {
				from: process.env.AUTH_EMAIL_USER,
				to: email,
				subject: 'Email verification',
				text: `Click the following link to validate your email: ${process.env.BACKEND_URL}/validateEmail?token=${validationToken}`
			};

			transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					throw error;
				} else {
					res.json({
						message: "Validation email sent, please check your inbox."
					})	
				}
			});
		} catch (error) {
			if (error.cause === "known") {
				res.status(400).json(error.message);
			} else {
				console.log(error);
				res.status(400).json("cannot send validation message to your email address");	
			}
		}
	})

	app.get("/validateEmail", async(req, res) => {
		try {
			const { token } = req.query;
			const info = await db("temp_tokens").returning("*").where("token","=",token).del();
			if (!info.length) {
				throw new Error("validation out of time, please try again", {cause: "known"});
			}
			
			//console.log("info: ", info);
			const { name, email, hashpassword } = info[0];
			
			//will automatically throw an error if an email already exist within the system
			const newUser = await db("users").returning("*").insert({
				name: name,
				email: email,
				password: hashpassword,
				joined: new Date() //not the best practice given that the date should be determined by the client 
			})

			//has to switch back the correct link instead just a simple json file
			res.redirect(`${process.env.FRONTEND_URL}`);

			//res.json(newUser[0]);
		} catch(error) {
			if (error.cause === "known") {
				res.status(400).json(error.message);
			} else {
				res.status(400).json("invalid registration");
			}
		}	 
	})
}



//1. email doesn't exist
//2. passwword doesn't match
//3. other issues
const login = (app,db,bcrypt,jwt) => {
	app.post("/login", async (req,res) => {
		const { email, password } = req.body;

		try {
			const user = await db.select("*").from("users").where("email","=",email);
			if (!user.length) {
				throw new Error("email doesn't exist", {cause: "known"});
			}

			const validPassword = await bcrypt.compare(password, user[0].password);
			if (!validPassword) {
				throw new Error("password doesn't match", {cause: "known"});
			} 

			// Generate a JWT token
			//second argument secretKey can be changed in the future
   			const token = await jwt.sign({ id: user[0].id }, "secretKey");
   			user[0].token = token;
   			res.json(user[0]);
		} catch (error) {
			if (error.cause === "known") {
				res.status(400).json(error.message);
			}  else {
				res.status(400).json("something went wrong, please contact the admin");
			}
		}
	}) 
}

const welcome = (app,db,bcrypt,saltRounds,jwt) => {
	register(app,db,bcrypt,saltRounds);
	login(app,db,bcrypt,jwt);
}


module.exports = welcome;