const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const pendingCounter = document.getElementById("pending-counter");
const overdueCounter = document.getElementById("overdue-counter");
const completedCounter = document.getElementById("completed-counter");

function addTask() {
    const taskName = inputBox.value.trim(); // Removes leading and trailing whitespace from input value
    const deadlineInput = document.getElementById("deadline");
    const deadline = new Date(deadlineInput.value);
    const timeLeft = timeLeftForDeadline(deadline);

    if (deadlineInput.value === '') {
        alert("Please enter a deadline!");
        return;
    } else if (taskName === '') {
        alert("Write something!");
        return;
    } else if (deadline < new Date()) {
        alert("Deadline should be a future date!");
        return;
    }

    // Check if the task name already exists
    const existingTasks = listContainer.querySelectorAll("li");
    for (let i = 0; i < existingTasks.length; i++) {
        const existingTaskName = existingTasks[i].textContent.trim();
        if (existingTaskName === taskName) {
            if (confirm("This task is already added. Do you want to add it again?")) {
                // If user confirms, proceed with adding the task again
                break;
            } else {
                // If user cancels, stop adding the task
                return;
            }
        }
    }

    // Create list item element
    let li = document.createElement("li");

    // Create deadline span element
    let deadlineSpan = document.createElement("span");
    deadlineSpan.className = "deadline";
    deadlineSpan.dataset.deadline = deadline.toISOString(); // Store deadline value as ISO string
    deadlineSpan.textContent = `${timeLeft.days} day(s), ${timeLeft.hours} hour(s), ${timeLeft.minutes} minute(s), ${timeLeft.seconds} second(s)`;

    // Append task name and deadline elements to list item
    li.textContent = taskName;
    li.appendChild(deadlineSpan);

    // Create remove span element
    let remove = document.createElement("span");
    remove.className = "remove";
    remove.textContent = "\u00d7"; // Cross icon

    // Append remove span element to list item
    li.appendChild(remove);

    // Append list item to list container
    listContainer.appendChild(li);

    // Update counters
    updateCounters();

    // Clear input fields
    inputBox.value = "";
    deadlineInput.value = "";

    // Save data
    saveData();
}


function timeLeftForDeadline(deadline) {
    const now = new Date();
    let timeDifference = deadline - now;

    // If the deadline has passed, return all zeros
    if (timeDifference <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
    }

    // Time calculations for days, hours, minutes and seconds
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    timeDifference -= days * 1000 * 60 * 60 * 24;

    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    timeDifference -= hours * 1000 * 60 * 60;

    const minutes = Math.floor(timeDifference / (1000 * 60));
    timeDifference -= minutes * 1000 * 60;

    const seconds = Math.floor(timeDifference / 1000);

    return {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

function updateCounters() {
    const pendingTasks = document.querySelectorAll("#list-container li:not(.checked)").length;
    const completedTasks = document.querySelectorAll("#list-container li.checked").length;
    pendingCounter.textContent = pendingTasks;
    completedCounter.textContent = completedTasks;

    const tasks = document.querySelectorAll("#list-container li");
    let zeroTimeLeftTasks = 0;
    tasks.forEach(task => {
        const deadlineElement = task.querySelector('.deadline');
        const timeLeft = timeLeftForDeadline(new Date(deadlineElement.dataset.deadline));
        if (!task.classList.contains('checked') && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds <= 0) {
            zeroTimeLeftTasks++;
        }
    });

    overdueCounter.textContent = zeroTimeLeftTasks;
}

//Below function is created to enter data by pressing the button enter
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        addTask();
    }

}

//Below eventlistener is to listen for the handleKeyPress function
inputBox.addEventListener('keypress', handleKeyPress);

//this event listener on clicking on li makes its class name checked or unchecked
//if clicked on the delete icon which is a span tag it removes it

const handleCheck =  (e) => {

    if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked");
        e.target.querySelector(".deadline").dataset.checked = "";
        updateCounters();
        saveData();



        if (e.target.classList.contains('checked')) {
            e.target.querySelector(".deadline").dataset.checked = new Date().toISOString();

        }

    }

    else if (e.target.className === "remove") {
        e.target.parentElement.remove();
        updateCounters();
        saveData();
    }
}

listContainer.addEventListener("click", handleCheck, false);

// Function to initialize the interval to update deadlines
function updateDeadlinesInterval() {
    // Update deadlines initially
    updateDeadlines();

    // Update deadlines every second
    setInterval(updateDeadlines, 1000);
}


updateDeadlines();

// Function to update deadlines
function updateDeadlines() {
    const tasks = document.querySelectorAll("#list-container li");

    tasks.forEach(task => {
        const deadlineElement = task.querySelector('.deadline');
        let deadline = new Date(deadlineElement.dataset.deadline);

        if(deadlineElement.dataset.checked) {
            deadline = new Date(deadlineElement.dataset.checked);
        } 

        saveData();

        const timeLeft = timeLeftForDeadline(deadline);

        // Create a text node with the formatted deadline text
        const deadlineText = document.createTextNode(` ${timeLeft.days} day(s), ${timeLeft.hours} hour(s), ${timeLeft.minutes} minute(s), ${timeLeft.seconds} second(s)`);

        // Clear existing content
        deadlineElement.innerHTML = '';

        // Append the text node to the deadline element
        deadlineElement.appendChild(deadlineText);

        if (timeLeft.days === 0 && timeLeft.hours === 1 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
            // Send browser notification
            if (Notification.permission === "granted") {
                new Notification("Deadline Alert", {
                    body: "You have 1 hour to finish your task!"
                });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification("Deadline Alert", {
                            body: "You have 1 hour to finish your task!"
                        });
                    }
                });
            }
        }
        if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds <= 0) {
            deadlineElement.classList.remove('urgent-deadline');
        } else if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 60) {
            deadlineElement.classList.add('urgent-deadline');
        } else {
            deadlineElement.classList.remove('urgent-deadline');
        }
        updateCounters();
    });
   
}

// Call the function to update deadlines
updateDeadlinesInterval();

//saveData function stores the data in local storage of the browser
function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask() {
    listContainer.innerHTML = localStorage.getItem("data");
}

// Function to add emoji to the day
function addEmojiToDay(day) {
    if (day === 'Monday') {
        return "\u{1F612}";
    } else if (day === 'Tuesday') {
        return "\u{1F62C}"; 
    } else if (day === 'Wednesday') {
        return "\u{1F610}"; 
    } else if (day === 'Thursday') {
        return "\u{1F60C}"; 
    } else if (day === 'Friday') {
        return "\u{1F604}"; 
    } else if (day === 'Saturday') {
        return "\u{1F61B}"; 
    } else if (day === 'Sunday') {
        return "\u{1F634}"; 
    } else {
        return '';
    }
}

// Function to get the current day
function getCurrentDay() {
    const now = new Date(); //Date() object generates both time and date
    const dayIndex = now.getDay(); //getDay is a method of Date object to retrieve the day of the week as a number, taking the current date from now variable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

// Function to update the title with the current day and emoji
function updateTitleWithDayAndEmoji() {
    const day = getCurrentDay(); //stores the current date in day variable
    const emoji = addEmojiToDay(day); //stores the corresponding emoji according to day in emoji variable
    const titleElement = document.querySelector(".to-do-section h2");
    titleElement.innerHTML = titleElement.innerHTML + " -&nbsp Happy " + day + " " + emoji; //concatanating the current h2 contents with day and emoji
}

// Call the function to update the title
updateTitleWithDayAndEmoji();

showTask();

updateCounters();