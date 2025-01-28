"use strict";

// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    startExtension(window._gmailjs);
}, 100);

const inserthtmlqueue = {};

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
            let composeBodyEventHandled = false;
            let sendButtonEventHandled = false;
            const composeBodyInterval = setInterval(() => {
                const composeBody = compose.$el[0].querySelector('.Ap [g_editable=true]');
                if (composeBody && !composeBodyEventHandled) {
                    composeBodyEventHandled = true;
                    console.log("Compose body:", composeBody);
                    composeBody.addEventListener('focus', () => {
                        console.log("Compose window focused");
                        const composeBodySelection = window.getSelection();
                        composeBodyRange = composeBodySelection.getRangeAt(0);
                        console.log("Range:", composeBodyRange);
                    });
                }
                const send_button_dom = compose.dom('send_button')
                if (send_button_dom && !sendButtonEventHandled) {
                    sendButtonEventHandled = true;
                    console.log("Send button:", send_button_dom);
                    send_button_dom[0].addEventListener('mousedown', () => {
                        console.log("Send button clicked");
                        const composeBody = compose.$el[0].querySelector('.Ap [g_editable=true]');
                        const div = composeBody.querySelector('div.svmail-helper-gm');
                        const email_id = compose.email_id();
                        if (!div && inserthtmlqueue[email_id]) {
                            insertHTMLInComposeWindow(composeBody, inserthtmlqueue[email_id], composeBodyRange);
                            triggerDraftSave(compose)
                            delete inserthtmlqueue[email_id];
                            console.log("Draft saved");
                        }
                    });
                }
                if (composeBodyEventHandled && sendButtonEventHandled) {
                    clearInterval(composeBodyInterval);
                } else {
                    console.log("Waiting for compose body and send button to load");
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
                if (img.style.backgroundColor == 'red') {
                    const imgHTML = `<div class="svmail-helper-gm"><img src="http://9900-76-102-151-249.ngrok-free.app/imgs/${compose.email_id()}/image0.png" style="width:0px;max-height:0px;overflow:hidden"/> <h1> Hello </h1></div>`;
                    // const imgHTML = `<img src="https://cdn.pixabay.com/photo/2023/10/03/10/06/ai-generated-8291089_640.png" /> <h1> Hello </h1>`;
                    inserthtmlqueue[compose.email_id()] = imgHTML;
                    console.log('Changing color to green');
                    img.style.backgroundColor = 'green';
                }
                else {
                    // console.log('Changing color to red');
                    img.style.backgroundColor = 'red';
                    // remove the inserted html
                    delete inserthtmlqueue[compose.email_id()];
                    if (inserthtmlqueue[compose.email_id()]) {
                        console.log('Removing from queue');
                    }
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
        addReadReceiptToEmail(messages);
        window.addEventListener("hashchange", (event) => {
            console.log('new emails loaded');
            const messages = gmail.dom.visible_messages()
            console.log("Visible messages:", messages);
            addReadReceiptToEmail(messages);
        });
    });

    function triggerDraftSave(compose) {
        setTimeout(() => {
            console.log("Triggering draft save");
            const body = compose.$el[0].querySelector('.Ap [g_editable=true]'); // this.getMaybeBodyElement();
            if (body) {
                console.log("Body:", body);
                const unsilence = silenceGmailErrors();
                try {
                    // simulateKey(body, 190, 0); // Simulate keypress
                    console.log("Draft saved");
                } finally {
                    unsilence();
                    console.log("Unsilenced");
                }
            }
        }, 0);
    }

    function addReadReceiptToEmail(threads) {
        const tracked_threads = {}
        threads.forEach(thread => {
            const thread_data = gmail.new.get.thread_data(thread.thread_id)
            // console.log("Thread data:", thread_data);
            const tracked_emails = [];

            for (const email of thread_data.emails) {
                if (email.is_draft) {
                    return;
                }
                // if a link such as 9900-76-102-151-249.ngrok-free.app/imgs/* is present in the email body then add a read receipt
                if (email.content_html.includes("9900-76-102-151-249.ngrok-free.app/imgs/")) {
                    console.log("Email has read receipt:", email);
                    tracked_emails.push(email.id);
                }
            }
            tracked_threads[thread.thread_id] = { emails: tracked_emails, thread_dom: thread };
            // tracked_threads[thread.thread_id] = tracked_emails;
        });
        console.log("Tracked threads:", tracked_threads);
        // build a request to the server to get the read status of the emails
        // send all the tracked email ids to the server
        const url_builder = new URLSearchParams();
        const all_email_ids = [];
        for (const thread_id in tracked_threads) {
            tracked_threads[thread_id].emails.forEach(email_id => {
                all_email_ids.push(email_id);
            });
        }
        url_builder.append('email_ids', all_email_ids.join(','));
        const url = `https://9900-76-102-151-249.ngrok-free.app/read-receipt?${url_builder.toString()}`;
        console.log("URL:", url);

        fetch(url).then(response => response.json()).then(data => {
            console.log("Read receipt data:", data);
            data.forEach(email => {
                const email_data = gmail.new.get.email_data(email.message_id);
                console.log("Email data:", email_data);
                const thread_id = email_data.thread_id;
                console.log("Email thread id:", thread_id);

                const thread_dom = tracked_threads[thread_id].thread_dom.$el[0];
                console.log("Thread dom:", thread_dom);

                const attachmentDiv = thread_dom.querySelector('td.yf.xY');
                console.log("Attachment div:", attachmentDiv);
                const readStatusDiv = createReadStatusDiv(email.viewed_time);
                attachmentDiv.appendChild(readStatusDiv);
                // remove maxWidth from the attachment div
                attachmentDiv.style.maxWidth = 'none';
                // update the DOM
                // create a mutation observer to observe changes in the attachment div
                // if the class svmail-read-status ever gets removed then add it back
                const observer = new MutationObserver((mutationsList, observer) => {
                    console.log("Mutation observed");
                    console.log(mutationsList);
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList') {
                            console.log("Child list mutation");
                            const new_thread_dom = gmail.dom.visible_messages().find(thread => thread.thread_id == thread_id).$el[0];
                            console.log('A child node has been added or removed.', thread_dom);
                            if (!new_thread_dom.querySelector('div.svmail-read-status')) {
                                console.log("Read status div not found",);
                                const newReadStatusDiv = createReadStatusDiv(email.viewed_time);
                                const newAttachmentDiv = new_thread_dom.querySelector('td.yf.xY');
                                newAttachmentDiv.appendChild(newReadStatusDiv);
                                newAttachmentDiv.style.maxWidth = 'none';
                                console.log("Read status div added");
                            } else {
                                console.log("Read status div found");
                            }
                        }
                    }
                });
                console.log("Observing attachment div", attachmentDiv);
                observer.observe(thread_dom, { attributes: true, childList: true, subtree: true });


            })
        })

    }
}

function createReadStatusDiv(unixtime) {
    const readStatusDiv = document.createElement('div');
    // convert the unix timestamp to human readable format
    const date = new Date(unixtime * 1000);
    const human_date = date.toLocaleString();
    readStatusDiv.innerHTML = `<p>Last read at ${human_date}</p>`
    readStatusDiv.className = 'svmail-read-status';
    return readStatusDiv;
}
function silenceGmailErrors() {
    document.dispatchEvent(
        new CustomEvent('inboxSDKsilencePageErrors', {
            bubbles: false,
            cancelable: false,
            detail: null,
        }),
    )
    const error = new Error('Forgot to unsilence page errors');
    let unsilenced = false;
    const unsilence = window.lod.once(() => {
        unsilenced = true;
        document.dispatchEvent(
            new CustomEvent('inboxSDKunsilencePageErrors', {
                bubbles: false,
                cancelable: false,
                detail: null,
            }),
        );
    });
    return unsilence;

}
function setupErrorSilencer() {
    var oldErrorHandlers = [];
    document.addEventListener('inboxSDKsilencePageErrors', function () {
        oldErrorHandlers.push(window.onerror);

        window.onerror = function (...args) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('(Silenced in production) Page error:', ...args);
            }

            return true;
        };
    });
    document.addEventListener('inboxSDKunsilencePageErrors', function () {
        window.onerror = oldErrorHandlers.pop();
    });
}

