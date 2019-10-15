//jshint esversion:6

const express= require("express");

const app= express();
app.set('view engine', 'ejs');

// app.use(bodyParser.urlencoded({extended:true}));
// app.use(express.static("public"));

app.get("/", function(req,res){
  res.send("Hello World");
});

app.listen(3000, function(){
  console.log("Listening on port 3000");
});
