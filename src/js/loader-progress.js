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

export { resetLoaderProgress, beginResource, updateResourceProgress, endResource, subscribeToLoaderProgress, forceCompleteLoaderProgress };


