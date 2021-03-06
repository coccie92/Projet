var util = require("util");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("test.db");
var email = require("./email.js");
var timeout_time = 100; 
var us = require("./user.js");
var user={};/*Object user*/


/**
*The existing roles a user can have are :
* 0 : simple user
* 1 : writer (he can write articles, in order to publish its)
* 2 : admin (he controles and manages the all users excepted the superadmin, and all news )
* 3 : superadmin (he has th same rights of the admin but he also can delete or add admin)
*/

/**
*This method is the constructor of the object user
*@param n (String) n_name
*@param p (String) f_name
*@param e (String ) email
*@param pw (String ) password
*@param co () cookie
*@param date(date) date of the connexion
*@param role (int) level of access 
*@param valid (boolean) account activ or not
*/
var user = function (n, p, e, pw, co, date, role, valid){
	this.n_name = (n) ? n : "NC";
	this.f_name = (p) ? p : "NC";
	this.email = (e) ? e : "NC";
	this.passwd= (pw) ? pw : "NC";
	this.cookie = (co) ? co : 0;
	this.role = (role) ? role : 0;
	this.valid = (valid) ? valid : false; 
};


exports.get_login=function(cookie, o, cb){
	var a = "SELECT us_email FROM users WHERE us_cookie =\'"+cookie+"\'";
	var mail = null; 
	db.each(a, function(err,row){
		if(err) console.log("Error db_user => get_login" + err)
		mail=row.us_email;
	}, function(){
		o[cb](mail);
	});
};
/**
*This method gets the email from the name and the firstname of an user
*@param name : name (String)
*@param fname : fistname (String)
*@param obj : this 
*@param cb : callback function
*/
exports.get_email=function(name, fname, autre ,obj, cb){
	var res = null;
	var a ="SELECT us_email FROM users WHERE us_name =\'" + name + "\' AND us_firstname = \'" + fname + "\'";
	db.each(a, function(e, row){
		if(e) console.log(e);
		res = row.us_email;
	}, function(){
		obj[cb](res, autre);
	});
};

/**
* This method is used to change the mail address and the psw of the super admin 
* email : new address
* mdp : new password
*/
exports.modif_superAdmin=function(mail, mdp, obj, cb){
	var stmt = db.prepare("UPDATE users SET  us_email = \'" + mail + "\' , us_passwd = \'" + mdp + "\' WHERE us_role = \'"+ 3 +"\'");
	stmt.run(function(err){
		if (err)
			obj[cb](500);
		else
			obj[cb](200);
		});
}; 

exports.recup_all_mail = function(obj, cb){
	var mail = "";
	var a ="SELECT us_email FROM users WHERE us_valid = \'true\'";
	db.each(a, function(err, row){  
        mail += row.us_email + ";";
    }, function(){
    	mail = mail.substring(0,mail.length-1);
    	obj[cb](200, mail);
    });
};

/**
*This method is used to add a new user in the database
*@param user (object) the user object {n_name = "DUPONT", f_name = "JACK", email = "jack@gmail.com", password = "jackpassword", cookie = "jack@gmail.com_149858585, role =1, valid = true }
*the user is added to the database nevertheless he has not got an activ account. The admin (or the superadmin) have to check it first.
*they check it thanks to the valid_user method.
*/
exports.add_user = function(user, obj, cb){
	db.run("INSERT INTO users (\"us_name\", \"us_firstname\", \"us_email\", \"us_passwd\", \"us_role\", \"us_valid\") VALUES (\'"+user.n_name+"\',\'"+user.f_name+"\',\'"+user.email+"\',\'"+user.passwd+"\', "+ user.role +",\'false\')",
	function(err){
		if (err){
			obj[cb](500); console.log(err);
		}
		else
			obj[cb](200);
		});
	db.on("error", function(e){  console.log("ERROR - Database" + e); });
};


/**
*This method is used by the admin or the super admin.
*they can valid the account of a new user 
*/
exports.valid_user=function(e, obj, cb){   //test de valid 
	var stmt = db.prepare("UPDATE users SET  us_valid = \'true\' WHERE us_email = \'"+ e+"\'");
	stmt.run(function(err){
		if (err)
			obj[cb](500);
		else
			obj[cb](200);
		});
	email.sendMail("asmaa.ghoumari@gmail.com","Nouveau Membre", "Vous avez un nouveau inscript : "+e, cb);
};

exports.get_status=function(e, obj, cb){
	var a ="SELECT us_valid FROM users WHERE us_email = \'"+e+"\'";
	var valid=false;
	db.each(a, function(err, row){  
        valid = row.us_valid;
    }, function(){
    	obj[cb](valid);
    });
};

/**
*This method controls the correspondance between the password recorded for an unique email, and what is typed 
*it returns compt = 0 or 1 (the email is unique so 2 or more passwords cannot exist for a given user)
*/
exports.check_psw = function(e, p, obj, cb){
	var pwd = null;
	var a ="SELECT us_passwd FROM users WHERE us_email = \'"+e+"\'";
    db.each(a, function(err, row) { 
        pwd = row.us_passwd;
    }, function(){
    	if(pwd==p){
    		obj[cb](true); 
    	}
    	else obj[cb](false); 
    });	 
};

/**
*This method allows the admin or the superadmin to add a new user 
*@param user (Object) the user added
*@param e (String) the email of the admin of the superadmin 
*/
exports.add_other_user=function(user, e, obj, cb){
	if(user.email!=e){
		var stmt= db.prepare("INSERT INTO users (us_name, us_firstname, us_email, us_passwd, us_role, us_valid)VALUES (\'"+user.n_name+"\',\'"+user.f_name+"\',\'"+user.email+"\',\'"+user.passwd+"\',\'"+user.role+"\', \'true\')");
		stmt.run(function(err){
		if (err)
			obj[cb](500);
		else
			obj[cb](201);
		});
		stmt.on("error", function(e){  console.log("ERROR - Database" + e); });
	}
};

exports.delete_valid_user = function (e, obj, cb){
	db.run("UPDATE users SET us_valid = 'false' WHERE us_email= ? ", e, function(err){
		if (err)
			obj[cb](500);
		else
			obj[cb](200);
	});
	db.on("error", function(e){  console.log("ERROR - Database" + e); });	
};


/**
*This method is used to delete an user in the database
*@param user (object) the user object
*example : {n_name = "DUPONT", f_name = "JACK", email = "jack@gmail.com", password = "jackpassword", cookie = "jack@gmail.com_149858585, role =1, valid = true }
*/
exports.delete_user = function (e, obj, cb){
	db.run("DELETE FROM users WHERE us_email= ? ", e, function(err){
		if (err)
			obj[cb](500);
		else
			obj[cb](200);
	});
	db.on("error", function(e){  console.log("ERROR - Database" + e); });	
};

/**
*This method is used to change informations about an user
*@param user (object) the user object
*example : {n_name = "DUPONT", f_name = "JACK", email = "jack@gmail.com", password = "jackpassword", cookie = "jack@gmail.com_149858585, role =1, valid = true }
*/
exports.modif_user = function(champs, value, mail, obj, cb){
	var auto_chps = "us_name, us_firstname, us_passwd, us_role ";
	for( var z in champs){
		if (~auto_chps.indexOf(champs[z])){
			var stmt=db.prepare("UPDATE users SET \'"+ champs[z] +"\' = \'"+value[z]+"\' WHERE us_email =\'"+mail+"\'");
			stmt.run(function(err){
				if (err)
					obj[cb](500);
				else
					obj[cb](200);
			}); 
			//email.sendMail(mail , "Modifications ", champs[z], cb); //envoi des modif effectuées par le user
		}
		else console.log(" Modification interdite");
	}
};

/**
* This function is used to get all unvalid users statuts
* obj 
* cb callback method
*/
exports.get_unval_users = function(obj, cb ){
	var a = "SELECT us_role role, us_email mail, us_name name, us_firstname firstname FROM users WHERE us_valid =\'"+false+"\'";
	var unval = new Array();
	db.each(a, function(err, row){
		if (err)
			obj[cb](500);
		else
			unval.push(row);
	},function(){
		obj[cb](200,unval);
	});
};

/**
*This method is used to return all informations about an user 
*@param email gives the id of an user to get the access of the database and display its informations.
*it returns an user Object
*/
exports.get_user = function(mail, obj, callback, secure ){
	var auth=null, a = "";
	if(secure == "true")
		a = "SELECT us_email mail, us_name name, us_firstname fname FROM users WHERE us_email=\'"+mail+"\'";
	else
 		a = "SELECT * FROM users WHERE us_email=\'"+mail+"\'"; 
    db.each(a, function(err, row) {  
        if (err)
			obj[callback](500);
		else
			auth = row;   
    }, function(){ 
    	obj[callback](200,auth);    
    });	
};

/**
*This method returns all valid users from the table
*obj 
*cb  : callback function
*/
exports.get_all_users=function(obj, cb){
	var a ="SELECT us_role role, us_email mail, us_name name, us_firstname firstname FROM users WHERE us_valid=\'"+true+"\'"; 
	var res = new Array();
	db.each(a, function(err, row){
		if (err)
			obj[cb](500);
		else
			res.push(row);
	},function(){
		obj[cb](200, res);
	});
};


/**
*This method is used to return the name of a redactor 
*@param email : id of the user 
*/
exports.get_name = function (mail, obj, cb){
	var n="";
	var a="SELECT us_name FROM users WHERE us_email = \'"+mail+"\'";
	db.each(a, function(err, row){
		if (err)
			n = err;
		else
			n = row.us_name;
	}, function (){ obj[cb](n); });
};

/**
* This method is testing the first login time 
* If the user exists in the database, it set a cookie (call of set_cookie function)
*If not it displays an error message 
*@param e : the user's login (his/her email address)
*@param p : the user's password
*@param resp : the response send
*/
exports.first_log = function(e, p, obj, cb){
	var a = "SELECT us_email, us_role FROM users WHERE us_email=\'"+e+"\' AND us_passwd=\'"+p+"\'";
	var coo = null;
	var r = null, role=0;
    db.each(a, function(err, row) { // on extrait la date de la requête a 
     	coo = row.us_email;
     	role = row.us_role;
    },function(){    	
 		if(coo){
        	r = set_cookie(coo);
        	obj[cb](true,r,role) ;
    	}else{	
	        obj[cb](false) ;
   		}
    });	
};

/**
*This method is used to check the timeout connexion of users
*it uses the function timeout. It makes the difference between the last connexion date and the new one. (learn more to gestionUser.js)
*if the connexion' user does not reach the timeout limit then it refreshes the last date connexion for the next time
*else the user has to reconnect himself,  
*/
exports.login = function (mail, o, cb){
	var a = "SELECT us_cookie FROM users WHERE us_email=\'"+mail+"\'";
	var c = null;
    db.each(a, function(err, row) {
    	if(err)
    		console.log("erreur login - "+ err);
    	else
        	c = row.us_cookie;
    }, function () {
    	if (!c || c == null){
    		var c = set_cookie(mail);   
    		is_log(c, o, cb);
    	} else
    		is_log(c, o, cb);
    });    
};

/**
*This method tests the validity of the cookie, calling is_timeout function and refresh if false; 
*@param id_cookie (cookie send by the user )
* example : toto_0.2456788999999
*/ 
is_log = function(id_cookie, o, cb){
	var date; 
    var stm = "SELECT us_date FROM users WHERE us_cookie=\'"+ id_cookie + "\'"; 
    db.each(stm, function(err, row) {
    	if(err)
    		console.log("erreur is_log - "+ err);
        date = row.us_date;
    },function () {
    	  	if(us.is_timeout(date)){
	  			var stmt="UPDATE users SET us_date =\'"+ new Date().getTime() +"\' WHERE us_cookie=\'"+id_cookie+"\'";
	  			db.run(stmt);
  				o[cb](true,id_cookie);	
  			} else {
  				o[cb](false,id_cookie);
  			}
    });
};    

/**
*This method is used to set a cookie to an user
*example : cookie = "toto@gmail.com_38565695"
*/
var set_cookie=function(mail){      
	var cookie = mail+"_"+Math.random();
 	var stmt = "UPDATE users SET us_cookie=\'"+ cookie +"\', us_date=\'" + new Date().valueOf()+"\' WHERE us_email=\'" + mail + "\'"; //j'aime pas, faut une callback...
	db.run(stmt);
	return cookie;
};

/**
* This method is used to get a cookie's user
*@param id_cookie   this is what the function set_cookie generate
*it returns the role (that is to say the level of actions' access) of the user 
*/
exports.get_cookie=function(mail, obj, cb){
	var c;
	var a="SELECT us_cookie FROM users WHERE us_email=\'"+mail+"\'";
 	db.each(a, function(err, row) { 
        c = row.us_cookie;
    },  function (){obj [cb](c); }); 
};

/**
*This methode is used to get the role of an user
*@param : email of an user
*It returns the role of the user (his level of rights)
*/
exports.get_role= function(mail, obj, cb){
	var role;
	var a="SELECT us_role FROM users WHERE us_email=\'"+mail+"\'";
 	db.each(a, function(err,row){ 
 		if(err) console.log("Error db_user => get_role" + err)
    	role = row.us_role;
    },  function (){
    	obj[cb](role);
    });
};