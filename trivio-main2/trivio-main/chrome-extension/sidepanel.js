let question_bank = [];
let timestamps = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📥 Sidepanel received message:", request);

    const handleMessage = async () => {
        try {
            if (request.type === "getQuestions") {
                console.log("🌐 Fetching questions for video:", request.video_url);

                await send_get_question_request(request.video_url);

                timestamps = question_bank.map(q => q.timestamp);
                console.log("📊 Extracted timestamps in sidepanel.js:", timestamps);

                return { success: true, timestamp: timestamps };
            }

            if (request.type === "displayQuestion") {
                console.log("🎬 Displaying question at index:", request.idx);
                await display_question(request.idx);
                return { success: true };
            }

            console.warn("❓ Unknown message type in sidepanel.js:", request.type);
            return { success: false, error: "Unknown message type" };
        } catch (error) {
            console.error("❌ Error handling message in sidepanel.js:", error);
            return { success: false, error: error.message };
        }
    };

    Promise.resolve(handleMessage()).then(sendResponse);
    return true;
});

async function send_get_question_request(video_url) {
    const url = "http://127.0.0.1:5000/questions";

    console.log("🌐 Sending request to Flask backend...");
    console.log("🔗 Video URL being sent to Flask:", video_url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "link": video_url,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        question_bank = data;

        console.log("✅ Questions received from Flask in sidepanel.js:", question_bank);

        timestamps = question_bank.map(q => q.timestamp);
        console.log("📊 Extracted timestamps after fetch:", timestamps);

        return question_bank;
    } catch (error) {
        console.error("❌ Error fetching questions from Flask:", error);
        throw error;
    }
}

async function display_question(idx) {
    if (!question_bank[idx]) {
        console.warn(`⚠️ No question found at index ${idx} in sidepanel.js`);
        return;
    }

    console.log("📝 Displaying question in sidepanel.js:", question_bank[idx]);
    document.getElementById("question").textContent = question_bank[idx].question;

    populate_options_and_check_answer(idx);
}

function populate_options_and_check_answer(idx) {
    const options = ['answer-a', 'answer-b', 'answer-c', 'answer-d'];
    const continueButton = document.getElementById('continue');

    if (continueButton.style.display === "block") {
        return;
    }

    options.forEach((entry, i) => {
        const element = document.getElementById(entry);
        element.style.display = "block";
        element.textContent = question_bank[idx].answers[i];

        element.onclick = () => handleAnswerClick(element, idx, options, continueButton);
    });
}

function handleAnswerClick(element, idx, options, continueButton) {
    console.log(`🟢 User clicked: ${element.textContent}`);

    if (question_bank[idx].correct_answer === element.textContent) {
        console.log("✅ Correct answer selected!");
        element.style.backgroundColor = "green";
        continueButton.style.display = "block";

        continueButton.onclick = () => resetForNextQuestion(options, continueButton);
    } else {
        console.log("❌ Incorrect answer selected.");
        element.style.backgroundColor = "red";
    }

    options.forEach(option => {
        if (document.getElementById(option) !== element) {
            document.getElementById(option).style.backgroundColor = null;
        }
    });
}

function resetForNextQuestion(options, continueButton) {
    console.log("⏭️ Resetting for next question...");
    document.getElementById("question").textContent = "Waiting for next question...";

    options.forEach(option => {
        const btn = document.getElementById(option);
        btn.style.display = "none";
        btn.style.backgroundColor = null;
    });

    continueButton.style.display = "none";
    playVideo();
}

function playVideo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            console.error("❌ No active tab found to resume video.");
            return;
        }

        chrome.tabs.sendMessage(tabs[0].id, { type: "playVideo" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("❌ Error sending playVideo message:", chrome.runtime.lastError.message);
                return;
            }

            if (response?.success) {
                console.log("▶️ Video playback resumed successfully.");
            } else {
                console.error("❌ Failed to resume video:", response?.error);
            }
        });
    });
}
