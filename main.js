const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');

let win = null;
let tray = null;
let isQuitting = false;

function createTrayIcon() {
  const canvas = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAiZJREFUWEftlr1OAkEUhb+ziY2FjY2FjZ2FjZ2FjZ2FjY2FjRY2PoGJL6CJhY2FjY2FjY2FjY2FjY2FjY2FjY2FjYXxDZggSXZ3Z2ZnZxJPQrIzZ+45M3fuvRcJ/+kh/7Q+zgUgCAkEAgQCAdcBhBCEEBLDMDDGUErBcRwkScKyLEiSBJ7nQQhBFEXcuXOHMAyRJAlCCCil+Lk3xhhKKaUYIz9j4DjOGAYBniep2n60O/3R9VqFaIowtM0jSMlAA6HA4IgAAB4nof5fI5yuQzLsmi73ebRaOQvFgtIKQ+U42YBJpMJOI7j7oZh7C0Wi8pkMkEURXoYhruTyaQ8nU4hpeQPAFzXRaVSgSRJr/P5vNPtdpEkSRgEwbbX65Xz+Tw+AJB47k+SHAggSRJYlgXLslAqlV62CNM0UavVYJomZFk+DvD/bBiNRrvQAKqqol6vf9Kj6zoqlQpUVT1eBf46F4AZADbFMAx7jDHkXA2qqu77y7IsTNP8OoCNUopQ67oO0zTBGNvHZ9cCEgQBlFJ7IqUUPM+/DGCMHUF7ngdd10EpxXGiiBRFQSblbGCnCjBCo9EIrVbL1XUdURTtI7KiKBDHMcbjsa+qqp9SKzOqSwudGogQotfr4WQ0GhFjDP8DWJ1O5zyJX2q7vFkBtXsgXpNSHt3XqfjXZ8cSCPwpIpfeTwv+RcWvwK1U/av2Y39yE5hbfoeAQCDkl4AffEDfZQ+pqQAAAABJRU5ErkJggg==',
      'base64'
    )
  );
  return canvas.resize({ width: 16, height: 16 });
}

function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 650,
    resizable: false,
    frame: false,
    transparent: true,
    center: true,
    show: false,
    backgroundColor: '#111110',
    icon: path.join(__dirname, 'assets', 'fanqie.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('pomodoro.html');
  win.setMenuBarVisibility(false);

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('番茄钟 — 就绪');

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => win.show() },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show();
  });
}

// IPC: 通知
ipcMain.on('send-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, 'assets', 'icon.png') }).show();
  }
});

// IPC: 托盘文字
ipcMain.on('update-tray', (_event, text) => {
  if (tray) tray.setToolTip(text);
});

// IPC: 最小化
ipcMain.on('minimize', () => {
  if (win) win.minimize();
});

// IPC: 关闭到托盘
ipcMain.on('close', () => {
  if (win) win.hide();
});

// IPC: 置顶切换
ipcMain.on('set-always-on-top', (_event, flag) => {
  if (win) win.setAlwaysOnTop(flag);
});

app.setAppUserModelId('com.pomodoro.app');

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('before-quit', () => { isQuitting = true; });
