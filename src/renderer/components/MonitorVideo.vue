<style scoped>
#wrapper {
  background: #333;
  padding-top: 0px;
  padding-bottom: 0px;
}
</style>

<template>
  <div id="wrapper" style="">
    <div v-html="videoPanel"></div>
  </div>
</template>


<script>
var {ipcRenderer} = require('electron')
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
  name: 'monitor-video',
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
    var tis = this
    
    ipcRenderer.on('push-to-movie-page', function (event, payloads) {
      var moviePath = tis.project.folder + "\\clips\\" + payloads.clip_id + ".mp4"
      console.log("moviePath",moviePath)
      tis.clipMoviePath = moviePath
      tis.videoPanel = '<video width="100%" height="auto" autoplay loop muted>' +
          '<source src="'+moviePath+'" type="video/mp4">' +
        'Your browser does not support the video tag.' +
        '</video>'
      // alert(payloads)
      // console.log('========= send-to-movie-page =========', payloads, "========= send-to-movie-page =========")
    })
  },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link);
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
        // this.isModalActive = true
        // this.showModal(cli[0])
        var moviePath = this.project.folder + "\\clips\\" + cli[0]._id + ".mp4"
        console.log("moviePath",moviePath)
        this.clipMoviePath = moviePath
        this.videoPanel = '<video width="100%" height="auto" autoplay loop muted>' +
            '<source src="'+moviePath+'" type="video/mp4">' +
          'Your browser does not support the video tag.' +
          '</video>'
      }
    }
  }
}
</script>

<style>

</style>