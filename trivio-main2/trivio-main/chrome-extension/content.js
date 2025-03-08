console.log("🔔 content.js loaded - checking video URL");

const videoUrl = window.location.href;
console.log("📺 Detected video URL in content.js:", videoUrl);

chrome.runtime.sendMessage({
    type: "getQuestions",
    video_url: videoUrl
}, (response) => {
    if (chrome.runtime.lastError) {
        console.error("❌ Error sending message from content.js:", chrome.runtime.lastError.message);
    } else {
        console.log("✅ Message sent from content.js, response:", response);
    }
});
