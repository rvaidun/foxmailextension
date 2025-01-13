"use strict";

// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    startExtension(window._gmailjs);
}, 100);

// actual extension-code
function startExtension(gmail) {
    console.log("Extension loading...");
    window.gmail = gmail;

    gmail.observe.on("load", () => {
        const userEmail = gmail.get.user_email();
        console.log("Hello, " + userEmail + ". This is your extension talking!");

        gmail.observe.on("view_email", (domEmail) => {
            console.log("Looking at email:", domEmail);
            const emailData = gmail.new.get.email_data(domEmail);
            console.log("Email data:", emailData);
        });

        gmail.observe.on("compose", (compose) => {
            console.log("New compose window is opened!", compose);
            const send_button_dom = compose.dom('send_button')
            console.log("Send button:", send_button_dom);
            // Find the td element that contains the send button
            const send_button_td = send_button_dom.closest('td');
            console.log("Send button td:", send_button_td);
            // create a new button aka td element
            const eye_svg = 'https://cdn-icons-png.flaticon.com/256/367/367070.png';
            // create a new button aka td element with eye icon that toggles color on click
            const new_button = document.createElement('td');

            console.log("Send button td:", send_button_td);
            // create a new button aka td element

            const img = document.createElement('img');
            img.src = eye_svg;
            img.style.width = '20px';
            img.style.height = '20px';

            new_button.addEventListener('click', () => {
                console.log('Button clicked toggling color');
                if (img.style.backgroundColor == 'red') {
                    console.log('Changing color to green');
                    img.style.backgroundColor = 'green';
                }
                else {
                    console.log('Changing color to red');
                    img.style.backgroundColor = 'red';
                }
                // update the dom
                new_button.replaceChildren(img);
            });
            // change the color of the svg to blue by default
            img.style.backgroundColor = 'red';
            new_button.appendChild(img)
            send_button_td.after(new_button);
        });
    });
}
