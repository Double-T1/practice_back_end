const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'seaox237@gmail.com',
    pass: 'ihtj hqsy zhhz ozli'
  }
});

const register = (app,db,bcrypt,saltRounds) => {
	//better to make it in the databse with a deadline
	const validationMap = new Map(); 

	app.post("/register", async (req,res) => {
		const { name, email, password } = req.body;
		try {
			//check if the email is already registered 
			// const newUser = await db("users").("*").insert({
			// 	name: name,
			// 	email: email,
			// 	password: hash,
			// 	joined: new Date() //not the best practice given that the date should be determined by the client 
			// })

			const validationToken = Math.random().toString(36).substr(2, 8);
			validationMap.set(validationToken,{name, email, password});

			console.log(validationMap.get(validationToken));

			var mailOptions = {
				from: 'seaox237@gmail.com',
				to: email,
				subject: 'Email verification',
				text: `Click the following link to validate your email: http://localhost:3000/validateEmail?token=${validationToken}`
			};

			transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					throw error;
				} else {
					res.json("Validation email sent, please check your inbox.")	
				}
			});
		} catch (error) {
			res.status(400).json("cannot send validation to your email address");
		}
	})

	app.get("/validateEmail", async(req, res) => {
		try {
			const { token } = req.query;
			if (!validationMap.has(token)) {
				throw new Error("validation out of time, please try again", {cause: "known"});
			}
			
			const { name, email, password } = validationMap.get(token);
			validationMap.delete(token);
			
			//how to deal with error ?? 
			const hash = await bcrypt.hash(password,saltRounds);
			if (!hash) {
				throw new Error("password not encrypted", {cause: "known"});
			}

			//will automatically throw an error if an email already exist within the system
			const newUser = await db("users").returning("*").insert({
				name: name,
				email: email,
				password: hash,
				joined: new Date() //not the best practice given that the date should be determined by the client 
			})

			//has to switch back the correct link instead just a simple json file
			res.json(newUser[0]);
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