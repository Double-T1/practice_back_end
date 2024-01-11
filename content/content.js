const updateInput = (app,db) => {
	const isSmaller = (date1, date2) => {
		if (date1.getFullYear() < date2.getFullYear()) {
			return true;
		} else if (date1.getFullYear() > date2.getFullYear()) {
			return false;
		} else {
			if (date1.getMonth() < date2.getMonth()) {
				return true;
			} else if (date1.getMonth() > date2.getMonth()) {
				return false;
			} else {
				if (date1.getDate() < date2.getDate()) {
					return true;
				} else {
					return false;
				}
			}
		}
	}

	//f(a,b), if b is the same of a return 0, if b is the next day of a return 1, if neither return 2 
	const compareDays = (lastInputDate, stringDate) => {
		if (!lastInputDate) return 2; //first submission ever
		const newInputDate = new Date(stringDate.slice(1,11));
		
		if (isSmaller(lastInputDate,newInputDate)) {
			lastInputDate.setDate(lastInputDate.getDate()+1);
			if (isSmaller(lastInputDate,newInputDate)) {
				return 2;
			} else if (isSmaller(newInputDate,lastInputDate)) {
				console.log("something is wrong, this is not suppose to happen");
				return -1;
			} else {
				return 1;
			}
		} else if (isSmaller(newInputDate,lastInputDate)) {
			console.log("something is wrong, this is not suppose to happen");
			return -1;
		} else {
			return 0;
		}
	}

	app.put("/updateInput", (req,res) => {
		const { id, inputMins, newInputDate } = req.body;
		db("users")
			.where("id","=",id)
			.select("lastinputdate")
			.then(lastInputDate => {
				const ans = compareDays(lastInputDate[0].lastinputdate,newInputDate);
				const target = ["todaymins","totalmins","totaldays","streaks"];
				//ans === 0 same day, ans === 1 next day, ans === 2 many days later, 
				//ans === -1 the last date is newer than the new date, not suppose to happen
				//is conditional chaing possible so that we don't have to repeat a lot of the same code here
				if (ans === 0) {
					db("users")
						.returning(target)
						.where("id","=",id)
						.increment("todaymins",inputMins)
						.increment("totalmins",inputMins)
						.update("lastinputdate", newInputDate)
						.then(info => res.json(info[0]))
						.catch(err => res.status(400).json("at ans == 0, something went wrong"))
				} else if (ans === 1) {
					//for counting streaks
					db("users")
						.returning(target)
						.where("id","=",id)
						.increment("todaymins",inputMins)
						.increment("totalmins",inputMins)
						.increment("totaldays",1)
						.increment("streaks",1)
						.update("lastinputdate", newInputDate)
						.then(info => res.json(info[0]))
						.catch(err => res.status(400).json("at ans == 1, something went wrong"))
				} else if (ans === 2) {
					db("users")
						.returning(target)
						.where("id","=",id)
						.increment("todaymins",inputMins)
						.increment("totalmins",inputMins)
						.increment("totaldays",1)
						.update("streaks",1)
						.update("lastinputdate", newInputDate)
						.then(info => res.json(info[0]))
						.catch(err => res.status(400).json("at ans == 2, something went wrong"))
				} else {
					res.status(400).json("something went wrong with the dates, please contact the admin for further updates");
				}
			})
	})
}

const updateStreaks = (app,db) => {
	app.put("/updateStreaks", (req,res) => {
		const { id, newStreak } = req.body;
		db("users")
			.returning("streaks")
			.where("id","=",id)
			.update("streaks",newStreak)
			.then(streaks => res.json(streaks[0]))
			.catch(err => res.status(400).json("something went wrong while updating streaks"))
	})
}

const updateDailyGoal = (app,db) => {
	app.put("/updateDailyGoal", (req,res) => {
		const { id, newDailyGoal } = req.body;
		db("users")
			.returning("dailygoal")
			.where("id","=",id)
			.update({
				dailygoal: newDailyGoal
			})
			.then(updatedGoal => {
				res.json(updatedGoal[0])
			})
			.catch(err => console.log(err))
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
				} else {
					//step2
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
				}
			})
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
				} else {
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
				}
			})
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
	updateInput(app,db);
	updateStreaks(app,db);
	updateDailyGoal(app,db);
	profile_id(app,db);
	profile_update_changeName(app,db);
	profile_update_changeEmail(app,db);
	profile_update_changePassword(app,db,bcrypt,saltRounds);
	delete_id(app,db);
}

module.exports = content;