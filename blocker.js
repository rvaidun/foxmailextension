function blockRequest(details) {
    console.log("Blocked: ", details.url);
    return {
        cancel: true
    };
}
function isValidPattern(urlPattern) {
    var validPattern = /^(file:\/\/.+)|(https?|ftp|\*):\/\/(\*|\*\.([^\/*]+)|([^\/*]+))\//g;
    return !!urlPattern.match(validPattern);
}
function load(patterns) {
    console.log("Loading blocker.js");
    if (browser.webRequest.onBeforeRequest.hasListener(blockRequest)) {
        browser.webRequest.onBeforeRequest.removeListener(blockRequest);
    }

    if (patterns.length) {
        try {
            browser.webRequest.onBeforeRequest.addListener(blockRequest, {
                urls: patterns
            }, ['blocking']);
        } catch (e) {
            console.error(e);
        }
        console.log("Blocking: ", patterns);
    }
    else {
        console.log("No patterns to block");
    }
}


const patternsReference = [
    "*://*/*localhost:8000*", "*://*/*"
];
const actualhost = "https://cdn.pixabay.com/photo/2023/10/03/10/06/ai-generated-8291089_640.png"

const patterns = [
    "*://*/*cdn.pixabay.com/photo*", "*://cdn.pixabay.com/photo*", "*://cdn.pixabay.com/photo*", "*://*/*localhost:8000*",
]
load(patterns);