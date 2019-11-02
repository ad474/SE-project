//jshint esversion:6

require('dotenv').config();
const express= require("express");
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
const encrypt = require("mongoose-encryption");

const app= express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/SEDB", { useUnifiedTopology: true, useNewUrlParser: true });

const personSchema=new mongoose.Schema({
  username:String,
  password: String,
  name: String
});

personSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const Person= mongoose.model("Person",personSchema);

const entrySchema=new mongoose.Schema({
  year: String,
  month: String,
  date: String,
  time: String,
  title: String,
  contents: String,
  username: String
});

const Entry= mongoose.model("Entry",entrySchema);

app.get("/", function(req,res){
  //home page
  res.render('index');
});

app.post("/login", function(req,res){
  res.redirect('login');
});

app.get("/login", function(req,res){
  res.render('login');
});

app.post("/register",function(req,res){
  res.render('register');
});

app.post("/newreg",function(req,res){
  const person=new Person({
    username: req.body.username,
    password: req.body.password,
    name: req.body.name,
    email: req.body.email
  });
  Person.find({username:req.body.username},function(err,persons){
    if(err){
      console.log(err);
    }
    else{
      if(persons.length===0){
        person.save();
        console.log("Registered a new person");
        res.redirect('/login');
      }
      else{
        //error if cant register a member
        res.send("Error");
      }
    }
  });
});

app.post("/checkmail", function(req,res){
  Person.findOne({username:req.body.username}, function(err,person){
    if(err){
      console.log(err);
    }
    else{
      if(person===null){
        //wrong username
        console.log("Wrong email");
        res.redirect('login');
      }
      else{
        if(person.password===req.body.password){
          //when match
          usname=req.body.username;
          res.redirect("/"+req.body.username);
        }
        else{
          console.log("Wrong password");
          res.render('login');
        }
      }
    }
  });
});

app.post("/:username", function(req,res){
  res.redirect("/"+req.params.username);
});

app.get("/:username", function(req,res){
  res.render('homepage',{name:req.params.username});
});

app.post("/:username/diaryentry",function(req,res){
  res.redirect("/"+req.params.username+"/diaryentry");
});

//diary entry page here
app.get("/:username/diaryentry",function(req,res){
    Entry.find({username:req.params.username},function(err,entries){
    if(err){
      console.log(err);
    }
    else{
      if(entries.length===0){
        //if no books added yet
        res.render('viewentry',{name:req.params.username,flag:true, flag2:false, entries:[]});
      }
      else{
        //if books added already
        res.render('viewentry',{name:req.params.username, flag:false, flag2:true, entries:entries});
      }

      //res.render('viewentry',{name:req.params.username});

    }
  });
});

app.post('/:username/addentry',function(req,res){
  res.render('addentry',{name:req.params.username});
});

app.post('/:username/addthisentry',function(req,res){
  // year: String,
  // month: String,
  // date: String,
  // time: String,
  // title: String,
  // contents: String,
  // username: String
  const entry=new Entry({
    year:req.body.date.slice(0,4),
    month:req.body.date.slice(5,7),
    date:req.body.date.slice(8,10),
    time:req.body.time,
    title:req.body.title,
    contents:req.body.contents,
    username:req.params.username
  });
  entry.save();
  res.redirect('/'+req.params.username+'/diaryentry');
});

app.listen(3000, function(){
  console.log("Listening on port 3000");
});
