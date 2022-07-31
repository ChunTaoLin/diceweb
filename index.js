//Server Code
const fs = require('fs');
const readline = require('readline');
const express = require('express');
const { env } = require('process');
const replace = require('replace-in-file');//node package found https://www.npmjs.com/package/replace-in-file
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
        
          // file written successfully
        });
       
      }
     
      
    }
 
  });

};

function updateScoreForClient(newScore,user)
{

 
  checkForDuplicates(newScore,user);

  //see if record is broken!
  if(newScore > highestScore)
  {
    highestScore = newScore;
    highestScoreUser = user;
  }
}
function uploadFile (fileName)
{ 

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

async function checkForDuplicates(newScore,user) {

  const fileStream = fs.createReadStream(fileName);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) 
  {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
    var array = line.split(':');
    //if the first part of the string array(name) matches the user continue
  
    if(array[0].toString() == user)
    {//if the new score is greater than the current
      console.log("same user found" + array[0].toString());
      if(newScore > array[1])
      {
        const options = {
          files: fileName,
          from: line,
          to: user+':'+newScore,
        };
        replace(options).then(results => {
          console.log('New Score for ' + user + ':', results);
          uploadFile(fileName);  
        }).catch(error => {
          console.error('Error occurred while setting score:', error);
        });
        
      }
      return;
    }

  }
    console.log("new user found");
    //by this point no entry of user was found so we add one;
    fs.appendFileSync(fileName,'\r\n');
    fs.appendFileSync(fileName,user+':'+newScore);
    uploadFile(fileName);
}
 
