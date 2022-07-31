//Server Code
const fs = require('fs');
const readline = require('readline');
const express = require('express');
const { env } = require('process');
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
var playerData;

var highestScore = 0;
var highestScoreUser = "";


const app = express();
const port = process.env.PORT || 80;

module.exports={app};

app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));

//Oopening application
app.listen(port, () => console.log(`Starting Server at ${port}`));


getBucket();

//const dataBase = new dataStore('diceGameDataBase.db');
//dataBase.loadDatabase();


//Send the data from AWS to all clients
//app.get('/', function(req,res){
  //res.sendFile(fileName);
//})

app.get('/updateClientScore',(request,response)=>
{
  console.log('Request to Update clients scores');
  console.log(request.body);
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
  //Some logic to see whats the highest value so far
  if(sum > highestScore)
  {
    console.log("old score: " + highestScore);
    highestScore = sum;
    console.log("new score: " + highestScore);
    
  }
  //package successful, put in the new numbers into a new path set for each variable
  response.json(
  {
    status: 'success',
    img1: "assets/d"+ num+".png",
    img2: "assets/d"+ num2+".png",
  });
});


app.post('/api',(request,response) =>
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
      fs.writeFile(fileName,data.Body+"Server data retreived".toString(), err => {
        if (err) {
          console.error(err);
        }
        
        updateScore();
        // file written successfully
      });
      
    }
 
  });

};

function updateScore()
{
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
        highestScore = array[0];
        highestScoreUser = array[1];
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
      console.log("FIle uploaded success",data.Location);
    }
  });
}