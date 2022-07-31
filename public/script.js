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
  const img1 = document.getElementById("images");
  const img2 = document.getElementById("images2");
  const dataPk = {img1,img2};
  const options = 
  {
    method: 'POST',        
    headers: {
      'Content-Type' : 'application/json'
    },
    body: JSON.stringify(dataPk),
  };

  //send and receive response
  const response = await fetch('/diceRoll',options);
  const diceData = await response.json();

  //set local client data with the datapackage received from the server
  document.getElementById("images").setAttribute("src",diceData.img1);
  document.getElementById("images2").setAttribute("src",diceData.img2);

}

async function getData()
{     
  console.log("Tyring to get data");

  const response = await fetch('/updateClientScore');
  const data = await response.json();
  document.getElementById("leaderboard").innerHTML = data.leaderText;
}