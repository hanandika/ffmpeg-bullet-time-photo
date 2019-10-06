import Datastore from 'nedb'
import path from 'path'
import { remote } from 'electron'

// export default new Datastore({
//   autoload: true,
//   filename: path.join(remote.app.getPath('userData'), '/Project.db')
// })
var db = {};
db.project = new Datastore({
  autoload: true,
  filename: path.join(remote.app.getPath('userData'), '/Project.db'),
  timestampData: true
});
db.client = new Datastore({
  autoload: true,
  filename: path.join(remote.app.getPath('userData'), '/Client.db'),
  timestampData: true
});
db.clip = new Datastore({
  autoload: true,
  filename: path.join(remote.app.getPath('userData'), '/Clip.db'),
  timestampData: true
});

// You need to load each database (here we do it asynchronously)
db.project.loadDatabase();
db.client.loadDatabase();
db.clip.loadDatabase();

export default db