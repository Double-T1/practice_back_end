const register = (app,db,bcrypt,saltRounds) => {
	app.post("/register", async (req,res) => {
		const { name, email, password } = req.body;
		try {
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

//1. email doesn't exist
//2. passwword doesn't match
//3. other issues
const signin = (app,db,bcrypt) => {
	app.post("/signin", async (req,res) => {
		const { email, password } = req.body;

		try {
			const user = await db.select("*").from("users").where("email","=",email);
			if (!user.length) {
				throw new Error("email doesn't exist", {cause: "known"});
			}

			const validPassword = await bcrypt.compare(password, user[0].password);
			if (validPassword) {
				res.json(user[0]);
			} else {
				throw new Error("password doesn't match", {cause: "known"});
			}
		} catch (error) {
			if (error.cause === "known") {
				res.status(400).json(error.message);
			}  else {
				res.status(400).json("something went wrong, please contact the admin");
			}
		}
	}) 
}

const welcome = (app,db,bcrypt,saltRounds) => {
	register(app,db,bcrypt,saltRounds);
	signin(app,db,bcrypt);
}


module.exports = welcome;