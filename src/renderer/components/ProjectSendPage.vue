<template>
  <div id="wrapper">
    <h1 class="title">{{project.name}}</h1>
    <!-- <h2 class="subtitle">{{ project.folder }}</h2> -->
    <center>
      <a @click="refreshPage" class="button is-link is-large">Refresh Page</a>
    </center>
    <div style="height:30px;"></div>
    <main>
      <div class="columns is-multiline">
        <div class="column is-one-third" v-bind:key="clip._id" v-for="(clip, index) in clips">
          <div class="card">
            <div class="card-image">
              <figure class="image is-4by3">
                <img v-bind:src="project.folder+'/images/'+clip._id+'/DSC_001.jpg'" alt="Placeholder image">
              </figure>
            </div>
            <div class="card-content">
              <span class="tag is-black">{{index+1}}</span>
              <a class="button is-small is-link is-rounded modal-button" v-on:click="showModal(clip)">Preview</a>
              <br>
              {{ new Date(clip.created_at * 1000).toLocaleDateString("en-US", {hour: "2-digit", minute: "2-digit", second: "2-digit"} ) }}
            </div>
          </div>
        </div>
      </div>
    </main>
    <div class="modal" v-bind:class="{'is-active':isModalActive}" >
      <div class="modal-background"></div>
      <div class="modal-content">
        <div class="columns">
          <div class="column is-three-fifths">
            <center>
              <div v-html="videoPanel"></div>
            </center>
          </div>
          <div class="column">
            <!-- Second column -->
            <div class="field">
              <label class="label">
                <font-awesome-icon icon="envelope" /> Email
              </label>
              <div class="control has-icons-left has-icons-right">
                <input class="input is-rounded" v-model.trim="inputEmail" v-bind:class="{'is-danger':emailDanger, 'is-success':emailSuccess}" type="email" placeholder="Email address" value="">
                <span class="icon is-small is-left">
                  <font-awesome-icon icon="envelope" />
                </span>
                <span class="icon is-small is-right">
                  <i class="fas fa-exclamation-triangle"></i>
                </span>
              </div>
              <p class="help" v-bind:class="{'is-danger':emailDanger}">{{emailHelpMessage}}</p>
            </div>
            <div class="field" style="">
              <label class="label">
                <font-awesome-icon :icon="['fab', 'whatsapp']" /> Whatsapp
              </label>
              <div class="control has-icons-left has-icons-right">
                <input class="input is-rounded" v-model.trim="inputWhatsapp" v-bind:class="{'is-danger':whatsappDanger, 'is-success':whatsappSuccess}"  type="tel" placeholder="Whatsapp number" value="">
                <span class="icon is-small is-left">
                  <font-awesome-icon :icon="['fab', 'whatsapp']" />
                  <!-- <i class="fas fa-envelope"></i> -->
                </span>
                <span class="icon is-small is-right">
                  <i class="fas fa-exclamation-triangle"></i>
                </span>
              </div>
              <p class="help" v-bind:class="{'is-danger':whatsappDanger, 'is-success':whatsappSuccess}">{{whatsappHelpMessage}}</p>
            </div>
            <a @click="sendVideo" class="button is-link is-large is-fullwidth">
              <font-awesome-icon :icon="['fas', 'paper-plane']" />&nbsp;&nbsp;SEND
            </a>
            <!-- Second column -->
          </div>
        </div>
        
        <!--  -->
        <div class="columns">
          <div class="column is-three-quarters">
            
          </div>
          <div class="column">
            <center>
              
            </center>
          </div>
        </div>
        <!--  -->
      </div>
      <button @click="closeModal" class="modal-close is-large" aria-label="close"></button>
    </div>
  </div>
</template>

<style>
.field .label {
  color: antiquewhite !important;
}
.button.is-link.is-large.is-fullwidth {
  /* min-height: 100px; */
  /* margin-top: 40px; */
}
@media screen and (min-width: 769px), print {
  .modal-content, .modal-card {
      margin: 0 auto;
      max-height: calc(100vh - 40px);
      width: 840px;
  }
}
.modal-content::-webkit-scrollbar {
  display: none
}
</style>


<script>
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
    modelClip.find({ project: projectID }).sort({ created_at: -1 }).exec(function (err, newDoc) {
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
  name: 'project-send',
  components: { },
  data() {
    return {
      projectID: this.$route.params.projectID,
      project:{},
      clips:[],
      isModalActive: false,
      clipMoviePath: "",
      videoPanel: "",
      inputEmail: "",
      inputWhatsapp: "081",
      emailDanger: false,
      emailSuccess: false,
      emailHelpMessage: "",
      whatsappDanger: false,
      whatsappSuccess: false,
      whatsappHelpMessage: "",
    };
  },
  mounted() {
    this.getProject(this.$route.params.projectID)
  },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link);
    },
    validEmail: function (email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },
    async sendVideo() {
      if (this.inputEmail === "") {
        this.emailDanger = true
        this.emailHelpMessage = "Email empty"
      } else {
        this.emailDanger = false
        this.emailHelpMessage = ""
      }
      if (!this.validEmail(this.inputEmail)) {
        this.emailDanger = true
        this.emailHelpMessage = "Email not valid"
      } else {
        this.emailDanger = false
        this.emailHelpMessage = ""
      }
      if (this.inputWhatsapp === "") {
        this.whatsappDanger = true
        this.whatsappHelpMessage = "Whatsapp empty"
      } else {
        this.whatsappDanger = false
        this.whatsappHelpMessage = ""
      }
      if (this.emailDanger || this.whatsappDanger) {
        return
      }
      // begin mail
      const nodemailer = require("nodemailer")
      const fs = require('fs')
      var smtpConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL, you can try with TLS, but port is then 587
        auth: {
          user: 'go360booth.machina', // Your email id
          pass: 'go360booth2019' // Your password
        }
      };
      var transporter = nodemailer.createTransport(smtpConfig);
      let mailOptions = {
        from: '"Go 360 Booth" <go360booth.machina@gmail.com>', // sender address
        to: this.inputEmail, // list of receivers
        subject: this.project.name, // Subject line
        text: "Your video is here", // plain text body
        html: "<b>Your video is here</b>", // html body
        attachments: [{   // file on disk as an attachment
          filename: 'videonya.mp4',
          path: this.clipMoviePath,
        }]
      };
      // send mail with defined transport object
      let info = transporter.sendMail(mailOptions)
      console.log("email", info)
      this.inputEmail = ""
      this.isModalActive = true;
      // var {ipcRenderer} = require('electron')
      // ipcRenderer.send('refresh-page','asolole')
    },
    refreshPage: function() {
      var {ipcRenderer} = require('electron')
      ipcRenderer.send('refresh-page','asolole')
    },
    closeModal: function() {
      this.isModalActive = false;
    },
    showModal: function(clip) {
      console.log("clip",clip)
      //project.folder+'/images/'+clip._id+'/DSC_001.jpg'
      var moviePath = this.project.folder + "\\clips\\" + clip._id + ".mp4"
      console.log("moviePath",moviePath)
      this.clipMoviePath = moviePath
      this.isModalActive = true;
      this.videoPanel = '<video width="80%" height="auto" autoplay loop muted>' +
          '<source src="'+moviePath+'" type="video/mp4">' +
        'Your browser does not support the video tag.' +
        '</video>'
    },
    async getProject(projectID) {
      var proj = await getCurrentProject(this.$db.project, projectID, {})
      this.project = proj
      console.log('this.project', this.project)
      var cli = await getCurrentClip(this.$db.clip, projectID, {})
      this.clips = cli
      console.log('this.clips', this.clips)
      this.clipMoviePath = ""
      if(cli.length){
        this.isModalActive = true
        this.showModal(cli[0])
      }
    }
  }
}
</script>

<style>

</style>