const SERVER_URL = 'https://9900-76-102-151-249.ngrok-free.app'
document.addEventListener('DOMContentLoaded', async function () {
    // get session_id cookie from localhost:8000
    const userInfo = document.getElementById('user-info');
    fetch('http://9900-76-102-151-249.ngrok-free.app/userinfo', {
        method: 'GET',
        credentials: 'include',
    })
        .then(response => response.json())
        .then(data => {
            console.log('Data:', data);
            // Display the user info

            userInfo.innerHTML = `<p> Welcome, ${data.email} </p>`;


        })
        .catch(err => {
            console.error('Error:', err);
            const loginLink = document.createElement('a');
            loginLink.href = 'http://9900-76-102-151-249.ngrok-free.app';
            loginLink.target = '_blank';
            loginLink.textContent = 'Log in';
            userInfo.appendChild(loginLink);
        });
});