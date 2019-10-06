import { app, BrowserWindow } from 'electron'
const {ipcMain} = require('electron')
import { remote } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let secondWindow
let monitorVideo
let monitorSendVideo
let googleAuthWindow
let whatsappSendWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    transparent: false, 
    frame: true,
    fullscreen: false
  })
  mainWindow.loadURL(winURL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  // let name = require('./package.json').name
  // let version = require('./package.json').version
  // mainWindow.setTitle(name + " " + version)
  mainWindow.webContents.openDevTools()

  ipcMain.on('google-auth-widows', (event, authUrl) => {
    googleAuthWindow = new BrowserWindow({
      height: 500,
      useContentSize: true,
      width: 500,
      transparent: false, 
      frame: true,
      fullscreen: false,
      webPreferences: {webSecurity: false}
    })
    googleAuthWindow.on('close', function () { googleAuthWindow = null })
    googleAuthWindow.loadURL(authUrl)
  })


  ipcMain.on('login-success', (event, ids) => {
    monitorVideo = new BrowserWindow({
      height: 563,
      useContentSize: true,
      width: 1000,
      transparent: false, 
      frame: true,
      fullscreen: false,
      webPreferences: {webSecurity: false}
    })
    const modalPath = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/monitor-video/`+ids
    : `file://${__dirname}/index.html#monitor-video/`+ids
    monitorVideo.on('close', function () { monitorVideo = null })
    monitorVideo.loadURL(modalPath)
    // monitorVideo.setTitle(name + " " + version)
    monitorVideo.webContents.openDevTools()

    monitorSendVideo = new BrowserWindow({
      height: 563,
      useContentSize: true,
      width: 1000,
      transparent: false, 
      frame: true,
      fullscreen: false,
      webPreferences: {webSecurity: false}
    })
    const modalPath2 = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/monitor-send/`+ids
    : `file://${__dirname}/index.html#monitor-send/`+ids
    monitorSendVideo.on('close', function () { monitorSendVideo = null })
    monitorSendVideo.loadURL(modalPath2)
    // monitorSendVideo.setTitle(name + " " + version)
    monitorSendVideo.webContents.openDevTools()


    // secondWindow = new BrowserWindow({
    //   height: 563,
    //   useContentSize: true,
    //   width: 400,
    //   transparent: false, 
    //   frame: true,
    //   fullscreen: false,
    //   webPreferences: {webSecurity: false}
    // })
    // const modalPath = process.env.NODE_ENV === 'development'
    // ? `http://localhost:9080/#/project-send/`+ids
    // : `file://${__dirname}/index.html#project-send/`+ids
    // // var urls = winURL+`/#/project/send/`+ids
    // secondWindow.on('close', function () { secondWindow = null })
    // secondWindow.loadURL(modalPath)
    // secondWindow.webContents.openDevTools()
  })

  ipcMain.on('refresh-page', (event, payloads) => {
    // if (secondWindow!==null) {
    //   secondWindow.reload()
    // }
    if (monitorVideo!==null) {
      // monitorVideo.reload()
    }
  })

  ipcMain.on('send-to-movie-page', (event, payloads) => {
    if (monitorVideo!==null) {
      monitorVideo.webContents.send('push-to-movie-page', payloads);
    }
    if (monitorSendVideo!==null) {
      monitorSendVideo.webContents.send('push-to-movie-page', payloads);
    }
  })

  ipcMain.on('navigating-movie-send-page', (event, payloads) => {
    if (monitorVideo!==null) {
      monitorVideo.webContents.send('push-to-movie-page', payloads);
    }
  })

  ipcMain.on('send-to-what-app', (event, payloads) => {
    var whatsappURL = 'https://web.whatsapp.com/send?phone=+62' + payloads.number + '&text=' + payloads.message
    if (whatsappSendWindow == null) {
      whatsappSendWindow = new BrowserWindow({
        height: 500,
        useContentSize: true,
        width: 500,
        transparent: false, 
        frame: true,
        fullscreen: false,
        webPreferences: {webSecurity: false}
      })
      whatsappSendWindow.on('close', function () { whatsappSendWindow = null })
    } else {
      whatsappSendWindow.show()
    }
    whatsappSendWindow.loadURL(whatsappURL,{userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36'})
    whatsappSendWindow.webContents.executeJavaScript(`
      var{ipcRenderer,remote} = require("electron");
      var enviado = false;
      function tempo(){
        var btsend = document.getElementsByClassName("_35EW6")[0];
        var inputSend = document.getElementsByClassName("_2S1VP")[0];
        if(typeof inputSend !== 'undefined' && inputSend.textContent && !enviado){
          btsend.click();
          enviado = true;
        } else if(enviado){
          /* cancela */
          ipcRenderer.send("para",{status:true});
          enviado = false;
        }
      }
      setInterval(tempo,3000)
    `)
  })

  ipcMain.on("para",(event,arg)=>{
    if(arg.status){
      whatsappSendWindow.hide();
    }
  })

  ipcMain.on('email-auth', (event, payloads) => {
    if (monitorSendVideo!==null) {
      console.log("payloads")
      console.log(payloads)
      monitorSendVideo.webContents.send('push-to-movie-page-email-auth', payloads);
    }
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
