const register = (app,db,bcrypt,saltRounds) => {
	// app.post("/register", (req,res) => {
	// 	const { name, email, password } = req.body;
	// 	bcrypt.hash(password, saltRounds, (error, hash) => {
	// 	    db("users")
	// 		.returning("*")
	// 		.insert({
	// 			name: name,
	// 			email: email,
	// 			password: hash,
	// 			joined: new Date()
	// 		})
	// 		.then(newUser => {
	// 			res.json(newUser[0]);
	// 		})
	// 		.catch(err => res.status(400).json("invalid registration"))
	//   	})
	// })

	app.post("/register", async (req,res) => {
		const { name, email, password } = req.body;
		try {
			//how to deal with error ?? 
			const hashed = await bcrypt.hash(password,saltRounds, (error, hashed) => {
				if (error) {	
					return error;
				}
				return hashed;
			});

			const newUser = await db("users").returning("*").insert({
				name: name,
				email: email,
				password: hashed,
				joined: new Date() //not the best practice given that the date should be determined by the client 
			})

			res.json(newUser[0]);
		} catch (error) {
			if (error.detail = "users_email_key") {
				res.status(400).json("email already registered, please try another email");
			} else {
				res.status(400).json("invalid registration");
			}
		}
	})
}

const signin = (app,db,bcrypt) => {
	app.post("/signin", (req,res) => {
		const { email, password } = req.body;
		db.select("*")
		.from("users")
		.where("email","=",email)
		.then(user => {
			if (user.length) {
				bcrypt.compare(password, user[0].password, (error, result) => {
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
}

const welcome = (app,db,bcrypt,saltRounds) => {
	register(app,db,bcrypt,saltRounds);
	signin(app,db,bcrypt);
}


module.exports = welcome;