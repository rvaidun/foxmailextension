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


const patterns = [
    "*://*/*9900-76-102-151-249.ngrok-free.app/imgs/*", "*://9900-76-102-151-249.ngrok-free.app/imgs/*"];
load(patterns);