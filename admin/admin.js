const base = (app) => { 
	app.get("/", (req,res) => {
		return res.json("front page");
	})
}

const allUser = (app,db) => { 
	app.get("/allUser", (req,res) => {
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
}

const deleteAll = (app,db) => { 
	app.delete("/deleteAll", (req,res) => {
		db("users")
			.returning("name")
			.del()
			.then(() => {
				res.json("all data is deleted"); 
			})
			.catch(err => res.status(400).json("something went wrong"));
	})
}

const admin = (app, db) => {
	base(app);
	allUser(app,db);
	deleteAll(app,db);
}

module.exports = admin;