<template>
  <div id="wrapper">
    <h1 class="title">New Project</h1>
    <main>
      <form id="signup-form" action="/watch" @submit.prevent="processForm" style="padding-right:60px;">

      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label new-project">Name</label>
        </div>
        <div class="field-body">
          <div class="field">
            <p class="control">
              <input name="name" v-model.trim="name" class="input is-rounded" type="text" placeholder="Name of the current project" v-bind:class="{ 'is-danger': nameIsDanger, 'is-success': nameIsSuccess }">
            </p>
            <p class="help" v-bind:class="{ 'is-danger': nameIsDanger, 'is-success': nameIsSuccess }" v-html="nameHelpText"></p>
          </div>
        </div>
      </div>
      
      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label new-project">Folder to watch</label>
        </div>
        <div class="field-body">
          <div class="field">
            <div class="file has-name is-fullwidth ">
              <label class="file-label is-rounded">
                <input class="file-input" ref="folderToWatch" type="file" name="folder" webkitdirectory="" directory="" @change="folderPath">
                <span class="file-cta">
                  <span class="file-icon">
                    <i class="fas fa-upload"></i>
                  </span>
                  <span class="file-label">
                    Choose a folder …
                  </span>
                </span>
                <span class="file-name" v-html="folderPathText">
                  &nbsp;
                </span>
              </label>
            </div>
            <p class="control">
              <!-- <input type="file" id="outputDir" class="input is-rounded" webkitdirectory="" directory=""/> -->
              <!-- <input name="folder" v-model.trim="folder" class="input is-rounded" type="text" placeholder="Path of the active folder to watch" v-bind:class="{ 'is-danger': folderIsDanger, 'is-success': folderIsSuccess }"> -->
            </p>
            <p class="help" v-bind:class="{ 'is-danger': folderIsDanger, 'is-success': folderIsSuccess }" v-html="folderHelpText"></p>
          </div>
        </div>
      </div>

      <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label new-project">Picture Count</label>
        </div>
        <div class="field-body">
          <div class="field">
            <div class="control">
              <div class="select" v-bind:class="{ 'is-danger': pictureCountIsDanger, 'is-success': pictureCountIsSuccess }">
                <select v-model="pictureCount">
                  <option disabled value="">Select </option>
                  <option >3</option>
                  <option >6</option>
                  <option >9</option>
                  <option >12</option>
                  <option >15</option>
                  <option >18</option>
                </select>
              </div>
            </div>
            <p class="help" v-bind:class="{ 'is-danger': pictureCountIsDanger, 'is-success': pictureCountIsSuccess }" v-html="pictureCountHelpText"></p>
          </div>
        </div>
      </div>

      <!-- <div class="field is-horizontal">
        <div class="field-label is-normal">
          <label class="label">Image Size</label>
        </div>
        <div class="field-body">
          <div class="field">
            <p class="control">
              <input name="imageSize" v-model.trim="imageSize" class="input is-rounded" type="text" placeholder="Image Cropped Size">
            </p>
            <p class="help" v-bind:class="{ 'is-danger': imageSizeIsDanger, 'is-success': imageSizeIsSuccess }" v-html="imageSizeHelpText"></p>
          </div>
        </div>
      </div> -->

      <div class="field is-horizontal">
        <div class="field-label">
          <!-- Left empty for spacing -->
        </div>
        <div class="field-body">
          <div class="field">
            <div class="control">
              <button class="button is-primary" v-html="buttonSubmitText" :disabled=isDisabled>
                Create
              </button>
              <router-link class="button is-text" to="/">Back</router-link>
            </div>
            <p class="help" v-html="buttonSubmitHelp"></p>
            <div>
              
            </div>
          </div>
        </div>
      </div>

      </form>
    </main>
  </div>
</template>


<style>
  .field .label.new-project {
    color: #363636 !important;
  }
</style>



<script>
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
const searchDatabase = (dbProject, object) => {
  return new Promise((resolve, reject) => {
    dbProject.find({ slug: object.slug }, function (err, newDoc) {
      if (err) {
        alert(err)
        console.log('searchDatabase', 'err', err)
        reject(err)
      }
      if(newDoc.length) {
        var randomise = randomize(2)
        resolve({
          name: object.name,
          slug: object.slug + '-' + randomise,
        })
      }
      else {
        resolve(object)
      }
    });
  });
};
const saveToDB = (project,dbProject,isDisab) => {
  return new Promise((resolve, reject) => {
    dbProject.insert(project, function (err, newDoc) {
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
const cekAllProjectDB = (dbProject) => {
  return new Promise((resolve, reject) => {
    dbProject.find({}, function (err, newDoc) {
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

export default {
  name: 'new-project',
  components: { },
  data() {
    return {
      name: '',
      slug: '',
      folder: '',
      nameIsDanger: false,
      nameIsSuccess: false,
      nameHelpText: '&nbsp;',
      folderIsDanger: false,
      folderIsSuccess: false,
      folderHelpText: '&nbsp;',
      folderPathText: '&nbsp;',
      pictureCount: '',
      pictureCountIsDanger: false,
      pictureCountIsSuccess: false,
      pictureCountHelpText: '&nbsp;',
      imageSize: '1024',
      imageSizeIsDanger: false,
      imageSizeIsSuccess: false,
      imageSizeHelpText: '&nbsp;',
      buttonSubmitText: 'Create',
      buttonSubmitHelp: '',
      isDisabled: false,
      files: [],
    };
  },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link);
    },
    folderPath() {
      this.files = this.$refs.folderToWatch.files
      if (this.files[0]) {
        this.folder = this.files[0].path
        this.folderIsDanger = false
        this.folderIsSuccess = true
        this.folderPathText = this.folder
        this.folderHelpText = '&nbsp;'
      } else {
        this.folderIsDanger = true
        this.folderIsSuccess = false
        this.folderPathText = '&nbsp;'
        this.folderHelpText = 'Cannot be empty';
      }
    },
    async processForm() {
      if(this.name === ''){
        this.nameIsDanger = true;
        this.nameIsSuccess = false;
        this.nameHelpText = 'Cannot be empty';
      } else {
        this.nameIsDanger = false;
        this.nameIsSuccess = true;
        this.nameHelpText = '&nbsp;';
      }
      if(this.folder === ''){
        this.folderIsDanger = true;
        this.folderIsSuccess = false;
        this.folderHelpText = 'Cannot be empty';
      } else {
        this.folderIsDanger = false;
        this.folderIsSuccess = true;
        this.folderHelpText = '&nbsp;';
      }
      if (this.pictureCount === '') {
        this.pictureCountIsDanger = true
        this.pictureCountIsSuccess = false
        this.pictureCountHelpText = 'Cannot be empty'
      } else {
        this.pictureCountIsDanger = false
        this.pictureCountIsSuccess = true
        this.pictureCountHelpText = '&nbsp;'
      }
      // if (this.imageSize === '') {
      //   this.imageSizeIsDanger = true
      //   this.imageSizeIsSuccess = false
      //   this.imageSizeHelpText = 'Cannot be empty'
      // } else {
      //   this.imageSizeIsDanger = false
      //   this.imageSizeIsSuccess = true
      //   this.imageSizeHelpText = '&nbsp;'
      // }
      // =============
      this.imageSize = "1920"
      this.imageSizeIsDanger = false
      this.imageSizeIsSuccess = true
      this.imageSizeHelpText = '&nbsp;'
      // =============
      if (this.folderIsDanger || this.nameIsDanger || this.pictureCountIsDanger || this.imageSizeIsDanger) {
        this.isDisabled = false;
        return false;
      }
      this.isDisabled = true;
      this.buttonSubmitText = 'Please Wait ...';

      var asd = await cekAllProjectDB(this.$db.project)
      console.log(asd)
      
      // covert to slug
      this.slug = convertToSlug(this.name)

      // check DB for same name slug
      var test = await searchDatabase(this.$db.project, {
        name: this.name,
        slug: this.slug
      })
      this.name = test.name
      this.slug = test.slug

      // save to DB
      var saveTo = await saveToDB({
        name: this.name,
        slug: this.slug,
        folder: this.folder,
        picture_count: parseInt(this.pictureCount),
        image_size: parseInt(this.imageSize),
        created_at: parseInt((new Date().getTime() / 1000).toFixed(0)),
        updated_at: parseInt((new Date().getTime() / 1000).toFixed(0)),
        deleted_at: null
      }, this.$db.project)
      if (saveTo) {
        console.log('saveTo',saveTo)
        this.$router.push({ name: 'project', params: { projectID: saveTo._id }})
      }

      
      console.log('new Date()')
      console.log(new Date())
      console.log({ 
        name: this.name, 
        slug: this.slug,
        folder: this.folder 
      })
      // alert('Processing!');
    }
  }
}
</script>

<style>

</style>