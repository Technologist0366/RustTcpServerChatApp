function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (message) {
        fetch('/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        }).then(() => {
            input.value = '';
        }).catch(err => console.error('Send failed:', err));
    }
}

function updateMessages() {
    fetch('/messages')
        .then(res => res.json())
        .then(messages => {
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = messages.map(msg => `
                <div class="message ${msg.sent ? 'sent' : 'received'}">
                    ${msg.text}
                    <div class="timestamp">${msg.timestamp}</div>
                </div>
            `).join('');
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        })
        .catch(err => console.error('Fetch failed:', err));
}

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
}

setInterval(updateMessages, 1000);
updateMessages();