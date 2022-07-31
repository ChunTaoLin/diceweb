//Server Code
const fs = require('fs');
const readline = require('readline');
const express = require('express');
const { env } = require('process');
const replace = require('replace-in-file');//node package found https://www.npmjs.com/package/replace-in-file
const dataStore = require('nedb');
const os = require ('os');

require('dotenv').config();

//Amazon web services
const AWS = require('aws-sdk');
const KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY_ID;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const fileName = "playerScores.txt";
const s3 = new AWS.S3({
  accessKeyId: KEY_ID,
  secretAccessKey: SECRET_KEY,
});


//Other variables and such
var highestScore = 0;
var highestScoreUser = "";

//const database = new dataStore('scoreboard.db');
//database.loadDatabase();//load any existing data
//database.insert({user: 'TEST',highscore: '5'})
const app = express();
const port = process.env.PORT || 80;

app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));

//Oopening application
app.listen(port, () => console.log(`Starting Server at ${port}`));
//retrieve the playerscore that is on the AWS S3 bucket.
getBucket();

app.get('/updateClientScore',(request,response)=>
{
  console.log('Request to Update clients scores');
 
  fs.readFile(fileName, 'utf8', (err, data) => 
  {
    if(err)
    {
      console.error(err);
      return;
    }
    console.log('sending data');
    response.json(
      {
        status: 'success',
        leaderText: data
      });
  }); 
});

app.post('/diceRoll',(request,response) =>
{
  console.log('Request to Roll');
  console.log(request.body);

  //Get new numbers
  var num = Math.floor(Math.random() * 6 )+ 1
  var num2 = Math.floor(Math.random() * 6 )+ 1
  var sum = num + num2;

  console.log("Name:" + request.body.name);
  updateScoreForClient(sum,request.body.name);
 
  //package successful, put in the new numbers into a new path set for each variable
  response.json(
  {
    status: 'success',
    img1: "assets/d"+ num+".png",
    img2: "assets/d"+ num2+".png",
    name: request.body.name
  });
});


app.post('/sendData',(request,response) =>
{
  console.log('Request Found');

  const data = request.body;
  const timestamp = Date.now();

  data.timestamp = timestamp;

  dataBase.insert(data);

  response.json(
  {
    status: 'success',
    timestamp: data.timestamp,
    latitude: data.lat,
    longitude: data.lon
  });
  //res.send('POST request to the homepage')
});


function getBucket(){

  console.log('attempt get');
  var params = 
  {
    Bucket: 'dice-game-bucket', 
    Key:'playerScores.txt',
  
  };
  s3.getObject(params,(err,data) =>
  {
    if(err) 
    {  
      console.log("get error");
      console.log(err,err.stack);
    }
    else 
    { 
      console.log("got data");
  
      if(data.Body != "")
      {
        fs.writeFile(fileName,data.Body.toString(), err => 
        {
          if (err) 
          {
            console.error(err);
          }
          
          updateScoreFromFile();
          // file written successfully
        });
       
      }
     
      
    }
 
  });

};
function updateScoreForClient(newScore,user)
{

    console.log("UPDATE SCORE for " +user);

    //This allows me to create the interface to read stream the file
    var lineReader = require('readline').createInterface({
      input: fs.createReadStream(fileName)
    });

    //Line by line split the contents and then see if the new coming user+score is better
    //Then whats on record.
    lineReader.on('line', function (line) 
    {
      var array = line.split(':');
      //if the first part of the string array(name) matches the user continue
      if(array[0] == user)
      {//if the new score is greater than the current
        if(newScore > array[1])
        {
          const options = {
            files: fileName,
            from: line,
            to: user+':'+newScore,
          };
          replace(options).then(results => {
            console.log('New Score for ' + user + ':', results);
          }).catch(error => {
            console.error('Error occurred while setting score:', error);
          });
          return;
        }
        
      }

    });

  //by this point no entry of user was found so we add one;
  fs.appendFileSync(fileName,'\r\n');
  fs.appendFileSync(fileName,user+':'+newScore);


  //see if record is broken!
  if(newScore > highestScore)
  {
    highestScore = newScore;
    highestScoreUser = user;
  }

 //uploadFile(fileName);
}
function updateScoreFromFile()
{
  console.log("UPDATE SCORE");
  //This allows me to create the interface to read stream the file
  var lineReader = require('readline').createInterface({
      input: fs.createReadStream(fileName)
  });

  //Line by line split the contents and then see if the new coming user+score is better
  //Then whats on record.
  lineReader.on('line', function (line) {
      var array = line.split(':');
      if(array[1] > highestScore)
      {
        highestScore = array[1];
        highestScoreUser = array[0];
      }
      console.log('Number: ' + highestScore);
      console.log('User: ' + highestScoreUser);
  });
}
function uploadFile (fileName)
{ 
  console.log('attempt upload');
  const fileContent = fs.readFileSync(fileName);
  var params = 
  {
    Bucket: 'dice-game-bucket', 
    Key:'playerScores.txt',
    Body: fileContent,
    ContentType: "text/txt"
  };

  s3.upload(params,(err,data)=>{
    if(err){
      console.log("upload error");
      console.log(err);
    }
    else{
      console.log("File uploaded success",data.Location);
    }
  });
}