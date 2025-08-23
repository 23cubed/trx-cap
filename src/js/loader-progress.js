var __resourcesByUrl = new Map();
var __subscribers = new Set();

function __notify() {
    var totals = { loaded: 0, total: 0 };
    __resourcesByUrl.forEach(function(r) {
        var total = r.totalBytes != null ? r.totalBytes : (r.done ? 1 : 1);
        var loaded = r.totalBytes != null ? Math.min(r.loadedBytes, total) : (r.done ? 1 : 0);
        totals.loaded += loaded;
        totals.total += total;
    });
    var percent = totals.total > 0 ? Math.round((totals.loaded / totals.total) * 100) : 0;
    __subscribers.forEach(function(fn) {
        try { fn(percent); } catch (e) {}
    });
}

function resetLoaderProgress() {
    __resourcesByUrl.clear();
    __notify();
}

function beginResource(url) {
    if (!__resourcesByUrl.has(url)) {
        __resourcesByUrl.set(url, { totalBytes: null, loadedBytes: 0, pendingRefs: 0, done: false });
    }
    var r = __resourcesByUrl.get(url);
    r.pendingRefs += 1;
    r.done = false;
    __notify();
}

function updateResourceProgress(url, loadedBytes, totalBytes, lengthComputable) {
    var r = __resourcesByUrl.get(url);
    if (!r) return;
    if (lengthComputable && Number.isFinite(totalBytes) && totalBytes > 0) {
        if (r.totalBytes == null || totalBytes > r.totalBytes) r.totalBytes = totalBytes;
        if (Number.isFinite(loadedBytes)) r.loadedBytes = Math.max(r.loadedBytes, loadedBytes);
    } else {
        if (Number.isFinite(loadedBytes) && r.totalBytes != null) r.loadedBytes = Math.max(r.loadedBytes, loadedBytes);
    }
    __notify();
}

function endResource(url) {
    var r = __resourcesByUrl.get(url);
    if (!r) return;
    r.pendingRefs = Math.max(0, r.pendingRefs - 1);
    if (r.pendingRefs === 0) {
        if (r.totalBytes == null) {
            r.totalBytes = 1;
            r.loadedBytes = 1;
        } else {
            r.loadedBytes = r.totalBytes;
        }
        r.done = true;
    }
    __notify();
}

function subscribeToLoaderProgress(handler) {
    __subscribers.add(handler);
    return function() { __subscribers.delete(handler); };
}

function forceCompleteLoaderProgress() {
    __resourcesByUrl.forEach(function(r) {
        if (r.totalBytes == null) r.totalBytes = 1;
        r.loadedBytes = r.totalBytes;
        r.done = true;
        r.pendingRefs = 0;
    });
    __notify();
}

function showLoader() {
    var counter = document.querySelector('.counter');
    gsap.set(".loader", { display: "flex", autoAlpha: 1 });
    if (counter) counter.textContent = "0%";
}

function hideLoader() {
    return gsap.to('.loader', {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power4.out",
        onComplete: function () {
            var loader = document.querySelector('.loader');
            if (loader) loader.remove();
        }
    });
}

function waitForSteppedCounterCompletion(pauseMs) {
    var counter = document.querySelector('.counter');
    var sawAnyResource = false;
    var targetPercent = 0;
    var displayedPercent = 0;
    var stepTimer = null;
    var getStepInterval = function() {
        if (!counter) return 16;
        var v = parseInt(counter.getAttribute('data-step-interval'), 10);
        return Number.isFinite(v) && v > 0 ? v : 16;
    };
    var updateCounter = function(val) { if (counter) counter.textContent = String(val) + '%'; };
    updateCounter(0);
    return new Promise(function(resolve) {
        var done = false;
        var unsubscribe = null;
        var tryResolve = function() {
            if (done) return;
            if (displayedPercent >= 100 && targetPercent >= 100) {
                done = true;
                if (unsubscribe) unsubscribe();
                if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
                setTimeout(function(){ resolve(); }, Number.isFinite(pauseMs) ? pauseMs : 250);
            }
        };
        var startStepper = function() {
            if (stepTimer) return;
            stepTimer = setInterval(function() {
                if (displayedPercent < targetPercent) {
                    displayedPercent += 1;
                    updateCounter(displayedPercent);
                    if (displayedPercent >= 100) {
                        clearInterval(stepTimer);
                        stepTimer = null;
                        tryResolve();
                    }
                }
            }, getStepInterval());
        };
        unsubscribe = subscribeToLoaderProgress(function(percent) {
            sawAnyResource = true;
            targetPercent = Math.max(targetPercent, Math.min(100, percent));
            startStepper();
            if (targetPercent >= 100) tryResolve();
        });
        setTimeout(function(){ if (!sawAnyResource && !done) { if (unsubscribe) unsubscribe(); resolve(); } }, 50);
    });
}

export { resetLoaderProgress, beginResource, updateResourceProgress, endResource, subscribeToLoaderProgress, forceCompleteLoaderProgress, showLoader, hideLoader, waitForSteppedCounterCompletion };


