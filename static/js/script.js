// ✅ Ensure variables are declared only once
if (typeof bookingStep === "undefined") {
    var bookingStep = 0;
    var bookingData = {};
}

// ✅ Disease List (10 major diseases with 3 clinics each)
if (typeof diseases === "undefined") {
    var diseases = {
        "Fever": ["City Hospital", "Apollo Clinic", "Green Life"],
        "Diabetes": ["Sunrise Clinic", "Sugar Care Center", "Metro Health"],
        "Hypertension": ["Carewell Hospital", "BP Wellness", "MediCare"],
        "Migraine": ["Neurology Care", "Headache Relief Clinic", "NeuroMed"],
        "Eye Infection": ["Vision Hospital", "Eye Care Center", "Ophthalmic Plus"],
        "Skin Allergy": ["DermaLife", "Skin Solutions", "Healthy Skin Clinic"],
        "Thyroid": ["Hormone Wellness", "Endocrine Care", "Thyroid Cure"],
        "Arthritis": ["Joint Relief Center", "Ortho Life", "Bone & Joint Care"],
        "Asthma": ["Lung Health", "Breathe Easy", "Pulmonology Plus"],
        "Dental Pain": ["Smile Dental", "Tooth Care Clinic", "Oral Health Center"]
    };
}

// ✅ Toggle Menu (☰)
function toggleMenu() {
    const menu = document.getElementById("menu-items");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// ✅ Toggle Chatbot (💬)
function toggleChatbot() {
    const chatbotContainer = document.getElementById("chatbot-container");
    chatbotContainer.style.display = chatbotContainer.style.display === "none" ? "block" : "none";

    if (chatbotContainer.style.display === "block") {
        showInitialOptions();
    }
}

function startBooking() {
    bookingStep = 1;
    bookingData = { option: "Book Appointment" };
    appendMessage("Chatbot", "What is your name?");
}


// ✅ Show Initial Options (Booking & Disease Info)
function showInitialOptions() {
    appendMessage("Chatbot", "Hello! What do you want to do?");
    appendMessage("Chatbot", `
        <button class="btn btn-sm btn-primary m-1" onclick="startBooking()">📅 Book Appointment</button>
        <button class="btn btn-sm btn-info m-1" onclick="startDiseaseLookup()">🔍 Know About Diseases</button>
    `);
}




// ✅ Function to Send Message
function sendMessage() {
    const inputField = document.getElementById("chat-input");
    const userMessage = inputField.value.trim();
    if (userMessage === "") return;

    appendMessage("You", userMessage);

    if (bookingStep > 0) {
        handleBookingResponse(userMessage);
    } else if (bookingStep === -1) {
        handleDiseaseResponse(userMessage);
    } else {
        appendMessage("Chatbot", "Please select an option first.");
    }

    inputField.value = "";
}



// ✅ Function to Handle Booking Flow
function handleBookingResponse(userInput) {
    if (bookingStep === 1) {
        if (userInput.length < 3) {
            appendMessage("Chatbot", "❌ Name must be at least 3 letters. Try again.");
            return;
        }
        bookingData.name = userInput;
        appendMessage("Chatbot", "What is your email?");
        bookingStep = 2;
    } else if (bookingStep === 2) {
        if (!userInput.includes("@") || !userInput.includes(".")) {
            appendMessage("Chatbot", "❌ Enter a valid email.");
            return;
        }
        bookingData.email = userInput;
        appendMessage("Chatbot", "What disease do you need an appointment for?");
        showDiseaseOptions();
        bookingStep = 3;
    } else if (bookingStep === 3) {
        if (diseases[userInput]) {
            bookingData.disease = userInput;
            showClinicOptions(userInput);
            bookingStep = 4;
        } else {
            bookingData.disease = userInput;
            appendMessage("Chatbot", "Please enter your preferred clinic location.");
            bookingStep = 4;
        }
    } else if (bookingStep === 4) {
        bookingData.clinic = userInput;
        appendMessage("Chatbot", "What date do you prefer? (e.g., tmrw, next week, YYYY-MM-DD)");
        bookingStep = 5;
    } else if (bookingStep === 5) {
        bookingData.date = convertToDate(userInput);
        appendMessage("Chatbot", "Select a time slot:");
        showTimeOptions();  // 🔴 Error Happens Here
        bookingStep = 6;
    }
    
        else if (bookingStep === 6) {
        bookingData.time = userInput;
        completeBooking();
    }
}
function showTimeOptions() {
    let times = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "06:00 PM", "07:00 PM"];
    let buttons = times.map(time => 
        `<button class="btn btn-sm btn-success m-1" onclick="handleBookingResponse('${time}')">${time}</button>`
    ).join("");

    // Check if chat container exists
    const chatContainer = document.getElementById("chat-messages");
    if (!chatContainer) {
        console.error("Chat container not found.");
        return;
    }

    appendMessage("Chatbot", `Select a time slot:<br> ${buttons}`);
}


// Function to Convert NLP Dates (e.g., "tmrw", "next week") to YYYY-MM-DD Format
function convertToDate(userInput) {
    let today = new Date();
    let newDate;

    if (userInput.toLowerCase() === "tmrw") {
        newDate = new Date(today);
        newDate.setDate(today.getDate() + 1);
    } else if (userInput.toLowerCase().includes("next week")) {
        newDate = new Date(today);
        newDate.setDate(today.getDate() + 7);
    } else if (userInput.toLowerCase().includes("next next day")) {
        newDate = new Date(today);
        newDate.setDate(today.getDate() + 2);
    } else if (userInput.toLowerCase().includes("yesterday")) {
        newDate = new Date(today);
        newDate.setDate(today.getDate() - 1);
    } else {
        newDate = new Date(userInput);
    }

    return newDate.toISOString().split("T")[0];  // Returns date in YYYY-MM-DD format
}

function showAppointmentModal() {
    let modalElement = document.getElementById('appointmentModal');

    if (modalElement) {
        let modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',  // Prevent closing by clicking outside
            keyboard: false      // Prevent closing with keyboard
        });
        modal.show();
    } else {
        console.error("❌ Error: Modal element not found in HTML.");
    }
}

function completeBooking() {
    console.log("Sending data to Flask:", bookingData);

    fetch("/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(bookingData),
    })
    .then(response => response.json())
    .then(data => {
        appendMessage("Chatbot", `✅ Appointment confirmed!`);
        showAppointmentModal();  // 🔴 Error Happens Here
        showInitialOptions();
    })
    .catch(error => {
        console.error("Error:", error);
        appendMessage("Chatbot", "⚠️ Error booking appointment. Try again.");
    });

    bookingStep = 0;
}


// ✅ Show Disease Options
function showDiseaseOptions() {
    let buttons = Object.keys(diseases).map(disease => 
        `<button class="btn btn-sm btn-info m-1" onclick="handleBookingResponse('${disease}')">${disease}</button>`
    ).join("");
    appendMessage("Chatbot", buttons);
}

// ✅ Show Clinic Options Based on Disease
function showClinicOptions(disease) {
    let buttons = diseases[disease].map(clinic => 
        `<button class="btn btn-sm btn-warning m-1" onclick="handleBookingResponse('${clinic}')">${clinic}</button>`
    ).join("");
    appendMessage("Chatbot", `Select a clinic for ${disease}: <br>` + buttons);
}

// ✅ Append Messages to Chat Window
function appendMessage(sender, message) {
    const chatMessages = document.getElementById("chat-messages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", sender === "You" ? "user-message" : "bot-message");

    messageElement.innerHTML = `<div class="chat-bubble">${message}</div>`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ✅ Start Disease Lookup when clicking "Know About Diseases"
function startDiseaseLookup() {
    appendMessage("Chatbot", "Please enter the disease name.");
    bookingStep = -1;  // Set step to handle disease lookup
}

// ✅ Handle Disease Query and Fetch from Flask API
function handleDiseaseResponse(userInput) {
    let diseaseData = {
        option: "Know About Diseases",
        disease_query: userInput
    };

    console.log("Sending disease query to Flask:", diseaseData);

    fetch("/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(diseaseData),
    })
    .then(response => response.json())
    .then(data => {
        appendMessage("Chatbot", `🩺 <b>Disease Info for ${userInput}:</b><br>${data.response}`);
        showInitialOptions();  // Return to main menu after response
    })
    .catch(error => {
        console.error("Error fetching disease info:", error);
        appendMessage("Chatbot", "⚠️ Error retrieving disease details. Try again.");
    });
}


function handleUserMessage() {
    const inputField = document.getElementById("chat-input");
    const userMessage = inputField.value.trim();
    const chatContainer = document.getElementById("chat-messages");

    if (!userMessage) return;

    // Display user message
    let userMsgDiv = document.createElement("div");
    userMsgDiv.classList.add("chat-message", "user-message");
    userMsgDiv.innerHTML = userMessage;
    chatContainer.appendChild(userMsgDiv);

    // Check if user was asked for a disease name
    if (sessionStorage.getItem("awaitingDiseaseInput") === "true") {
        sessionStorage.removeItem("awaitingDiseaseInput"); // Reset flag
        fetchDiseaseDetails(userMessage);
    } else {
        // Handle other chatbot messages
        let botReply = document.createElement("div");
        botReply.classList.add("chat-message", "bot-message");
        botReply.innerHTML = "I'm not sure how to respond to that.";
        chatContainer.appendChild(botReply);
    }

    inputField.value = ""; // Clear input field
}

function fetchDiseaseDetails(disease) {
    fetch(`/get_disease_info?disease=${encodeURIComponent(disease)}`)
        .then(response => response.json())
        .then(data => {
            const chatContainer = document.getElementById("chat-messages");
            let botMessage = document.createElement("div");
            botMessage.classList.add("chat-message", "bot-message");
            botMessage.innerHTML = `<strong>${data.name}</strong><br>
                <b>Symptoms:</b> ${data.symptoms}<br>
                <b>Causes:</b> ${data.causes}<br>
                <b>Treatment:</b> ${data.treatment}`;
            chatContainer.appendChild(botMessage);
        })
        .catch(error => {
            console.error("Error fetching disease info:", error);
        });
}
