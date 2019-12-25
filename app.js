const correctAnswers = ["B", "B", "B", "B"];
const form = document.querySelector(".quiz-form");
const result = document.querySelector(".result");

// AE data storage

const contractSource = `
// namespace Questions = 
//     // let total  = 0
//     function getTotalUsers(total : int)  = 
//         total += 1
payable contract Quiz = 

// Declaring types
    type i =  int
    type s = string
    type a =  address
    type b = bool

// Record to store a user
    record user = {
        id : i,
        owner : a,
        name : s,
        email : s,
        score : i,
        password : s,
        takenCourse : b}

    record state = {
        // Mapping users to an int
        usersById : map(i,user),

        // mapping users to a string
        usersByName : map(s,user),
        
        // total amount of users
        total : i}



    entrypoint init() ={usersById = {}, usersByName = {}, total =0}


    // returns total number of users
    entrypoint getTotalUsers() =
        state.total

    // Register to take the quiz
    stateful entrypoint addUser(_name,_email,_password) =
    

        let newUser = {
            owner = Call.caller,
            id = getTotalUsers()+1, 
            name = _name,
            email = _email,
            password = _password,
            score  = 0 ,
            takenCourse = false}


        let index = getTotalUsers() + 1

        let owner = Call.caller
        put(state{usersById[index] = newUser, usersByName[_name] = newUser, total = index})

    // Get a user by id
    entrypoint getUser(id : i) =
        switch(Map.lookup(id, state.usersById))
            None => abort("invalid username or password")
            Some(x) => x

    // get a user by Name
    entrypoint getUserByName(userName : s) =
        switch(Map.lookup(userName, state.usersByName))
            None => abort("invalid user")
            Some(x) => x


    // Update the users score
    stateful entrypoint updateScore( index : i, _score : i) =
        
        let user = getUser(index)
        let name = user.name
        let score = user.score
        require(score == 0, "Score has already been updated")
        
        require(!user.takenCourse  == false , "You cannot take course more that once" )
        put(state{usersById[index].score = _score, usersByName[name].score = _score })


    // Allows users to take the quiz
    stateful entrypoint takeCourse(index : i) =
        
        let user = getUser(index)
        require(user.takenCourse  == false, "You cannot take course more that once" )
        let name = user.name
       
        let userAddress = Call.caller

        put(state{usersById[index].takenCourse = true , usersByName[name].takenCourse = true})




          `;

const contractAddress = "ct_2ohLCriK9g89RLGaEusWbfEsfCq7oYJVLayu3GvhkyAhmPAKH3";


var client = null;

async function callStatic(func, args) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract
    .call(func, args, {
      callStatic: true
    })
    .catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract
    .call(func, args, {
      amount: value
    })
    .catch(e => console.error(e));

  return calledSet;
}

window.addEventListener("load", async () => {
  
  $('#loader').fadeIn()
  client = await Ae.Aepp();
  

  $("#root").fadeOut();
  $("#register").fadeIn();
  $('#loader').fadeOut()
});

$("#submitButton").click(async () => {
  $('#loader').fadeIn()
  const name = $("#name").val();
  const mail = $("#mail").val();
  const password = $("#verifyPassword").val();
  console.log(name);
  console.log(mail);

  console.log("Button Clicked");
  console.log(password);
  await contractCall("addUser", [name, mail, password], 0)
  

  console.log("Added successsfully");
 
  const id = await callStatic('getTotalUsers', []);
  console.log(id)
  await contractCall("takeCourse", [id], 0)

  $("#register").fadeOut();
  $('#loader').fadeOut()
  $("#root").fadeIn();
});

form.addEventListener("submit", async e => {
  e.preventDefault();

  $('#loader').fadeIn()

  let score = 0;
  const userAnswers = [
    form.q1.value,
    form.q2.value,
    form.q3.value,
    form.q4.value
  ];

  // check the answers
  userAnswers.forEach((answer, index) => {
    if (answer === correctAnswers[index]) {
      score += 25;
    }
  });

  // show the result
  scrollTo(0, 0);
  result.classList.remove("d-none");

  let output = 0;
  const timer = setInterval(() => {
    result.querySelector("span").textContent = `${output}%`;
    if (output === score) {
      clearInterval(timer);
    } else {
      output++;
    }
  }, 10);

  
  $("#Questions").fadeOut();

  const id = await callStatic('getTotalUsers', []);
  console.log(id);
  await contractCall("updateScore", [id, score], 0);
  console.log("score updated successfully");
  $('#loader').fadeOut()

});
