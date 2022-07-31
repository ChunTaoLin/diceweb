const { default: fetch } = require("node-fetch");

//Client based
var userName;
var highestScoreSelf;
var currentScoreSelf;

window.onload = function() {
    getData();//example function call.
}

function setName()
{
  userName = document.getElementById("inputName").value;
  if(userName!= null)
  {
    document.getElementById("welcome").innerHTML =
    "Hello " + userName + ", Lets get rolling!";
    document.getElementById("name").setAttribute('name',userName);
    document.getElementById("name").innerHTML = userName;
  }
}

async function rollDice()
{
  //package it as post
  const img1 = document.getElementById("images").getAttribute("src");
  const img2 = document.getElementById("images2").getAttribute("src")
  const name = document.getElementById("name").getAttribute("name");
  console.log("Before pass: "+name);
  const dataPk = {img1,img2,name};
  const options = 
  {
    method: 'POST',        
    headers: {
      'Content-Type' : 'application/json'
    },
    body: JSON.stringify(dataPk),
  };

  //send and receive response
  const response = await fetch('/index.js/rollDice',options);
  const diceData = await response.json();
  
  //set local client data with the datapackage received from the server
  document.getElementById("images").setAttribute("src",diceData.img1);
  document.getElementById("images2").setAttribute("src",diceData.img2);

}

//Get leaderboard data, fetch the request and then when returned set entire contents to the
//element under leaderboard
async function getData()
{     
  const response = await fetch('/updateClientScore');
  const data = await response.json();
  console.log(data.leaderText);
  console.log("split!");
  console.log(data.leaderText.split(/\r?\n/));

  var myArray = data.leaderText.split(/\r?\n/);
  for (let i = 0; i < myArray.length; i++) {
    var para = document.createElement("p");
    var node = document.createTextNode(myArray[i]);
    para.appendChild(node);
    document.getElementById("body").appendChild(para);
  }
 // document.getElementById("leaderboard").innerHTML = data.leaderText.split(/\r?\n/);
}

//Give and send the player/user name, this will be a give and take that will return
// the updated score to client
async function sendData()
{     
  const response = await fetch('/updateClientScore');
  const data = await response.json();
  document.getElementById("leaderboard").innerHTML = data.leaderText;
}