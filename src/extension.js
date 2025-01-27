"use strict";

// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    startExtension(window._gmailjs);
}, 100);

function insertHTMLInComposeWindow(element, html, oldRange) {
    if (element instanceof HTMLTextAreaElement) {
        console.log("Element is text area not supported yet");
    } else {
        var editable = null;
        if (element.getSelection) {
            console.log("Element has getSelection");
            editable = element;
        } else if (element.ownerDocument && element.ownerDocument.getSelection) {
            editable = element.ownerDocument;
            console.log("Element has ownerDocument");
        } else {
            console.log("Element has no getSelection");
        }
        if (editable) {
            var sel = editable.getSelection();
            // var range = oldRange || sel.getRangeAt(0);
            if (oldRange) {
                console.log("Using old range");
                var range = oldRange;
            }
            else {
                console.log("Getting new range");
                var range = sel.getRangeAt(0);
            }
            var frag;

            if (html instanceof DocumentFragment) {
                console.log("HTML is a document fragment");
                frag = html;
            } else {
                console.log("HTML is not a document fragment");
                frag = document.createDocumentFragment();

                if (html instanceof HTMLElement) {
                    frag.appendChild(html);
                } else {
                    console.log("HTML is not an HTMLElement");
                    var elem = document.createElement('div');
                    elem.innerHTML = html;
                    var node;
                    console.log("Appending nodes");
                    while (node = elem.firstChild) {
                        frag.appendChild(node);

                    }
                    console.log("Finished appending nodes");
                }
            }

            var firstChild = frag.firstElementChild;
            range.insertNode(frag);

            var event = document.createEvent('MouseEvents');
            event.initMouseEvent(
                'mousedown',
                false,
                true,
                window,
                1,
                0,
                0,
                0,
                0,
                false,
                false,
                false,
                false,
                0,
                null,
            );
            event.preventDefault()
            element.dispatchEvent(event);
            // Preserve the cursor position
            // TODO: Does not work as expected
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            var nextUserCursorMove = window.kefir.merge([
                window.kefir.fromEvents(element, 'mousedown'),
                window.kefir.fromEvents(element, 'keypress'),
            ]);
            // Whenever the body element gets focus, manually make sure the cursor
            // is in the right position, because Chrome likes to put it in the
            // previous location instead because it hates us.
            window.kefir.fromEvents(element, 'focus')
                .takeUntilBy(nextUserCursorMove)
                .onValue(function () {
                    sel.removeAllRanges();
                    sel.addRange(range);
                });
            console.log("Finished inserting HTML");
            return firstChild;


        } else {
            console.log("Element is not editable");
        }
    }
}

// actual extension-code
function startExtension(gmail) {
    console.log("Extension loading...");
    window.gmail = gmail;

    const tracked_threads = new Set();

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

            // create a observer for when the compose body is loaded
            let composeBodyRange;
            const composeBodyInterval = setInterval(() => {
                const composeBody = compose.$el[0].querySelector('.Ap [g_editable=true]');
                if (composeBody) {
                    console.log("Compose body:", composeBody);
                    composeBody.addEventListener('focus', () => {
                        console.log("Compose window focused");
                        const composeBodySelection = window.getSelection();
                        composeBodyRange = composeBodySelection.getRangeAt(0);
                        console.log("Range:", composeBodyRange);
                    });
                    clearInterval(composeBodyInterval);
                }
            }, 100);

            const send_button_dom = compose.dom('send_button')
            // console.log("Send button:", send_button_dom);
            // Find the td element that contains the send button
            const send_button_td = send_button_dom.closest('td');
            // console.log("Send button td:", send_button_td);
            // create a new button aka td element
            const eye_svg = 'https://cdn-icons-png.flaticon.com/256/367/367070.png';
            // create a new button aka td element with eye icon that toggles color on click
            const new_button = document.createElement('td');

            // console.log("Send button td:", send_button_td);
            // create a new button aka td element

            const img = document.createElement('img');
            img.src = eye_svg;
            img.style.width = '20px';
            img.style.height = '20px';

            new_button.addEventListener('click', () => {
                // console.log('Button clicked toggling color');
                // const imgHTML = `<img src="http://localhost:8000/imgs/${compose.email_id()}/image0.png" /> <h1> Hello </h1>`;
                const imgHTML = `<img src="https://cdn.pixabay.com/photo/2023/10/03/10/06/ai-generated-8291089_640.png" /> <h1> Hello </h1>`;
                insertHTMLInComposeWindow(compose.$el[0].querySelector('.Ap [g_editable=true]'), imgHTML, composeBodyRange);
                if (img.style.backgroundColor == 'red') {
                    console.log('Changing color to green');
                    img.style.backgroundColor = 'green';
                }
                else {
                    // console.log('Changing color to red');
                    img.style.backgroundColor = 'red';
                }
                // update the dom
                new_button.replaceChildren(img);
            });
            // change the color of the svg to blue by default
            img.style.backgroundColor = 'red';
            new_button.appendChild(img)
            send_button_td.after(new_button);

            console.log("email id", compose.email_id())
        });
        const messages = gmail.dom.visible_messages()
        console.log("Visible messages:", messages);
        window.addEventListener("hashchange", (event) => {
            console.log('new emails loaded');
            const messages = gmail.dom.visible_messages()
            console.log("Visible messages:", messages);
        });
    });
}
