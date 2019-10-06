<template>
  <div id="wrapper">
    <h1 class="title">{{ project.name }}</h1>
    <h2 class="subtitle" style="margin-bottom:0;">{{ project.slug }}</h2>
    <h3 class="subtitle" style="margin-bottom:0;">{{ project.folder }}</h3>
    <h3 class="subtitle">{{ project.webViewLink }}</h3>
    <main>
      <div class="content is-large" style="margin-bottom:0;">
        <p><span class="tag is-large" v-bind:class="{ 'is-danger': statusDanger, 'is-success': statusSuccess, 'is-warning': statusWarning }" v-html="statusText" ></span></p>
      </div>
      <div>
        <label class="checkbox">
          <input type="checkbox" v-model="stabilization">
          Video Stabilization (experimental)
        </label>
      </div>
      <div>
        <label class="checkbox">
          <input type="checkbox" v-model="showFiles">
          Show list files
        </label>
      </div>
      <div>
        <div class="field">
          <label class="label" style="margin:0px;">Image Overlay</label>
          <div class="control">
            <img v-bind:src="imageOverlay" alt="electron-vue" width="200" height="auto">
          </div>
        </div>
        
      </div>
      <div>
        <div style="display:inline-block; margin-right:20px;">
          <div class="field">
            <label class="label" style="margin:0px;">FPS (camera count)</label>
            <div class="control">
              <input class="input" type="text" placeholder="Text input" v-model.trim="fps">
            </div>
          </div>
        </div>
        <div style="display:inline-block; margin-right:20px;">
          <div class="field">
            <label class="label" style="margin:0px;">Output FPS (video)</label>
            <div class="control">
              <input class="input" type="text" placeholder="Text input" v-model.trim="outputFPS">
            </div>
          </div>
        </div>
        <div style="display:inline-block;">
          <div class="field">
            <label class="label" style="margin:0px;">Duration (second - min 1 sec)</label>
            <div class="control">
              <input class="input" type="text" placeholder="Text input" v-model.trim="duration">
            </div>
          </div>
        </div>
      </div>
      <div>
        <div style="display:inline-block;">
          <div class="field">
            <label class="label" style="margin:0px;">Email Address</label>
            <div class="control">
              <input class="input" type="text" placeholder="Email Address" v-model.trim="emailAddress">
            </div>
          </div>
        </div>
        <div style="display:inline-block;">
          <div class="field">
            <label class="label" style="margin:0px;">Password Email</label>
            <div class="control">
              <input class="input" type="password" placeholder="Email Password" v-model.trim="emailPassword">
            </div>
          </div>
        </div>
        <div style="display:inline-block;">
          <div class="field">
            <label class="label" style="margin:0px;">&nbsp;</label>
            <div class="control">
              <a class="button is-fullwidth is-link" @click.prevent="sendEmailCredentials()" >Send</a>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hide-first" v-bind:class="{'show-files':showFiles}">
        <ol style="padding-left: 30px;">
          <li v-bind:key="fl.path" v-for="(fl) in files">
            {{ fl }} 
          </li>
        </ol>
      </div>
      <div>
        <div style="height:20px;"></div>
        <router-link class="buttons are-medium is-danger" to="/" style="display:inline-block;">Back</router-link>
      </div>
    </main>
  </div>
</template>


<style scoped>
.input {
  width: auto;
  min-width: 0;
}
.field .label {
  color: #333 !important;
}
.hide-first {
  display: none;
}
.hide-first.show-files {
  display: block;
}
</style>



<script>
// ========
const Swal = require('sweetalert2')
var {ipcRenderer} = require('electron')
// ====
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = './token.json';
var googleDriveAuth;
var currentProjectGD;
// =
// ========
const chokidar = require('chokidar');

var imagesToSew = []
// console.log(this.$route.params.projectID)
function randomize(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
function convertToSlug(Text){
  return Text
    .toLowerCase()
    .replace(/[^\w ]+/g,'')
    .replace(/ +/g,'-')
    ;
}
// getCurrentProject
const getCurrentProject = (dbProject,projectID,status) => {
  return new Promise((resolve, reject) => {
    dbProject.findOne({ _id: projectID }, function (err, newDoc) {
      if (err) {
        alert(err)
        console.log('searchDatabase', 'err', err)
        reject(err)
        status.statusDanger = true
        status.statusWarning = false
        status.statusSuccess = false
      }
      else {
        resolve(newDoc)
        status.statusDanger = false
        status.statusWarning = false
        status.statusSuccess = true
      }
    });
  });
};
// getCurrentClient
const getCurrentClient = (dbClient,projectID) => {
  return new Promise((resolve, reject) => {
    dbClient.find({ project: projectID }, function (err, newDoc) {
      if (err) {
        alert(err)
        console.log('getCurrentClient', 'err', err)
        reject(err)
      }
      else {
        resolve(newDoc)
      }
    });
  });
};
// getCurrentClip
const getCurrentClip = (dbClip,projectID) => {
  return new Promise((resolve, reject) => {
    dbClip.find({ project: projectID }, function (err, newDoc) {
      if (err) {
        alert(err)
        console.log('getCurrentClient', 'err', err)
        reject(err)
      }
      else {
        resolve(newDoc)
      }
    });
  });
};
// clipSaveToDB
const clipSaveToDB = (clip, projectID, dbClip) => {
  return new Promise((resolve, reject) => {
    dbClip.insert(clip, function (err, newDoc) {
      if (err) {
        alert(err)
        reject(err)
      }
      else {
        resolve(newDoc)
      }
    });
  });
};
const checkFiles = (paths, filess) => {
  return new Promise((resolve, reject) => {
    if (filess!==undefined) {
      if( filess.find(o => o.path === paths) ) {
        reject(false)
      } else {
        filess.push({
          path: paths,
          filename: require("path").basename(paths)
        })
        resolve(true)
      }
    } else {
      reject(false)
    }
  });
};

// clipSaveToDB
const duplicateFiles = (files_i, new_file) => {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    fs.copyFile(files_i, new_file, (err) => {
      if (err) {
        console.log('duplicateFiles ERR: ', err)
        reject(false)
      } else {
        resolve(true)
      }
      
    });
  });
};

// === sorting
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;
function sortAlphaNum(a, b) {
  var aA = a.replace(reA, "");
  var bA = b.replace(reA, "");
  if (aA === bA) {
    var aN = parseInt(a.replace(reN, ""), 10);
    var bN = parseInt(b.replace(reN, ""), 10);
    return aN === bN ? 0 : aN > bN ? 1 : -1;
  } else {
    return aA > bA ? 1 : -1;
  }
}


export default {
  name: 'new-project',
  components: { },
  data() {
    return {
      projectID: '',
      clipSum: 0,
      clients: {},
      clips: {},
      clipsNew: {},
      project:{},
      files: [],
      filess: [],
      statusDanger: false,
      statusSuccess: false,
      statusWarning: true,
      statusText: 'Please Wait ...',
      status: 'standby',
      renderStart: null,
      renderStop: null,
      modes: 'fluent', // videoshow or fluent
      stabilization: false,
      showFiles: false,
      fps: 0,
      duration: 4,
      outputFPS: 30,
      emailAddress: "",
      emailPassword: "",
      imageOverlay: "assets/img/LOGO_GO_360.png",
    };
  },
  mounted() {
    // alert(window.location.pathname)
    // alert(this.$route.query.page)
    this.statusText = 'Loading ...'
    this.getProject(this.$route.params.projectID)
    
    // fs.readFile('./client_id_1.json', (err, content) => {
    //   if (err) return console.log('Error loading client secret file:', err);
    //   this.authorize(JSON.parse(content), this.writeTokenFile);
    // });

    // fs.readFile('./client_id_1.json', (err, content) => {
    //   if (err) return console.log('Error loading client secret file:', err);
    //   this.authorize(JSON.parse(content), this.testUpload);
    // });
  },
  methods: {
    sendEmailCredentials(){
      if(this.emailAddress == ''){
        alert("Email cannot be empty")
        return
      }
      if(this.emailPassword == ''){
        alert("Password cannot be empty")
        return
      }
      ipcRenderer.send('email-auth',{
        emailAddress: this.emailAddress,
        emailPassword: this.emailPassword,
      })
    },
    testUpload(auth){
      const drive = google.drive({version: 'v3', auth});
      var fileMetadata = {
        'name': 'photo.jpg',
        'copyRequiresWriterPermission': false,
        'viewersCanCopyContent': true,
      };
      var media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream('./DSC_001s.jpg')
      };
      drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink, viewersCanCopyContent, copyRequiresWriterPermission'
      }, function (err, file) {
        if (err) {
          // Handle error
          console.error(err);
        } else {
          console.log('testUpload');
          console.log('File: ', file);
        }
      });
    },
    open (link) {
      this.$electron.shell.openExternal(link);
    },
    authorize(credentials, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);
      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return this.getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    },
    getAccessToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      ipcRenderer.send('google-auth-widows',authUrl)
      console.log('Authorize this app by visiting this url:', authUrl);
      this.showAlerts(oAuth2Client)
    },
    showAlerts(oAuth2Client){
      Swal.fire({
        title: 'Submit your code',
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Validate',
        showLoaderOnConfirm: true,
        preConfirm: (code) => {
          this.writeToken(oAuth2Client,code)
        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        if (result.value) {
          Swal.fire(
            'Validated',
            'Thank you.',
            'success'
          )
        }
      })
    },
    writeToken(oAuth2Client,code) {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        this.writeTokenFile(oAuth2Client);
      });
    },
    writeTokenFile(auth) {
      console.log('writeTokenFile')
      console.log('auth',auth)
      googleDriveAuth = auth
      this.checkFolderGooDrive(auth,currentProjectGD.name)
      // file has been writen, NOTHING TODO HERE
    },
    checkFolderGooDrive(auth, folderName){
      const drive = google.drive({version: 'v3', auth});
      var fileMetadata = {
        'name': folderName,
        'mimeType': 'application/vnd.google-apps.folder'
      };
      var tis = this
      console.log('checkFolderGooDrive')
      console.log('auth',auth)
      console.log('folderName',folderName)
      drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false and name='"+folderName+"'",
        spaces: 'drive',
        fields: 'nextPageToken, files(id, name, webViewLink)',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        console.log('res.data.files',files)
        if (files.length) {
          console.log('Files:');
          files.map((file) => {
            console.log(file)
            currentProjectGD.google_drive_id = file.id
            currentProjectGD.webViewLink = file.webViewLink
            tis.project.google_drive_id = file.id
            tis.project.webViewLink = file.webViewLink
            tis.project = currentProjectGD
            // UPDATE PROJECT 
            tis.$db.project.update(
              { _id: tis.project._id }, 
              { 
                $set: {
                  google_drive_id: tis.project.google_drive_id,
                  webViewLink: tis.project.webViewLink
                }
              }, 
              {}, 
              function (err, numReplaced) {
              if (err) {
                console.log('tis.$db.project.update ERROR: ', err)
                return
              }
              console.log('tis.$db.project.update', numReplaced)
              console.log('currentProjectGD: ', tis.project);
            });
            tis.createPermission(auth, currentProjectGD.google_drive_id, 'folder')
            console.log(`${file.name} (${file.id}) (${file.webViewLink})`);
          });
        } else {
          console.log('No files found.');
          this.createFolderGooDrive(auth,folderName)
        }
      });
    },
    createFolderGooDrive(auth, folderName){
      const drive = google.drive({version: 'v3', auth});
      var fileMetadata = {
        'name': folderName,
        'mimeType': 'application/vnd.google-apps.folder',
        'copyRequiresWriterPermission': false,
        'viewersCanCopyContent': true
      };
      var tis = this
      drive.files.create({
        resource: fileMetadata,
        fields: 'id, webViewLink, webContentLink, viewersCanCopyContent, copyRequiresWriterPermission'
      }, function (err, file) {
        if (err) {
          // Handle error
          console.error(err);
        } else {
          console.log('Folder: ', file);
          console.log('Folder Id: ', file.data.id);
          currentProjectGD.google_drive_id = file.data.id
          currentProjectGD.webViewLink = file.data.webViewLink
          tis.project.google_drive_id = file.data.id
          tis.project.webViewLink = file.data.webViewLink
          console.log('currentProjectGD: ', currentProjectGD);
          // UPDATE PROJECT 
          tis.$db.project.update(
            { _id: tis.project._id }, 
            { 
              $set: {
                google_drive_id: tis.project.google_drive_id,
                webViewLink: tis.project.webViewLink
              }
            }, 
            {}, 
            function (err, numReplaced) {
            if (err) {
              console.log('tis.$db.project.update ERROR: ', err)
              return
            }
            console.log('tis.$db.project.update', numReplaced)
            console.log('currentProjectGD: ', tis.project);
          });
          tis.createPermission(auth, currentProjectGD.google_drive_id, 'folder')
        }
      });
    },
    createPermission(auth, fileFolderId, fileOrFolder) {
      var tis = this
      const drive = google.drive({version: 'v3', auth});
      drive.permissions.create({
        fileId: fileFolderId,
        resource:{
            role:"reader",
            type:"anyone",
        }}, function(err,result){
          if(err) console.log(err) 
          else {
            console.log('createPermission')
            console.log('result',result)
            // ===========
            console.log(fileOrFolder)
            if (fileOrFolder==='folder') {
              ipcRenderer.send('login-success',tis.project._id) 
            } else {

            }
          }
      });
    },
    uploadClipsToGoogleDrive(auth) {
      var tis = this
      console.log('uploadClipsToGoogleDrive: ');
      const newPath = this.project.folder + '/clips/' + this.clipsNew._id + '.mp4'
      console.log('newPath: ', newPath);
      // console.log('clipPath: ', clipPath);
      // ========== upload to drive
      const drive = google.drive({version: 'v3', auth});
      var fileMetadata = {
        'name': this.clipsNew._id + '.mp4',
        'copyRequiresWriterPermission': false,
        'viewersCanCopyContent': true,
        parents: [this.project.google_drive_id]
      };
      var media = {
        mimeType: 'video/mp4',
        body: fs.createReadStream(newPath)
      };
      drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink, viewersCanCopyContent, copyRequiresWriterPermission'
      }, function (err, file) {
        if (err) {
          // Handle error
          console.error(err);
        } else {
          console.log('File: ', file);
          console.log('File Id: ', file.id);
          // === update clip
          tis.clipsNew.google_drive_id = file.data.id
          tis.clipsNew.webViewLink = file.data.webViewLink
          tis.clipsNew.webContentLink = file.data.webContentLink
          tis.$db.clip.update(
            { _id: tis.clipsNew._id }, 
            { 
              $set: {
                google_drive_id: file.data.id,
                webViewLink: file.data.webViewLink,
                webContentLink: file.data.webContentLink
              }
            }, 
            {}, 
            function (err, numReplaced) {
            if (err) {
              console.log('tis.$db.clip.update ERROR: ', err)
              return
            }
            console.log('tis.$db.project.update', numReplaced)
            console.log('currentProjectGD: ', tis.project);
            console.log('clipsNew: ', tis.clipsNew);
            // empty files
            tis.files = []
            tis.filess = []
            // reset status
            tis.status = 'standby'
            tis.statusText = 'Ready, waiting ' + tis.project.picture_count + ' images'
            tis.statusDanger = false
            tis.statusWarning = false
            tis.statusSuccess = true
            // push refresh
            // ===========
            setTimeout(function() {
              // ipcRenderer.send('refresh-page',saveTo._id)
              ipcRenderer.send(
                'send-to-movie-page',
                {
                  clip_id: tis.clipsNew._id,
                  project_id: tis.project._id,
                  clip_google_drive_id: file.data.id,
                  clip_webViewLink: file.data.webViewLink,
                  clip_webContentLink: file.data.webContentLink
                }
              )
            }, 500);
          });
          // === update clip
          tis.createPermission(auth, file.data.id, 'file')
        }
      });
      // ========== upload to drive
    },
    async moveImages() {
      this.statusText = 'Moving images '
      this.statusWarning = true
      this.statusDanger = false
      this.statusSuccess = false
      // --- save to DB Clips
      // alert(this.projectID)
      console.log(this.project)
      var tis = this
      var saveTo = await clipSaveToDB({
        project: this.$route.params.projectID,
        picture_count: parseInt(this.files.length),
        created_at: parseInt((new Date().getTime() / 1000).toFixed(0)),
        updated_at: parseInt((new Date().getTime() / 1000).toFixed(0)),
        deleted_at: null
      }, this.projectID, this.$db.clip)
      if (!saveTo) {
        return false
      } else {
        this.clipsNew = saveTo
        require('fs').mkdirSync(this.project.folder + '/images/' + saveTo._id )
      }
      console.log('saveTo',saveTo)
      for (let i = 0; i < this.files.length; i++) {
        const oldPath = this.files[i];
        const filename = require('path').basename(oldPath)
        const newPath = this.project.folder + '/images/' + saveTo._id + '/' + filename
        console.log(oldPath)
        console.log(newPath)
        // alert('uploadClipsToGoogleDrive')
        // ---
        require('fs').rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === 'EXDEV') {
                    copy();
                } else {
                    // callback(err);
                }
                return;
            }
            // callback();
        });
        function copy() {
            var readStream = require('fs').createReadStream(oldPath);
            var writeStream = require('fs').createWriteStream(newPath);
            readStream.on('error', callback);
            writeStream.on('error', callback);
            readStream.on('close', function () {
                // require('fs').unlink(oldPath, callback);
            });
            readStream.pipe(writeStream);
        }
        // ---
      }
      // move movie
      var oldPath = this.project.folder + '/video.mp4'
      if (this.stabilization) {
        oldPath = this.project.folder + '/video-deshake.mp4'
        require('fs').unlink(this.project.folder + '/video.mp4', function(){
        });
      }
      const newPath = this.project.folder + '/clips/' + saveTo._id + '.mp4'
      require('fs').rename(oldPath, newPath, function (err) {
          if (err) {
              if (err.code === 'EXDEV') {
                  copy();
              } else {
                  // callback(err);
              }
              return;
          }
          // tis.uploadClipsToGoogleDrive(saveTo,newPath)
          // fs.readFile('./client_id_1.json', (err, content) => {
          //   if (err) return console.log('Error loading client secret file:', err);
          //   tis.authorize(JSON.parse(content), tis.uploadClipsToGoogleDrive);
          //   // === UPDATE STATUS
          //   tis.statusText = 'UPLOAD TO G-DRIVE... '
          //   tis.statusWarning = true
          //   tis.statusDanger = false
          //   tis.statusSuccess = false
          // });
          // callback();
      });
      function copy() {
          var readStream = require('fs').createReadStream(oldPath);
          var writeStream = require('fs').createWriteStream(newPath);
          readStream.on('error', callback);
          writeStream.on('error', callback);
          readStream.on('close', function () {
              // require('fs').unlink(oldPath, callback);
          });
          readStream.pipe(writeStream);
      }
      // empty files
      this.files = []
      this.filess = []
      // reset status
      this.status = 'standby'
      this.statusText = 'Ready, waiting ' + this.project.picture_count + ' images'
      this.statusDanger = false
      this.statusWarning = false
      this.statusSuccess = true
      // push refresh
      // ===========
      setTimeout(function() {
        // ipcRenderer.send('refresh-page',saveTo._id)
        ipcRenderer.send(
          'send-to-movie-page',
          {
            clip_id: saveTo._id,
            project_id: saveTo.project
          }
        )
      }, 500);

    },
    async stabilizationDeShake(videoPath){
      var tis = this
      var ffmpeg = require('fluent-ffmpeg');
      ffmpeg.setFfmpegPath('c:\\ffmpeg\\bin\\ffmpeg.exe');
      var command = ffmpeg();
      command
        .on('progress', function(progress){
          tis.statusText = 'STABILIZING... '+Math.ceil(progress.percent)
          console.log('Percent: ' + progress.percent + "...");
        })
        .on('error', function(err, stdout, stderr) {
          console.log('Cannot process video: ' + err.message);
        })
        .on('end', function() {
          tis.moveImages()
        })
        .input(videoPath)
        .outputOption('-vf deshake')
        .save(this.project.folder+'\\video-deshake.mp4');
    },
    // stabilizationSecondPhase(videoPath){
    //   var ffmpeg = require('fluent-ffmpeg');
    //   ffmpeg.setFfmpegPath('c:\\ffmpeg\\bin\\ffmpeg.exe');
    //   var command = ffmpeg();
    //   var tis = this
    //   console.log('============ start', new Date())   
    //   alert(videoPath)
    //   command
    //     .input(videoPath)
    //     .outputOption('-vf deshake')
    //     .on('progress', function(progress){
    //       console.log('Percent: ' + progress.percent + "...");
    //     })
    //     .on('error', function(err, stdout, stderr) {
    //       console.log('Cannot process video: ' + err.message);
    //     })
    //     .on('end', function() {
    //       console.log('Finished processing');
    //       console.log('============ end', new Date())
    //       setTimeout(function() {
    //         // tis.moveImages()
    //       }, 500);
    //     })
    //     .save(tis.project.folder+'\\video-2.mp4')
    //     // .outputOption('-preset slow')
    //     // .outputOption('-tune film')
    //     // .outputOption('-crf 20') 
    //     // .outputOption('-an')
    //     // .outputOption('-vf vidstabtransform=zoom:5:smoothing=30,unsharp=5:5:0.8:3:3:0.4')
    // },
    async sewingImagesTwo() {
      this.statusText = 'RENDERING... '
      this.statusWarning = true
      this.statusDanger = false
      this.statusSuccess = false

      var tis = this

      console.log('============ start', new Date())      

      var ffmpeg = require('fluent-ffmpeg');
      ffmpeg.setFfmpegPath('c:\\ffmpeg\\bin\\ffmpeg.exe');
      var command = ffmpeg();
      command
        .on('progress', function(progress){
          tis.statusText = 'RENDERING... '+Math.ceil(progress.percent)
          console.log('Percent: ',progress);
        })
        .on('error', function(err, stdout, stderr) {
          console.log('Cannot process video: ' + err.message);
        })
        .on('end', function() {
          console.log('Finished processing');
          console.log('============ end', new Date())
          setTimeout(function() {
            if (tis.stabilization) {
              tis.stabilizationDeShake(tis.project.folder+'\\video.mp4')
            } else {
              tis.moveImages()
            }
          }, 500);
        })
        .input(tis.project.folder+"\\DSC_%03d.jpg")
        .inputFPS(Number(tis.fps))
        .loop(Number(tis.duration))
        .noAudio()
        .outputOption('-pix_fmt yuv420p')
        .outputFPS(Number(tis.outputFPS))
        .save(tis.project.folder+'\\video.mp4');
      // .inputFPS(24)
      // .videoCodec('libx265')
      command.getAvailableCodecs(function(err, codecs) {
        console.log('Available codecs:');
        console.dir(codecs);
      });

      command.getAvailableFilters(function(err, filters) {
        console.log("Available filters:");
        console.dir(filters);
      });
    },
    async sewingImages() {
      this.statusText = 'Begin sewing images '
      this.statusWarning = true
      this.statusDanger = false
      this.statusSuccess = false

      var tis = this

      var videoshow = require('videoshow')
      var options = {
        fps: 24,
        loop: 1/6, // seconds higher devider is faster
        transition: false,
        transitionDuration: 1/6, // seconds higher devider is faster
        videoBitrate: 3000,
        videoCodec: 'libx264',
        size: '1200x?',
        format: 'mp4',
        pixelFormat: 'yuv420p'
      }
      videoshow(this.filess,options)
        .options([])
        .save(this.project.folder + "/video.mp4")
        .on('start', function (command) {
          console.log('ffmpeg process started:', command)
        })
        .on('error', function (err) {
          console.log(err)
          // alert(err)
        })
        .on('end', function (output) {
          console.log(output)
          tis.moveImages()
          tis.renderStop = new Date()
          // alert((tis.renderStop - tis.renderStart) / 1000) 
        })
    },
    async getProject(projectID) {
      this.statusText = 'Get Project ...'
      var asd = await getCurrentProject(this.$db.project, projectID, {
        statusDanger: this.statusDanger,
        statusWarning: this.statusWarning,
        statusSuccess: this.statusSuccess
      })
      this.project = {
        _id: asd._id,
        name: asd.name,
        slug: asd.slug,
        folder: asd.folder,
        picture_count: asd.picture_count,
        image_size: asd.image_size,
        google_drive_id: asd.google_drive_id,
        webViewLink: asd.webViewLink
      }
      console.log('this.project', this.project)
      currentProjectGD = asd
      this.fps = asd.picture_count
      this.outputFPS = asd.picture_count
      this.duration = 4
      if (asd) {
        this.clients = await getCurrentClient(this.$db.client, projectID)
        this.clips = await getCurrentClip(this.$db.clip, projectID)
        // check folder
        var fs = require('fs');
        if (!require('fs').existsSync(asd.folder + '/clips/' )) {
            // make directory
            require('fs').mkdirSync(asd.folder + '/clips/' )
        }
        // check folder
        var fs = require('fs');
        if (!require('fs').existsSync(asd.folder + '/images/' )) {
            // make directory
            require('fs').mkdirSync(asd.folder + '/images/' )
        }
        this.statusText = 'Ready, waiting ' + this.project.picture_count + ' images'
        this.statusDanger = false
        this.statusWarning = false
        this.statusSuccess = true
        
        var tis = this;
        ipcRenderer.send('login-success',tis.project._id)
        
        // ----
        // var watcher = chokidar.watch(this.project.folder, {ignored: /^\./, persistent: true});
        var watcher = chokidar.watch(this.project.folder, {
          ignored: /^\./, 
          persistent: true,
          depth: 0
          });
        watcher
          .on('add', function(path) {
            console.log('File', path, 'has been added')
            var sysPath = require('path')
            if ( sysPath.extname(path).toLowerCase() !== '.jpg' ) {
              // console.log('File not JPG', path)
              return false
            }
            if( tis.files.find(o => o === path) ) {
              // console.log('File already listed', path)
              return false
            } else {
              console.log('tis.status ', tis.status)
              if (tis.status === 'standby') {
                tis.files.push( path )
                // ---
                // require('jimp').read(path, (err, lenna) => {
                //   if (err) {
                //     console.log('Jimp.read')
                //     console.log(err)
                //     alert(err)
                //     return false
                //   }
                //   lenna
                //     .cover(tis.project.image_size, tis.project.image_size) // resize
                //     .quality(100) // set JPEG quality
                //     .write(path); // save
                // });
                // ---
                tis.files.sort(sortAlphaNum)
              }
              if ( tis.files.length == (tis.project.picture_count) ) {
                if (tis.modes==='videoshow') {
                  tis.renderStart = new Date()
                  tis.statusText = 'Duplicating'
                  tis.status = 'duplicating'
                  var count = 1
                  tis.filess = []
                  for (let i = 0; i < tis.files.length; i++) {
                    const element = tis.files[i];
                    tis.filess.push(element)
                  }
                  for (var i = (tis.files.length-1); i-- > 1; ) {
                    // tis.files.push(tis.files[i])
                    tis.filess.push(tis.files[i])
                  }
                  // for (let i = 1; i < tis.files.length-1; i++) {
                  //   const element = tis.files[i];
                  //   tis.filess.push(element)
                  // }
                  for (let i = 0; i < tis.files.length; i++) {
                    const element = tis.files[i];
                    tis.filess.push(element)
                  }
                  for (var i = (tis.files.length-1); i-- > 1; ) {
                    tis.filess.push(tis.files[i])
                  }
                }
                if (tis.modes==='fluent') {
                  tis.beginDuplicatingFiles()
                  
                  // var counterTWO = tis.project.picture_count*2-1
                  // for (let ii = 1; ii < tis.project.picture_count; ii++) {
                  //   counterTWO +=1
                  //   if (counterTWO<10) {
                  //     addZero = '0'
                  //   } else {
                  //     addZero = ''
                  //   }
                  //   fs.copyFile(tis.files[ii], tis.project.folder+'\\DSC_0'+addZero+counterTWO+'.jpg', (err) => {
                  //   });
                  // }
                  // var counterTHREE = tis.project.picture_count*3-2
                  // for (var iii = (tis.project.picture_count-1); iii-- > 0; ) {
                  //   counterTHREE +=1
                  //   if (counterTHREE<10) {
                  //     addZero = '0'
                  //   } else {
                  //     addZero = ''
                  //   }
                  //   fs.copyFile(tis.files[iii], tis.project.folder+'\\DSC_0'+addZero+counterTHREE+'.jpg', (err) => {
                  //   });
                  // }
                }
              }
              // if ( tis.files.length === (tis.project.picture_count * 2 - 2) ) {
              if ( tis.files.length === (tis.project.picture_count * 2 - 1) ) {
                if (tis.modes==='videoshow') {
                  tis.sewingImages()
                }
                 if (tis.modes==='fluent') {
                   tis.sewingImagesTwo()
                 }
              }
            }
          })
          .on('change', function(path) {
            // console.log('File', path, 'has been changed')
          })
          .on('unlink', function(path) {
            // console.log('File', path, 'has been removed')
          })
          .on('error', function(error) {
            console.error('Error happened', error)
            // alert(error)
          })
        // ----
      }
    },
    async beginDuplicatingFiles() {
      var addZero = ''
      if (this.project.picture_count*2<10) {
        addZero = '0'
      } else {
        addZero = ''
      }
      var esc = await duplicateFiles(this.files[0],this.project.folder+'\\DSC_0'+(this.project.picture_count*2)+'.jpg')
      // fs.copyFile(tis.files[0], tis.project.folder+'\\DSC_0'+addZero+(tis.project.picture_count*2)+'.jpg', (err) => {
      // });
      // var tis = this
      // ========
      // const fs = require('fs');
      var counter = this.project.picture_count
      for (var i = (this.files.length-1); i-- > 0; ) {
        //  duplicate
        counter += 1
        var addZero = ''
        if (counter<10) {
          addZero = '0'
        } else {
          addZero = ''
        }
        var esc = await duplicateFiles(this.files[i],this.project.folder+'\\DSC_0'+addZero+counter+'.jpg')
        // fs.copyFile(this.files[i], this.project.folder+'\\DSC_0'+addZero+counter+'.jpg', (err) => {
        // });
        console.log('counter',counter)
        console.log('i',i)
        console.log('addZero',addZero)
        console.log('filename',this.project.folder+'\\DSC_0'+addZero+counter+'.jpg')
      }
      
      // ========
    }
  }
}
</script>

<style>

</style>