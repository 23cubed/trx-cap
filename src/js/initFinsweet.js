function initFinsweet() {
    window.fsAttributes = window.fsAttributes || [];

    const attrs = [
        'fs-list',
        'fs-readtime',
        'fs-inject',
        'fs-socialshare',
        'fs-copyclip',
        'fs-toc',
        'fs-scrolldisable'
    ];

    attrs.forEach(attr => {
        window.fsAttributes.push([attr, null]);
    });
}

  export { initFinsweet };
  