var express = require('express');
var db = require('./models.js');
var bodyParser = require('body-parser');
var app = express();
const fs = require('fs');
const multiparty = require('connect-multiparty')();
const Gridfs = require('gridfs-stream');
const mongoose = require('mongoose');
const path = require('path');

app.use(express.static(__dirname+"/public"))
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

//app.set('port',(process.env.PORT||5000));

app.get('/',function(req,res){
  res.sendFile(__dirname+'/public/index.html')
})

app.route('/:url').
get(function(req,res){
  res.sendFile(__dirname+'/public/index.html');
})

app.route('/getURL/:url')
.get(function(req,res){
  res.setHeader('Content-Type','application/json');
  db.find({url:req.params.url},function(err,data){
    //console.log("data: "+data);
    if(data.length == 0){
      res.json({
        exist:false
      })
    }
    else {
      if(data[0].fileType === true){
        res.json({
          exist: true,
          file:true
        })
      } else if (data[0].fileType === false) {
        db.remove({url:req.params.url},function(err,result) {
          //console.log("result: "+result);
        })
        res.json({
          exist: true,
          file:false,
          data: data[0].content
        })
      }
    }
  })
}).
post(function(req,res){
  var clip = new db();
  clip.url = req.params.url;
  clip.content = req.body.content;
  clip.fileType = false;
  clip.save(function(err,res){
    //console.log("res:"+res);
  });
  res.json({
    done:true
  })
})

app.post('/postFile/:url', multiparty, function(req,res){
  var dbs = mongoose.connection.db;
  var mongoDriver = mongoose.mongo;
  var gfs = new Gridfs(dbs,mongoDriver);
  console.log(path.extname(req.files.file.name));
  if (path.extname(req.files.file.name) !== ".pdf") {
    return;
  }
  var writeStream = gfs.createWriteStream({
    filename:req.files.file.name,
    mode:'w',
    content_type: req.files.file.mimetype,
    metadata: req.body
  })
  fs.createReadStream(req.files.file.path).pipe(writeStream);

  writeStream.on('close',function(file){
    var clip = new db();
    clip.url = req.params.url;
    clip.content = null;
    clip.fileType = true;
    clip.file = file._id;
    clip.save(function(err,res){
      if(err) return;
      //console.log("done");
    })
    res.json({
      done:false
    })
    fs.unlink(req.files.file.path,function(err){
      if(err) return;
      //console.log("success!");
    })
  })
})

app.get('/getFile/:url',function(req,res){
  var dbs = mongoose.connection.db;
  var mongoDriver = mongoose.mongo;
  var gfs = new Gridfs(dbs,mongoDriver);
  var p = new Promise(function(resolve, reject) {
    db.find({url:req.params.url},function(err,data){
      gfs.exist({_id:data[0].file},function(err,found){
        //console.log("found:" +found);
        if(found){
          var readstream = gfs.createReadStream({
            _id: data[0].file
          });
          //console.log("readstream: "+readstream);
          res.set({
            'Content-Disposition':'attachment;filename=clip.pdf',
            'Connection': 'keep-alive'
          })
          resolve(readstream)
          db.remove({url:req.params.url},function(err,result){
            gfs.remove({_id:data[0].file})
          })
        } else {
          reject()
        }
      })
    })
  });
  p.then(function(val){
    val.pipe(res)
  }).catch(function(){
    res.redirect('/')
  })
})
if (process.argv[2] == "dev") {
  app.set('port',5000)
} else {
  app.set('port',80)
}
app.listen(app.get('port'),function(){
  console.log("Magic happens at port "+app.get('port'));
});
