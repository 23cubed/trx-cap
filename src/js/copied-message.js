function initCopied(){
  const copyTextEl = document.getElementById("copy-text");
  if (copyTextEl) {
    copyTextEl.textContent = window.location.href;
  }

  const copyButtons = document.querySelectorAll('[fs-copyclip-element="click"], [fs-copyclip-element="click-2"]');
  const copiedMessage = document.getElementById("message");

  copyButtons.forEach(function (el) {
    el.addEventListener("click", function () {
      if (copiedMessage) {
        copiedMessage.classList.remove("hide");
        setTimeout(function () {
          copiedMessage.classList.add("hide");
        }, 2000);
      }
    });
  });
}

export { initCopied };