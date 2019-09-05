/*
 *
 load modules
*
*/

var express = require('express');
var app = express();
var server2 = require("http").Server(app);
var fs = require("fs");

var mime = require("mime");
var bodyParser = require('body-parser');
var path = require("path");

var events = require("events");

var Router = require('router');
var favicon = require('serve-favicon');
var logger = require('morgan');

var router = express.Router();


const ytdl = require('ytdl-core');


const Youtube = require("youtube-api")
    , readJson = require("r-json")
    , Lien = require("lien")
    , Logger = require("bug-killer")
    , opn = require("opn")
    , prettyBytes = require("pretty-bytes")
    ;
 

var videoName;
var infoObj;
var writeStream;


/*
*
*
express middlewares
*
*
*/

//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));







app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(express.static(path.join(__dirname, 'public/assets')));



/*
 *
 some global variables
*
*/

global.eventEmit = new events.EventEmitter();
eventEmit.setMaxListeners(100);

/*
 *
 some local variables
*
*/





/*
 *
 select between openshift or local port
*
*/
var server_port = 8080;
var server_ip_address = "127.0.0.1" ;


var myLogger = function (req, res, next) {
    setHead(res);
    next();
}

app.use(myLogger);

     

app.use(function(request, response, next ) {

    console.log(request.url);
	
    next();
});


app.use( function( error, request, response, next ) {
    if(!error) {
        return next();
    }
   Error404(response);
});


app.get('/', function (req, res) {
   
	console.log(req.url);

});



app.post('/Youtube', function(req, res) {
   
   console.log("downloading video........Thamja");
   
   videoName = req.body.videoId+'.mp4'
   var split = req.body.url.split('=');
   var youtubeId = split[1];
	
  writeStream =  ytdl(req.body.url).pipe(fs.createWriteStream(videoName));
writeStream.once('close', function(){
  console.log('request finished downloading file');
	console.log('uploading on youtube..........Thamja');
	UploadThis();
});
	

ytdl.getInfo(youtubeId, (err, info) => {
  if (err) throw err;
  
	infoObj = {
		
		"title" : info.title,
		"description": info.description,
		"keywords":info.keywords,
		"thumbnail":info.thumbnail_url
		
	}
	
});
	
	
    
});



server2.listen(server_port, server_ip_address, function () {
    console.log( "Listening on " + server_ip_address + ", server_port " + server_port );
});



/*
 *
 functions starts here
*
*/
global.exportProcessUrl = function processUrl(res,absPath,data){
     
    //lookup the content type
    var head = mime.lookup(path.basename(absPath));
    executeUrl(res,data,head);
    
}




function executeUrl(res,data,head){
    res.writeHead(200,{'Content-Type':head});
    res.end(data);
}




function Error404(res){
    res.writeHead(404,'Content-Type:text/plain');
    res.write('404 error : resourse not found');
    res.end();
}

function setHead(res){
     // Website you wish to allow connection- * (all)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
}






let server = new Lien({
    host: "127.0.0.1"
  , port: 5000
});

// Authenticate
// You can access the Youtube resources via OAuth2 only.
// https://developers.google.com/youtube/v3/guides/moving_to_oauth#service_accounts
let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: "970223619668-knao9fos4vc7pi9htg5l1j2pm5kjbbm7.apps.googleusercontent.com"
  , client_secret: "WAz5VGRpIlH_I5h2B2zSpNph"
  , redirect_url: "http://127.0.0.1:5000/oauth2callback"
});
 

function UploadThis(){

opn(oauth.generateAuthUrl({
	scope: ["https://www.googleapis.com/auth/youtube.upload"]
}));
 



// Handle oauth2 callback
server.addPage("/oauth2callback", lien => {
    Logger.log("Trying to get the token using the following code: " + lien.query.code);
    oauth.getToken(lien.query.code, (err, tokens) => {
 
        if (err) {
            lien.lien(err, 400);
            return Logger.log(err);
        }
 
        Logger.log("Got the tokens.");
 
        oauth.setCredentials(tokens);
 
        lien.end("The video is being uploaded. Check out the logs in the terminal.");
 
        var req = Youtube.videos.insert({
            resource: {
                // Video title and description
                snippet: {
                    title: infoObj.title
                  , description: infoObj.description
                }
                // I don't want to spam my subscribers
              , status: {
                    privacyStatus: "public"
                }
            }
            // This is for the callback function
          , part: "snippet,status"
 
            // Create the readable stream to upload the video
          , media: {
                body: fs.createReadStream(videoName)
            }
        }, (err, data) => {
            console.log("Done.");
            process.exit();
        });
 
        setInterval(function () {
            Logger.log(`${prettyBytes(req.req.connection._bytesDispatched)} bytes uploaded.`);
        }, 250);
    });
});

}
