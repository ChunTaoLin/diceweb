//Client based
window.onload = function() {
    getData();//example function call.
}

function setName()
{
  var userName = document.getElementById("inputName").value;
  if(userName!= null)
  {
    document.getElementById("welcome").innerHTML =
    "Hello " + userName + ", Lets get rolling!";
    document.getElementById("name").setAttribute('name',userName);
    document.getElementById("name").innerHTML = userName;
    getOwnScore();
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
  const response = await fetch('/diceRoll',options);
  const diceData = await response.json();
  
  //set local client data with the datapackage received from the server
  document.getElementById("images").setAttribute("src",diceData.img1);
  document.getElementById("images2").setAttribute("src",diceData.img2);
  getOwnScore();
}

//Get leaderboard data, fetch the request and then when returned set entire contents to the
//element under leaderboard
async function getData()
{     
  const response = await fetch('/updateClientScore');
  const data = await response.json();

  //This is way to split the data line by line for adding to leaderboard text.
  var myArray = data.leaderText.split(/\r?\n/);
  if(myArray.length <= 8)//This just visually limits the number of entries to the text
  {
    for (let i = 0; i < myArray.length; i++) {
   
      var para = document.createElement("p");
      var node = document.createTextNode(myArray[i]);
      para.appendChild(node);
      document.getElementById("leaderboard").appendChild(para);
    }
  }

}

//Get own data
async function getOwnScore()
{      
  const name = document.getElementById("name").getAttribute("name");
  const dataPk = {name};
  const options = 
  {
    method: 'POST',        
    headers: {
      'Content-Type' : 'application/json'
    },
    body: JSON.stringify(dataPk),
  }; 
  const response = await fetch('/updateOwnScore',options);
  const data = await response.json();
  document.getElementById("userHS").innerHTML = 'Highscore:'+data.score;
}