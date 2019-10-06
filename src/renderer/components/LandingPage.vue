<template>
  <div id="wrapper">
    <center>
      <div class="logo">
        <img src="~@/assets/img/LOGO_GO_360.png" alt="electron-vue" width="250" height="auto">
        <img src="" alt="">
      </div>
    </center>
    <!-- <h1 class="title">All Project</h1> -->
    <main>

      
      
      <router-link class="button is-link is-rounded" to="/new-project">
        New Project
      </router-link>

      <div style="height:20px;"></div>
      

      <div class="card" v-bind:key="project.slug" v-for="(project, index) in projects" >
        <div class="card-content">
          <p class="title">
            {{index+1}}. {{project.name}}
          </p>
          <p class="subtitle">
            {{project.slug}} <br>
            {{project.folder}}
          </p>
          <router-link class="button is-primary" :to="{ name: 'project', params: { projectID: project._id }}">Continue</router-link>
          <a class="button is-danger" style="float:right;" v-on:click="deletes(project._id, project)"><font-awesome-icon icon="trash" /></a>
        </div>
        <footer class="card-footer">
          <p class="card-footer-item">
            {{ new Date(project.created_at * 1000).toUTCString() }}
          </p>
          <p class="card-footer-item">
            Clips:
            <!-- {{ project.clips }} -->
          </p>  
          <p class="card-footer-item">
            Clients: 
          </p>
        </footer>
      </div>

    </main>
  </div>
</template>

<style>
::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 20px;
}
::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0,0,0,.5);
    -webkit-box-shadow: 0 0 1px rgba(255,255,255,.5);
}
</style>

<script>
const cekAllProjectClipsDB = (dbClip, projectID) => {
  return new Promise((resolve, reject) => {
    dbClip.find({project: projectID}, function (err, newDoc) {
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
const getAllProjectDB = (dbProject,dbClip) => {
  return new Promise((resolve, reject) => {
    dbProject.find({deleted_at: null}).sort({ created_at: -1 }).exec(function (err, newDoc) {
      if (err) {
        alert(err)
        reject(err)
        return
      }
      resolve(newDoc)
    });
  });
};

export default {
  name: 'landing-page',
  components: { },
  data() {
    return {
      projects: [],
      project_clips: [],
    };
  },
  mounted() {
    this.getAllProjectAndDetail()
    // this.getTeams().then(data => {
    // 	alert(data)
    // });
  },
  methods: {
    deletes(ids, project) {
      const { dialog } = require('electron').remote
      const dialogOptions = {type: 'info', buttons: ['OK', 'Cancel'], message: 'Delete '+project.name+'\r\nDo it?'}
      dialog.showMessageBox(dialogOptions, i => {
        if (i==0) {
          this.$db.project.update(
            { _id: project._id }, 
            {
              $set: {
                deleted_at: parseInt((new Date().getTime() / 1000).toFixed(0))
              } 
            }, 
            {}, 
            function (err, numReplaced) {
              if (err) {
                console.log('ERROR: ', err)
                return
              }
              console.log(numReplaced)
              location.reload()
          });
        }
      })
    },
    async getAllProjectAndDetail() {
      this.projects = await getAllProjectDB(this.$db.project, this.$db.clip)
      console.log(this.projects)
      for (let i = 0; i < this.projects.length; i++) {
        const element = this.projects[i];
        element.clips = []
        element.clips = await cekAllProjectClipsDB(this.$db.clip, this.projects[i]._id)
        console.log(this.projects[i])
      }
    },
    open (link) {
      this.$electron.shell.openExternal(link);
    }
  }
}
</script>