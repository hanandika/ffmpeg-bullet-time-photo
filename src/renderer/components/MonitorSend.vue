<style scoped>
#wrapper {
  background: #333;
  /* padding: 0px 80px 60px 80px; */
  height: 100vh;
}
.disabled {
  background-color: #3273dc;
  border-color: transparent;
  box-shadow: none;
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
.column {
  /* border: 1px solid red; */
}
.modal h1 {
  font-size: 34px;
  color: antiquewhite;
}
</style>

<template>
  <div id="wrapper" style="">
    <div class="columns" style="">
        <div class="column">
          <div v-html="videoPanel"></div>
          <div class="columns">
            <div class="column is-half">
              <a class="button is-fullwidth is-link" @click.prevent="changeClips(true,false)" v-bind:class="{'disabled':prevButtonDisabled}">Next</a>
            </div>
            <div class="column is-half">
              <a class="button is-fullwidth is-link" @click.prevent="changeClips(false,true)" v-bind:class="{'disabled':nextButtonDisabled}">Prev</a>
            </div>
          </div>
        </div>
      
      <div class="column is-half">
        <div class="field">
          <label class="label">
            <font-awesome-icon icon="envelope" /> Email / <font-awesome-icon :icon="['fab', 'whatsapp']" /> Whatsapp
          </label>
          <div class="control has-icons-left">
            <input ref="inputEmail" class="input is-rounded" v-model.trim="inputEmail" v-bind:class="{'is-danger':emailDanger, 'is-success':emailSuccess}" type="email" placeholder="Email / Whatsapp" value="" style="font-size: 20px; padding-left: 1em;">
            <!-- 
              <span class="icon is-small is-left">
              <font-awesome-icon icon="envelope" /> / <font-awesome-icon :icon="['fab', 'whatsapp']" />
            </span> 
            -->
          </div>
          <p class="help" v-bind:class="{'is-danger':emailDanger}" style="min-height: 18px;">{{emailHelpMessage}}</p>
          <div style="height:2px;"></div>
          <span class="button" @click="pasteLastValue">Paste last value</span>
        </div>
        <div>
          <p>
            <span class="tag" v-bind:class="{'is-danger':emailAddressDanger, 'is-success':emailAddressSuccess}">Email: {{ emailAddress }}
            </span>
            <span class="tag" v-bind:class="{'is-danger':emailPasswordDanger, 'is-success':emailPasswordSuccess}">Pass: ****
            </span>
          </p>
        </div>
        <p>{{clip_webContentLink}}</p>
      </div>
      <div class="column">
        <div style="height:30px;"></div>
        <a @click="sendVideo" class="button is-large is-fullwidth is-primary" style="height:100px;">
          <font-awesome-icon :icon="['fas', 'paper-plane']" />&nbsp;&nbsp;Send
        </a>
      </div>
    </div>

    <div class="modal" v-bind:class="{'is-active':isModalActive}" >
      <div class="modal-background"></div>
        <div class="modal-content">
          <center>
            <h1 v-html="textModal"></h1>
          </center>
        </div>
      <button @click="closeModal" class="modal-close is-large" aria-label="close"></button>
    </div>

  </div>
</template>


<script>
// ====
var {ipcRenderer} = require('electron')
var clipMoviePath2
// ====
const getCurrentProject = (dbProject,projectID, status) => {
  return new Promise((resolve, reject) => {
    dbProject.findOne({ _id: projectID }, function (err, newDoc) {
      if (err) {
        alert(err)
        console.log('searchDatabase', 'err', err)
        reject(err)
      }
      else {
        resolve(newDoc)
      }
    });
  });
};
const getCurrentClip = (modelClip,projectID, status) => {
  return new Promise((resolve, reject) => {
    modelClip.find({ project: projectID }).sort({ createdAt: -1 }).exec(function (err, newDoc) {
      if (err) {
        alert(err)
        console.log('searchDatabase', 'err', err)
        reject(err)
      }
      else {
        resolve(newDoc)
      }
    });
  });
};

export default {
  name: 'monitor-video',
  components: { },
  data() {
    return {
      projectID: this.$route.params.projectID,
      project:{},
      clips:[],
      isModalActive: false,
      clipMoviePath: "",
      clip_webViewLink: "",
      clip_webContentLink: "",
      clip_google_drive_id: "",
      videoPanel: "",
      inputEmail: "",
      inputWhatsapp: "081",
      emailDanger: false,
      emailSuccess: false,
      emailHelpMessage: "",
      indexActive: 0,
      prevButtonDisabled: true,
      nextButtonDisabled: true,
      lastValueSendMailWA: "",
      textModal: "",
      emailAddress: "",
      emailAddressSuccess: false,
      emailAddressDanger: true,
      emailPasswordSuccess: false,
      emailPasswordDanger: true,
    };
  },
  mounted() {
    this.getProject(this.$route.params.projectID)
    var tis = this
    
    ipcRenderer.on('push-to-movie-page', function (event, payloads) {

      tis.getProjectNewClips(payloads.project_id)
    //   var moviePath = tis.project.folder + "\\clips\\" + payloads.clip_id + ".mp4"
    //   console.log("moviePath",moviePath)
    //   tis.clipMoviePath = moviePath
    //   tis.videoPanel = '<video width="100%" height="auto" autoplay loop muted>' +
    //       '<source src="'+moviePath+'" type="video/mp4">' +
    //     'Your browser does not support the video tag.' +
    //     '</video>'
      console.log('========= send-to-movie-page =========', payloads, "========= send-to-movie-page =========")
    })
    ipcRenderer.on('push-to-movie-page-email-auth', function (event, payloads) {
      tis.emailAddress = payloads.emailAddress
      tis.emailPassword = payloads.emailPassword
      if (payloads.emailAddress == '') {
        tis.emailAddressDanger = true
        tis.emailAddressSuccess = false
      } else {
        tis.emailAddressDanger = false
        tis.emailAddressSuccess = true
      }
      if (payloads.emailPassword == '') {
        tis.emailPasswordDanger = true
        tis.emailPasswordSuccess = false
      } else {
        tis.emailPasswordDanger = false
        tis.emailPasswordSuccess = true
      }
    })
  },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link);
    },
    validEmail: function (email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },
    validPhoneNumber: function (inputtxt) {
      var re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
      return re.test(inputtxt);
    },
    // validPhoneNumber(inputtxt) {
    //   alert(inputtxt)
    //   var phoneno = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
    //   if(inputtxt.value.match(phoneno)) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // },
    closeModal: function() {
      this.isModalActive = false;
      this.$nextTick(() => this.$refs.inputEmail.focus())
    },
    async pasteLastValue() {
      this.inputEmail = this.lastValueSendMailWA
    },
    async sendVideoEmail() {
      // =====
      // begin mail
      const nodemailer = require("nodemailer")
      const fs = require('fs')
      var smtpConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL, you can try with TLS, but port is then 587
        // auth: {
        //   user: 'go360booth.machina', // Your email id
        //   pass: 'go360booth2019' // Your password
        // }
        // auth: {
        //   user: 'contact@go360.id', // Your email id
        //   pass: 'Go360KaryaIndonesia' // Your password
        // }
        auth: {
          user: this.emailAddress, // Your email id
          pass: this.emailPassword // Your password
        }
        
      };
      var transporter = nodemailer.createTransport(smtpConfig);
      let mailOptions
      // if (this.clip_webContentLink !== "" || this.clip_webContentLink === undefined) {
      //   // send with Google Drive link
      //   mailOptions = {
      //     from: '"Go 360 Booth" <contact@go360.id>', // sender address
      //     to: this.inputEmail, // list of receivers
      //     subject: this.project.name, // Subject line
      //     text: "Klik LINK dibawah ini untuk mengunduh Video anda\\r\\n" + this.clip_webContentLink, // plain text body
      //     html: "Klik LINK dibawah ini untuk mengunduh Video anda<br/>" + this.clip_webContentLink, // html body    
      //   };
      // } else {
        // send with attachment
        mailOptions = {
          from: ''+this.emailAddress+'', // sender address
          to: this.inputEmail, // list of receivers
          subject: this.project.name, // Subject line
          text: "Video anda dibawah ini", // plain text body
          html: "<b>Video anda dibawah ini</b>", // html body
          attachments: [{   // file on disk as an attachment
            filename: 'videonya.mp4',
            path: this.clipMoviePath,
          }]
        };
      // }
      // send mail with defined transport object
      let info = transporter.sendMail(mailOptions)
      this.lastValueSendMailWA = this.inputEmail
      this.emailDanger = false
      this.emailHelpMessage = ""
      this.isModalActive = true
      this.textModal = "Email sent to <i>" + this.inputEmail + "</i>"
      this.inputEmail = ""
      this.$nextTick(() => this.$refs.inputEmail.focus())
      var tis = this
      setTimeout(function() {
        tis.closeModal()
      }, 1000);
      // =====
    },
    async sendVideoWhatsapp() {
      var encoded = encodeURIComponent(this.clip_webContentLink)
      if (this.clip_webContentLink !== "") {
        // ===
        ipcRenderer.send(
          'send-to-what-app',
          {
            number: this.inputEmail,
            message: "Klik LINK berikut ini untuk mengunduh Video anda " + encoded
          }
        )
        // ===
        this.lastValueSendMailWA = this.inputEmail
        this.emailDanger = false
        this.emailHelpMessage = ""
        this.isModalActive = true
        this.textModal = "Whatsapp sent to <i>" + this.inputEmail + "</i>"
        this.inputEmail = ""
        this.$nextTick(() => this.$refs.inputEmail.focus())
        var tis = this
        setTimeout(function() {
          tis.closeModal()
        }, 1000);
      } else {
        alert('no video on google drive')
      }
      // fs.readFile('./client_id_1.json', (err, content) => {
      //   if (err) return console.log('Error loading client secret file:', err);
      //   // Authorize a client with credentials, then call the Google Drive API.
      //   authorize(JSON.parse(content), uploadFile);
      // });
    },
    async sendVideo() {
      if (this.inputEmail === "") {
        this.emailDanger = true
        this.emailHelpMessage = "Cannot be empty"
        return
      }
      if (this.emailAddressDanger == true || this.emailAddress === "") {
        this.emailAddressDanger = true
        this.emailAddressSuccess = false
        alert("Email Address Sender cannot be EMPTY")
        return
      }
      if (this.emailPasswordDanger == true || this.emailPassword === "") {
        this.emailPasswordDanger = true
        this.emailPasswordSuccess = false
        alert("Email Address Sender cannot be EMPTY")
        return
      }
      if (this.validEmail(this.inputEmail)) {
        this.sendVideoEmail()
      } else {
        if (this.validPhoneNumber(this.inputEmail)) {
          this.sendVideoWhatsapp()
        } else {

        }
      }
    },
    changeClips(prev,next){
      if (prev) {
        this.indexActive -= 1
      }
      if (next) {
        this.indexActive += 1
      }
      // alert('changeClips ' + prev + ' ' + next)
      // alert('activeIndex ' + this.indexActive)
      this.checkIndex(this.clips, this.indexActive)
    },
    checkIndex(arrayObject, activeIndex) {
      this.indexActive = activeIndex
      // ===

      
      this.clip_webViewLink = arrayObject[activeIndex].webViewLink
      this.clip_webContentLink = arrayObject[activeIndex].webContentLink
      // ===
      if (arrayObject.length == 0) {
        this.prevButtonDisabled = false
        this.nextButtonDisabled = false
      }
      if (activeIndex == 0 && arrayObject.length == 1) {
        this.prevButtonDisabled = false
        this.nextButtonDisabled = false
      }
      if (activeIndex == 0 && arrayObject.length > 1) {
        this.prevButtonDisabled = true
        this.nextButtonDisabled = false
      }
      if (activeIndex > 0 && activeIndex < (arrayObject.length - 1) ) {
        this.prevButtonDisabled = false
        this.nextButtonDisabled = false
      }
      if (activeIndex > 0 && activeIndex == (arrayObject.length - 1) ) {
        this.prevButtonDisabled = false
        this.nextButtonDisabled = true
      }
      var moviePath = this.project.folder + "\\clips\\" + arrayObject[activeIndex]._id + ".mp4"
      console.log("moviePath",moviePath)
      this.clipMoviePath = moviePath
      clipMoviePath2 = moviePath
      this.videoPanel = '<video width="100%" height="auto" autoplay loop muted>' +
          '<source src="'+moviePath+'" type="video/mp4">' +
        'Your browser does not support the video tag.' +
        '</video>'

        // ===
        ipcRenderer.send(
          'navigating-movie-send-page',
          {
            clip_id: arrayObject[activeIndex]._id,
            project_id: arrayObject[activeIndex].project
          }
        )
        // ===
    },
    async getProjectNewClips(projectID) {
      this.$db.project.loadDatabase();
      this.$db.clip.loadDatabase();
      // ----
      var proj = await getCurrentProject(this.$db.project, projectID, {})
      this.project = proj
      console.log('this.project', this.project)
      var cli = await getCurrentClip(this.$db.clip, projectID, {})
      this.clips = cli
      console.log('this.clips', this.clips)
      this.clipMoviePath = ""
      this.clipMoviePath2 = ""
      if(cli.length){
        this.checkIndex(cli,0)
      }
    },
    async getProject(projectID) {
      var proj = await getCurrentProject(this.$db.project, projectID, {})
      this.project = proj
      console.log('this.project', this.project)
      var cli = await getCurrentClip(this.$db.clip, projectID, {})
      this.clips = cli
      console.log('this.clips', this.clips)
      this.clipMoviePath = ""
      this.clipMoviePath2 = ""
      if(cli.length){
        this.checkIndex(cli,0)
      }
    }
  }
}
</script>

<style>

</style>