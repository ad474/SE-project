//jshint esversion:6

require('dotenv').config();
const express= require("express");
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
const encrypt = require("mongoose-encryption");
var schedule = require('node-schedule');
const nodemailer= require("nodemailer");

const app= express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://ankita:test987@seproject-19wfq.mongodb.net/SEDB", { useUnifiedTopology: true, useNewUrlParser: true });

// var date = new Date(2019, 10, 26, 20, 36, 0);
 
// var j = schedule.scheduleJob(date, function(){
//   console.log('The world is going to end today.');
// });

const personSchema=new mongoose.Schema({
  username:String,
  password: String,
  name: String,
  email: String
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

const itemSchema={
  name:String
};

const Item= mongoose.model("Item", itemSchema);

const item1=new Item({
  name:"Welcome to your to do list"
});

const item2= new Item({
  name:"Hit the + button to add an item"
});

const item3=new Item({
  name:"<-- Hit this to delete an item"
});

const defaultItems=[item1,item2,item3];

const listSchema={
  name: String,
  items: [itemSchema]
};

const List=mongoose.model("List", listSchema);

const reminderSchema=new mongoose.Schema({
  date: String,
  time: String,
  title: String,
  contents: String,
  username: String
});

const Reminder= mongoose.model("Reminder",reminderSchema);

var em="";

app.get("/", function(req,res){
  //home page
  res.render('index');
});

app.post("/login", function(req,res){
  res.redirect('login');
});

app.get("/login", function(req,res){
  res.render('login',{errorMessage:""});
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
        res.render('login',{errorMessage:"Wrong username/password entered"});
        //res.redirect('login');
      }
      else{
        if(person.password===req.body.password){
          //when match
          console.log(person._id);
          // usname=req.body.username;
          //res.redirect("/"+person._id);
          em=person.email;
          res.redirect("/"+person._id+"/sendreminder");
        }
        else{
          console.log("Wrong password");
          res.render('login',{errorMessage:"Wrong username/password entered"});
        }
      }
    }
  });
});

app.get("/:username/sendreminder",function(req,res){
  Reminder.find({username:req.params.username},function(err,rem){
    if(rem.length===0){
      console.log("bleh");
    }
    else{
      rem.forEach(function(r){
        var dates=r.date.split('/');
        var times=r.time.split(':');
        console.log(dates[2]+" "+dates[1]+" "+dates[0]+" "+times[0]+" "+times[1]);
        var date = new Date(dates[2], dates[1]-1, dates[0], times[0], times[1], 0);
        console.log(date);
        var j = schedule.scheduleJob(date, function(){
          console.log('The world is going to end today.');
          var sendTo="";
          Person.findOne({_id:req.params.username},function(err,res){
            sendTo=res.email;
          });
          sendMail(r);
        });
        
      });
    }
  });
  res.redirect("/"+req.params.username);
});

function sendMail(r){
  console.log("sendTo- "+r);
  let transporter= nodemailer.createTransport({
            service: 'gmail',
            secure: false,
            post:25,
            auth:{
              user:'senzacarta.vaa@gmail.com',
              pass:process.env.PASS
            },
            tls:{
              rejectUnauthorized: false
            }
          });
          //var toSend="This is a test";
          Person.findOne({email:em},function(err,p){
            Reminder.find
          });
          var toSend="Reminder!\nYou have a reminder scheduled for this time.\nEvent name- "+r.title+"\nContents- "+r.contents;
          //var toSend="Hey "+per[0].name+"! OTP for the reset of your password is "+rand+". Have a nice day!";
          
          let helperOptions= {
            from: '"Senza Carta" <senzacarta.vaa@gmail.com',
            to:em,
            subject: 'Reminder',
            text: toSend
          };
          transporter.sendMail(helperOptions, function(err,info){
            if(err){
              console.log(err);
            }
            else{
              console.log("Sent  mail");
              //render the OTP page and send OTP and id
            }
          });
}

app.post("/:username", function(req,res){
  res.redirect("/"+req.params.username);
});

app.get("/:username", function(req,res){
  Person.findOne({_id:req.params.username}, function(err,p){
    if(err){
      console.log(err);
    }
    else{
      res.render('homepage',{id:req.params.username,name:p.name});
    }
  });
  
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

app.post('/:username/todo',function(req,res){
  res.redirect('/'+req.params.username+'/todo');
});

app.get('/:username/todo',function(req,res){
  Item.find(function(err,results){
    if(err){
      console.log(err);
    }
    else{
      if(results.length===0){
        Item.insertMany(defaultItems,function(err){
          if(err){
            console.log(err);
          }
          else{
            console.log("Successfully added default items");
          }
        });
        res.redirect('/'+req.params.username+'/todo');
      }
      else{
        res.render("list", {listTitle: "To do list", newListItems: results , id:req.params.username});
      }
    }
  });
});

app.post("/:username/addtodo", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item=new Item({
    name: itemName
  });

  if(listName==="To do list"){
    item.save();
    res.redirect('/'+req.params.username+'/todo');
  }
  // else{
  //   List.findOne({name: listName},function(err,foundList){
  //     console.log("Before push");
  //     console.log(foundList.items);
  //     foundList.items.push(item);
  //     foundList.save();
  //     console.log("After push");
  //     console.log(foundList.items);
  //     res.redirect("/"+listName);
  //   });
  // }

});

app.post("/:username/delete", function(req,res){
  const checkID=req.body.check;
  const listName=req.body.listName;
  if(listName==="To do list"){
    Item.findByIdAndRemove(checkID,function(err){
      if(err){
        console.log(err);
      }
      else{
        res.redirect('/'+req.params.username+'/todo');
      }
    });
  }
  // else{

  //   List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkID}}},function(err,results){
  //     if(!err){
  //       res.redirect("/"+listName);
  //     }
  //   });
  // }
});

app.post('/:username/reminders',function(req,res){
  res.redirect('/'+req.params.username+'/reminders');
});

app.get('/:username/reminders',function(req,res){
  res.render('reminders',{id:req.params.username});
});

app.post('/:username/reminders/personal-reminders',function(req,res){
  res.redirect('/'+req.params.username+'/reminders/personal-reminders');
});

app.get('/:username/reminders/personal-reminders',function(req,res){
  res.render('preminders',{id:req.params.username});
});

app.post('/:username/reminders/personal-reminders/date',function(req,res){
  //LOGIC FOR DISPLAYING REMINDERS HERE
  var datee=""+req.body.date+"/11/2019";
  Reminder.find({username:req.params.username, date:datee},function(err,entries){
    if(err){
      console.log(err);
    }
    else{
      if(entries.length===0){
        //if no books added yet
        res.render('ppreminder',{id:req.params.username,date:req.body.date,flag:true, flag2:false, entries:[]});
        //res.render('viewentry',{name:req.params.username,flag:true, flag2:false, entries:[]});
      }
      else{
        //if books added already
        res.render('ppreminder',{id:req.params.username,date:req.body.date,flag:false, flag2:true, entries:entries});
        //res.render('viewentry',{name:req.params.username, flag:false, flag2:true, entries:entries});
      }

      //res.render('viewentry',{name:req.params.username});

    }
  });
  //res.render('ppreminder',{id:req.params.username,date:req.body.date});
  // console.log(req.body.reminder-date);
});

app.post('/:username/reminders/personal-reminders/add',function(req,res){
  res.render('addreminder',{date:req.body.date,id:req.params.username});
});

app.post('/:username/reminders/personal-reminders/addreminder',function(req,res){
  const reminder=new Reminder({
    date:req.body.date,
    time:req.body.time,
    title:req.body.title,
    contents:req.body.details,
    username:req.params.username
  });
  console.log(reminder);
  reminder.save();
  res.redirect('/'+req.params.username+'/sendreminderr');
  //res.redirect('/'+req.params.username+'/reminders/personal-reminders');
});

app.get("/:username/sendreminderr",function(req,res){
  Reminder.find({username:req.params.username},function(err,rem){
    if(rem.length===0){
      console.log("bleh");
    }
    else{
      rem.forEach(function(r){
        var dates=r.date.split('/');
        var times=r.time.split(':');
        var date = new Date(dates[2], dates[1]-1, dates[0], times[0], times[1], 0);
        var j = schedule.scheduleJob(date, function(){
          console.log('The world is going to end today. Die');
          var sendTo="";
          Person.findOne({_id:req.params.username},function(err,res){
            sendTo=res.email;
          });
          sendMail(r);
        });
      });
    }
  });
  res.redirect('/'+req.params.username+'/reminders/personal-reminders');
});

app.listen(3000, function(){
  console.log("Listening on port 3000");
});
