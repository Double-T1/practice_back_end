const input = (app,db) => {
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
}

const profile_id = (app,db) => {
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
}

const profile_update_changeEmail = (app,db) => {
	app.put("/profile/update/changeEmail", (req,res) => {
		const { currentEmail, newEmail } = req.body;
		//step 1
		db("users")
			.returning("name")
			.where("email","=",currentEmail)
			.then(user => {
				if (!user.length) {
					res.status(400).json("user not found");
				}
			})

		//step 2
		db("users")
		    .returning("*")
				.update({
					email: newEmail
				})
				.then(newUser => {
					if (newUser.length) {
						res.json(newUser[0]);
					} else {
						res.json("email already taken, choose another one");
					}
				})
				.catch(err => res.status(400).json("update process went wrong, please try again"));
	})
}

const profile_update_changeName = (app,db) => {
	app.put("/profile/update/changeName", (req,res) => {
		const { email, currentName, newName } = req.body;
		//1. the currentNameis correct
		//2. update to the new name
		//step 1
		db("users")
			.returning("name")
			.where("email","=",email)
			.andWhere("name","=",currentName)
			.then(user => {
				if (!user.length) {
					res.status(400).json("user not found");
				}
			})

		//step 2
		db("users")
		    .returning("*")
				.update({
					name: newName
				})
				.then(newUser => {
					res.json(newUser[0]);
				})
				.catch(err => res.status(400).json("update process went wrong, please try again"));
	})
}

const profile_update_changePassword = (app,db,bcrypt,saltRounds) => {
	app.put("/profile/update/changePassword", (req,res) => {
		const { email, currentPassword, newPassword } = req.body;
		//1. the currentPassword is correct
		//2. update to the new password
		//step 1
		db("users")
		.returning("password")
		.where("email","=",email)
		.then(user => {
			if (!user.length) {
				res.status(400).json("user not found");
			} else {
				bcrypt.compare(currentPassword, user[0].password, (error, result) => {
					if (!result) {
						res.json("current password is incorrect");
					} else {
						//step 2
						bcrypt.hash(newPassword, saltRounds, (error, hash) => {
						    db("users")
							    .returning("*")
									.update({
										password: hash
									})
									.then(newUser => {
										res.json(newUser[0]);
									})
									.catch(err => res.status(400).json("update process went wrong, please try again"))
						})
					}
				})
			}
		})
	})
}

const delete_id = (app,db) => {
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
}

const content = (app,db,bcrypt,saltRounds) => {
	input(app,db);
	profile_id(app,db);
	profile_update_changeName(app,db);
	profile_update_changeEmail(app,db);
	profile_update_changePassword(app,db,bcrypt,saltRounds);
	delete_id(app,db);
}

module.exports = content;