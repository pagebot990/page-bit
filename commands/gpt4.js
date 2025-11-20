function addMessage(message, isUser = false) {
    const messageElement = document.createElement('div');
    messageElement.className = isUser ? 'user-message message' : 'bot-message message';
    messageElement.textContent = message;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function fetchAnswerFromAPI(question) {
    try {
        const apiUrl = `https://rapido.zetsu.xyz/api/gemini?chat=${encodeURIComponent(question)}&imageUrl=1&apikey=rapi_7cdde90c01404858a0e396f5471213e5`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Assuming ang sagot ay nasa "response" field (ayon sa karamihang AI API)
        const answer = data.response || data.answer || "No response received.";
        addMessage(answer);
    } catch (error) {
        console.error(error);
        addMessage("Oops! An error occurred while fetching the answer.");
    }
}

function sendMessage() {
    const userMessage = inputBox.value;
    if (userMessage.trim() !== '') {
        addMessage(userMessage, true);
        fetchAnswerFromAPI(userMessage);
    }
    inputBox.value = '';
}
