// Object holding all questins and answers to display dynamically to page
let answerObj = [
  {
    question: "Which is the largest?",
    answerOptions: [1000, 50, 20, 22],
    correctAnswer: 1000,
  },
  {
    question: "what is 200 / 2",
    answerOptions: ["400", "150", "100"],
    correctAnswer: "100",
  },
  {
    question: "What is 1500 * 1500",
    answerOptions: ["2,250,000", "3000", "1,800,000"],
    correctAnswer: "2,250,000",
  },
  {
    question: "Which is the smallest?",
    answerOptions: ["-1", "-1/2", "0", "3"],
    correctAnswer: "-1",
  },
  {
    question: "Simplify: (4 - 5)-(13 - 18 + 2)",
    answerOptions: ["-1", "-2", "1", "2"],
    correctAnswer: "2",
  },
  {
    question: "Find the Value of 3+ 2 * (8 - 3)",
    answerOptions: ["25", "13", "17", "24"],
    correctAnswer: "13",
  },
];
// keep track of users correct and incorrect answers
let score = [];
//keep track of question user is on
let count = 0;
let correct = 0;

//grab dom elements
let answerSection = document.getElementById("drag-answer-section");
let dragTextId = document.getElementById("dragText");
let questionSection = document.querySelector(".question-section");
let answersContain = document.querySelector(".answer-container");
let submit = document.getElementById("submit");
let answer = document.getElementById("answer-response");

var isMobile = false; //initiate as false
// device detection
if (
  /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
    navigator.userAgent
  ) ||
  /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
    navigator.userAgent.substr(0, 4)
  )
) {
  isMobile = true;
  console.log("mobile quiz");
  mobileVersion();

  // if it is true then add click event for the boxes. When clicked, have that box moved into the answer box. when box in the answer box is clicked then move it to the list of answers container .
}

// drag content functions ---------
function dragstart_handler(e) {
  e.currentTarget.style.backgroundColor = "rgba(255,255,255,.5)";
  e.dataTransfer.setData("text", e.target.id);
}

function dragover_handler(e) {
  e.preventDefault();
}
//   end of drag content function -----

// when content is dropped into containers run this ----

function drop_handler(e) {
  e.preventDefault();
  let dragTextBox;
  let dragText;
  if (e.target.children.length === 1) {
    dragTextBox = e.target.children[0];
    dragText = dragTextBox.id === "dragText";
  }

  // check the section an item is being dropped into. If it is an answer section then regulate how many items can be placed in it ---
  if (
    e.srcElement.className === "answer-container" ||
    (e.srcElement.id === "drag-answer-section" &&
      answerSection.children.length < 2)
  ) {
    answerBoxTextCheck(dragText, dragTextBox);

    // get data from the dragged element
    let draggedData = e.dataTransfer.getData("text");
    e.target.appendChild(document.getElementById(draggedData));
  }
}

function start() {
  let x = document.querySelector(".answer-container");

  let pTag = document.createElement("p");
  pTag.textContent = answerObj[count].question;

  questionSection.appendChild(pTag);
  updateDomScore();
  for (let i = 0; i < answerObj[count].answerOptions.length; i++) {
    let div = document.createElement("div");
    div.setAttribute("class", "answer-box");
    div.setAttribute("id", "a" + i);
    div.setAttribute("ondragstart", "dragstart_handler(event)");
    div.setAttribute("draggable", "true");
    div.setAttribute("data-num", answerObj[count].answerOptions[i]);
    div.setAttribute("data-answerindex", i);
    div.textContent = answerObj[count].answerOptions[i];
    x.appendChild(div);
  }
}
start();
// run functions to make sure the question has been submitted correctly and then check answer to see if it is correct
function runSubmissionCheck() {
  if (checkForInput()) {
    checkAnswer();
  }
}

function checkForInput() {
  if (answerSection.children.length === 1) {
    alert("You must drag an answer to the answer area");
    return false;
  } else if (answerSection.children.length > 1) {
    return true;
  } else {
    console.log("error with checkForInput");
    return false;
  }
}

// gets index of real answer located in an array passed through data attribute and compares it with the value of the dragged box
function checkAnswer() {
  let draggedAnswerData = answerSection.children[1].dataset;
  let index = parseInt(draggedAnswerData.answerindex);
  let answerArea = document.getElementById("drag-answer-section");
  console.log(answerSection);
  console.log(answerSection.children[1].textContent);

  // compare the chosen option with the correct answer
  let result = draggedAnswerData.num == answerObj[count].correctAnswer;

  displayResult(result);
  submit.setAttribute("class", "inactive-btn");

  updateDomScore();
  let record = {
    index: count,
    userAnswer: answerSection.children[1].textContent,
    answeredCorrectly: result,
  };

  //push recorded answer to the score array
  score.push(record);
  count++;

  setTimeout(function () {
    // get html ready for next questions by clearing dom sections

    clearSections(answerArea);

    // check if there are any questions left. If not then end quiz
    answerBoxTextCheck();
    if (count < answerObj.length) {
      start();
    } else {
      quizResults();

      answerArea.innerHTML = "";
    }
  }, 1500);
}

//displays the results of the test at the end
function quizResults() {
  let main = document.querySelector("main");
  answerSection.setAttribute("class", "inactive-btn");
  let correctAnswerObj = checkCorrectAnswers();

  let div = document.createElement("div");
  div.setAttribute("class", "results-box");

  let h1Tag = document.createElement("h1");
  h1Tag.textContent = "Quiz Results";

  let ul = document.createElement("ul");
  let licorrect = document.createElement("li");
  let liincorrect = document.createElement("li");
  let spanCorrect = document.createElement("span");
  let spanIncorrect = document.createElement("span");
  let percentP = document.createElement("p");
  let tryAgainBtn = document.createElement("button");
  let quizDetails = document.createElement("button");

  quizDetails.textContent = "Show Quiz Details";
  quizDetails.setAttribute("id", "quiz-detail-btn");
  tryAgainBtn.textContent = "Try Again";
  tryAgainBtn.setAttribute("id", "try-again-btn");

  percentP.textContent =
    scorePercent(correctAnswerObj.correct, correctAnswerObj.incorrect) + " %";
  licorrect.textContent = "Correct: ";
  liincorrect.textContent = "Incorrect: ";
  spanCorrect.textContent = correctAnswerObj.correct;
  spanIncorrect.textContent = correctAnswerObj.incorrect;

  licorrect.appendChild(spanCorrect);
  liincorrect.appendChild(spanIncorrect);
  ul.appendChild(licorrect);
  ul.appendChild(liincorrect);
  div.appendChild(h1Tag);
  div.appendChild(ul);
  div.appendChild(percentP);
  main.appendChild(div);
  main.appendChild(tryAgainBtn);
  main.appendChild(quizDetails);

  let xxx = quizDetailResults();
  main.appendChild(xxx);
}

function scorePercent(correct, incorrect, total) {
  if (total) {
    let percent = correct / total;
    return (percent * 100).toFixed();
  } else {
    let totalQuestions = correct + incorrect;

    let percent = correct / totalQuestions;

    return (percent * 100).toFixed();
  }
}

function checkCorrectAnswers() {
  let correct = 0;
  let incorrect = 0;
  for (let i = 0; i < score.length; i++) {
    if (score[i].answeredCorrectly) {
      correct++;
    } else {
      incorrect++;
    }
  }

  let answers = {
    correct: correct,
    incorrect: incorrect,
  };
  return answers;
}
function displayResult(result) {
  if (result === true) {
    correct++;
    answer.textContent = "Correct!";
    answer.setAttribute("class", "correct-answer");
  } else if (result === false) {
    answer.textContent = "Incorrect";
    answer.setAttribute("class", "incorrect-answer");
  }
}

function updateDomScore() {
  let score = document.getElementById("question-keeper");
  score.textContent = count + 1 + " / " + answerObj.length;
}

function clearSections(answerArea) {
  questionSection.innerHTML = "";
  answersContain.innerHTML = "";
  answer.setAttribute("class", "inactive-btn");
  answerArea.removeChild(answerArea.lastChild);
}

//checks if answer is in answer box. If it is not they it will display text stating 'Drag Answer Here'
function answerBoxTextCheck(dragText, dragTextBox) {
  if (dragText) {
    dragTextBox.textContent = "";
    submit.setAttribute("class", "active-btn");
  } else {
    dragTextId.textContent = "Drag Answer in Box";
    submit.setAttribute("class", "inactive-btn");
  }
}

//onclick expand the ul
function expandElement() {
  let ulresults = document.getElementById("ul-results");
  bodyHeight = ulresults.scrollHeight;
  ulresults.setAttribute("style", "height:" + bodyHeight + "px;");
}

//display detailed quiz results

function quizDetailResults() {
  console.log(score);
  let ul = document.createElement("ul");
  ul.setAttribute("id", "ul-results");
  score.forEach(function (results) {
    console.log(results.index);
    let li = document.createElement("li");
    let listContain = document.createElement("div");
    listContain.setAttribute("class", "num-result");

    listContain.setAttribute("class", "results-list");
    let correct = document.createElement("i");

    correct.setAttribute("class", "fa fa-check-circle");
    let incorrect = document.createElement("i");

    incorrect.setAttribute("class", "fa fa-times-circle");

    let num = document.createElement("div");
    num.setAttribute("style", "padding:0 10px;");
    let qaContain = document.createElement("div");
    qaContain.setAttribute("class", "qa");
    let question = document.createElement("p");
    question.setAttribute("class", "m-top-zero");
    let answer = document.createElement("p");

    if (results.answeredCorrectly) {
      listContain.appendChild(correct);
    } else {
      listContain.appendChild(incorrect);
    }
    num.textContent = "#" + (results.index + 1);
    question.textContent = "Question: " + answerObj[results.index].question;
    answer.textContent = "Your Answer: " + score[results.index].userAnswer;
    // listContain.appendChild(img);
    listContain.appendChild(num);
    qaContain.appendChild(question);
    qaContain.appendChild(answer);
    listContain.appendChild(qaContain);
    li.appendChild(listContain);
    ul.appendChild(li);
  });
  return ul;
}

document.addEventListener("click", function (e) {
  if (e.target.matches("button") && e.target.id === "try-again-btn") {
    location.reload();
  } else if (e.target.matches("button") && e.target.id === "quiz-detail-btn") {
    console.log("run the quiz details function");
    expandElement();
  }
});

submit.addEventListener("click", function (e) {
  e.preventDefault();
  runSubmissionCheck();
});

//mobile javascript

function mobileVersion() {
  console.log("mobile");
  let a = document.querySelector(".answers");

  //on mobile when clicking an answer
  a.addEventListener("click", function (e) {
    e.preventDefault();
    if (e.target.matches(".answer-box")) {
      mobileAddAnswerBox(e.target);
    }
  });

  //on mobile when clicking an answer in the answer box. Have the answer in the box moved back to the answer container

  answerSection.addEventListener("click", function (e) {
    e.preventDefault();

    if (e.target.matches(".answer-box")) {
      answersContain.append(e.target);
    }
  });
}

function mobileAddAnswerBox(content) {
  if (answerSection.children.length < 2) {
    answerBoxTextCheck(true, answerSection.children[0]);
    answerSection.append(content);
  }
}
