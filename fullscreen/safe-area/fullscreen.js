function init() {
    const btn = document.querySelector('button.fullscreen');
    let root = document.documentElement;
    root.addEventListener('fullscreenchange', (evt) => {
        if (document.fullscreenElement) {
            btn.textContent = btn.textContent.replace('Enter', 'Exit');
        } else {
            btn.textContent = btn.textContent.replace('Exit', 'Enter');
        }
    });
    btn.addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            root.requestFullscreen();
        };
    });
}

document.addEventListener('DOMContentLoaded', init);
