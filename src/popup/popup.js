document.addEventListener('DOMContentLoaded', async function () {
    // get session_id cookie from localhost:8000
    const session_id = await browser.cookies.get({ url: 'http://localhost:8000', name: 'session_id' })
    console.log('Session ID:', session_id);
    const userInfo = document.getElementById('user-info');
    fetch('http://localhost:8000/userinfo', {
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
            loginLink.href = 'http://localhost:8000';
            loginLink.target = '_blank';
            loginLink.textContent = 'Log in';
            userInfo.appendChild(loginLink);
        });
});