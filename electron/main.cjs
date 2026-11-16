const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Headless check used by tooling: loads the built app and exits with the page title.
const isSmokeRun = process.argv.includes('--smoke');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    const win = new BrowserWindow({
      width: 1280,
      height: 860,
      minWidth: 360,
      minHeight: 480,
      autoHideMenuBar: true,
      backgroundColor: '#020617',
      show: !isSmokeRun,
      webPreferences: {
        // The tracker is a plain web app: keep the renderer fully sandboxed.
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

    if (isSmokeRun) {
      win.webContents.on('did-finish-load', () => {
        win.webContents
          .executeJavaScript('document.title')
          .then((title) => {
            console.log(`SMOKE_OK: ${title}`);
            app.exit(0);
          })
          .catch((err) => {
            console.error('SMOKE_FAIL', err);
            app.exit(1);
          });
      });
      win.webContents.on('did-fail-load', (_event, code, desc, url) => {
        console.error(`SMOKE_FAIL: ${code} ${desc} ${url}`);
        app.exit(1);
      });
    }
  });

  app.on('window-all-closed', () => app.quit());
}
