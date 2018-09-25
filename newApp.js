/* from node js express start  */
//libraries
var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var setCookie = require('set-cookie');
var request = require('request');
var d = new Date();



//main root page
app.use(cookieParser());
app.get('/', function(req, res) {
  console.log('Cookies: ', req.cookies)
})

//general login page, credentials are taken here
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/events2017/auth', function (req, res) {

  if(typeof req.query.auth_token == 'undefined' && typeof req.body.auth_token=="undefined"){
    fs.readFile( __dirname + "/" + "login.html" , 'utf8', function (err, data) {//"users.json"

    res.end( data );
  });

}else{
  var frs=JSON.stringify({'ip':req.query.ip})
  var scn=JSON.parse(frs);
  var trd= scn.ip.toString();
  var final=trd.indexOf("129.234.");
  req.cookies.auth_token=req.originalUrl.substring(req.originalUrl.indexOf("n=")+2,req.originalUrl.indexOf("&"));
  var cookie=req.cookies.auth_token;
  var ip=req.query.ip;
  req.body.auth_token=req.originalUrl.substring(req.originalUrl.indexOf("n=")+2,req.originalUrl.indexOf("&"));

  if (typeof cookie=="undefined" && typeof req.body.auth_token=="undefined") {
    res.send(false);
  }else if(typeof cookie=="undefined" && typeof req.body.auth_token!="undefined"){
    var identifier=cookie.substring(cookie.indexOf("_")+1,cookie.length);
    if ((final==0 && req.body.auth_token=="concertina")||ip.indexOf(identifier)==0){
      res.send(true);
    }else{
      res.send(false);
    }
  }else{
    var identifier=cookie.substring(cookie.indexOf("_")+1,cookie.length);

    if (final==0 && (req.query.auth_token=="concertina"||req.body.auth_token=="concertina")){

      res.send(true);

    }
    else if(ip.indexOf(identifier)==0){

      res.send(true);
    }else{

      res.send(false);
    }
  }
}
})
// admin page to manage post/get events, auth will be cookie and be checked each time requested.
app.get('/events2017/admin.html', function (req, res) {
  console.log(req.cookies);
  var cookie=req.cookies.auth_token;

  if (typeof cookie=="undefined") {

    res.redirect("/events2017/auth");

  }else{
    // req.headers['x-forwarded-for']
    var ip=req.connection.remoteAddress;
    var identifier=cookie.substring(cookie.indexOf("_")+1,cookie.length);
    if(ip.indexOf(identifier)!=0){

      res.redirect("/events2017/auth");

    }else{
      fs.readFile( __dirname + "/" + "admin.html" , 'utf8', function (err, data) {//"users.json"
      res.end( data );
    });
  }

}
})

// public, can be seen by admin.
app.get('/events2017/index.html', function (req, res) {
  fs.readFile( __dirname + "/" + "index.html" , 'utf8', function (err, data) {//"users.json"

  res.end( data );
});
})

// after index.html, public page. GET searching events
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/events2017/events/search', function (req, res) {

  fs.readFile( __dirname + "/" + "search.json" , 'utf8', function (err, data) {//"users.json"
  var title=req.query.search;
  if (typeof title == 'undefined'){
    title=req.body.search;
    if (typeof title == 'undefined'){
      title=req.header("search");
    }
  }

  var date=req.query.date;

  if(typeof date == 'undefined'){
    date=req.body.date;
    if(typeof date == 'undefined'){
      date=req.header("date");
      if(typeof date == 'undefined'){
        date="-";
      }
    }
  }

  var onlyDate=date.substring(0,9);
  var ret = onlyDate.replace(/-/g,'');
  var date=ret+"-"+ret;



  if (typeof date != 'undefined'&&typeof title != 'undefined'){

    var url='http://api.eventful.com/json/events/search?keywords='+title+'&date='+date+'&location=UK&app_key=bq9KMQfVVqKfWqQp';//UK

  }else if(typeof title == 'undefined'&&typeof date != 'undefined'){
    var url='http://api.eventful.com/json/events/search?keywords=&date='+date+'&location=UK&app_key=bq9KMQfVVqKfWqQp';

  }else if(typeof title != 'undefined'&&date == 'undefined'){

    var url='http://api.eventful.com/json/events/search?keywords='+title+'&date=all&location=UK&app_key=bq9KMQfVVqKfWqQp';

  }else{

    var url='http://api.eventful.com/json/events/search?keywords=&date=&location=UK&app_key=bq9KMQfVVqKfWqQp';
  }
  request({
    url: url,
    json: true,
  }, function (error, response, body)
  {
    if (!error && response.statusCode === 200)
    {
      var sendRes={"events":[]};
      fs.readFile( __dirname + "/" + "search.json" , 'utf8', function (err, data) {
        data=JSON.parse(data);
        for (var c=0;c<data.events.length;c++){
          // console.log(date+data.events[c].title.includes(title));
          if ((data.events[c].date.indexOf(onlyDate)==0||date=="-") && data.events[c].title.includes(title)){

            sendRes.events.push(data.events[c]);
          }
        }
        if (response.body.total_items!="0"){

          for (var i=0;i<response.body.events.event.length;i++){

            if (response.body.events.event[i].start_time.indexOf(onlyDate)==0){
              var tbw={
                "event_id":response.body.events.event[i].id,
                "title":response.body.events.event[i].title,
                "blurb":response.body.events.event[i].description,
                "date":response.body.events.event[i].start_time,
                "url":response.body.events.event[i].url,
                "venue":{"name":response.body.events.event[i].venue_name,
                "postcode":response.body.events.event[i].postal_code,
                "town":response.body.events.event[i].tz_city,
                "url":response.body.events.event[i].venue_url,
                "icon":response.body.events.event[i].image,//.medium.url problem in that one
                "venue_id":response.body.events.event[i].venue_id
              }
            };
            sendRes.events.push(tbw);
          }//if
        }//for i
      }//if total_items

      res.send(sendRes);
      // }
    })
  }//ajax if
});//ajax

});//fs read
})//get big

// after index.html, public. see venues in JSON form. GET
app.get('/events2017/venues', function (req, res) {//array problem

  fs.readFile( __dirname + "/" + "exVenues.json" , 'utf8', function (err, data) {//"users.json"
  res.setHeader('Content-Type', 'application/json');
  res.end( data);//JSON.stringify(data));
});
})

//GET get event by id
app.get('/events2017/events/get/:event_id', function (req, res) {
  event_id=req.params.event_id.toString();
  event_id = event_id.replace(/['"]+/g, '');
  fs.readFile(__dirname + "/" + 'search.json', "utf8", function bar (err, data){
    res.setHeader('Content-Type', 'application/json');
    var c=JSON.parse(data);
    for (i=0;i<c.events.length;i++){
      if(c.events[i].event_id==event_id){
        res.send(c.events[i]);
        break;
      }//if
    }//for i
    var url = "http://api.eventful.com/json/events/get?id="+event_id+"&app_key=bq9KMQfVVqKfWqQp";
    request({
      url: url,
      json: true,
    }, function (error, response, body)
    {
      var tbw={
        "event_id":response.body.id,
        "title":response.body.title,
        "blurb":response.body.description,
        "date":response.body.start_time,
        "url":response.body.url,
        "venue":{"name":response.body.venue_name,
        "postcode":response.body.postal_code,
        "town":response.body.tz_city,
        "url":response.body.venue_url,
        "icon":response.body.image,//.medium.url problem in that one
        "venue_id":response.body.venue_id}
      }
      if (!error && response.statusCode === 200)
      {
        if (typeof tbw.event_id != 'undefined'){

          res.send(JSON.stringify(tbw));

        }else{
          res.send({"error": "no such event"});
        }

      }
    });//request

  });//fs
})//get

//POST. add event to DB public.
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/events2017/events/add', function(req, res) {
  var str=req.connection.remoteAddress;
  if(typeof req.body.auth_token != 'undefined' && typeof req.cookies.auth_token == 'undefined'){
    var url='http://127.0.0.1:8090/events2017/auth?auth_token='+req.body.auth_token+'&ip='+str;
  }
  else if(typeof req.query.auth_token != 'undefined' && typeof req.cookies.auth_token == 'undefined'){
    var url='http://127.0.0.1:8090/events2017/auth?auth_token='+req.query.auth_token+'&ip='+str;
  }else{
    var url='http://127.0.0.1:8090/events2017/auth?auth_token='+req.cookies.auth_token+'&ip='+str;
  }

  request({
    url: url,
    method:'GET',
    json: true,
  }, function (error, response, body)
  {
    if (!error && response.statusCode === 200)
    {
      var resp=response.body;

      if (resp && typeof req.body.event_id!="undefined" && typeof req.body.title!="undefined" && typeof req.body.venue_id!="undefined" && typeof req.body.date!="undefined"){
        fs.readFile( __dirname + "/" + "search.json" , 'utf8', function (err, data) {//"exEvents.json

        data=JSON.parse(data);
        initial=data.events.length;

        fs.readFile( __dirname + "/" + "exVenues.json" , 'utf8', function (err, bata) {

          bata=JSON.parse(bata);
          var trig=true;
          for (var key in bata.venues){
            if(key==req.body.venue_id){
              evID=req.body.event_id;
              for (var z=0;z<data.events.length;z++){

                if (data.events[z].event_id==evID){
                  data.events[z].title=req.body.title;
                  data.events[z].blurb=req.body.blurb;
                  if(req.body.date.indexOf("T")!=0){
                    req.body.date=req.body.date+"T12:00:00Z";//req.body.date+
                  }//if T
                  data.events[z].date=req.body.date;
                  data.events[z].url=req.body.url;
                  data.events[z].venue={name:bata.venues[key].name,postcode:bata.venues[key].postcode,town:bata.venues[key].town,url:bata.venues[key].url,icon:bata.venues[key].icon,venue_id:req.body.venue_id};
                  trig=false;
                  break;
                }//if
              }//for z
              if (trig){
                if(req.body.date.indexOf("T")!=0){
                  req.body.date=req.body.date+"T12:00:00Z";//req.body.date+
                }//if T
                data.events.push({event_id:req.body.event_id,title:req.body.title,blurb:req.body.blurb,date:req.body.date,url:req.body.url,venue:{name:bata.venues[key].name,postcode:bata.venues[key].postcode,town:bata.venues[key].town,url:bata.venues[key].url,icon:bata.venues[key].icon,venue_id:req.body.venue_id}});
                break;
              }//if trig
            }//if

          }//for

          if(initial==data.events.length){
            evID=req.body.event_id;
            for (var z=0;z<data.events.length;z++){

              if (data.events[z].event_id==evID){
                data.events[z].title=req.body.title;
                data.events[z].blurb=req.body.blurb;
                if(req.body.date.indexOf("T")!=0){
                  req.body.date=req.body.date+"T12:00:00Z";//req.body.date+
                }//if T
                data.events[z].date=req.body.date;
                data.events[z].url=req.body.url;
                data.events[z].venue={name:"",postcode:"",town:"",url:"",icon:"",venue_id:req.body.venue_id};
                trig=false;
                break;
              }//if
            }//for z
            if (trig){
              if(req.body.date.indexOf("T")!=0){
                req.body.date=req.body.date+"T12:00:00Z";//req.body.date+
              }//if T
              data.events.push({event_id:req.body.event_id,title:req.body.title,blurb:req.body.blurb,date:req.body.date,url:req.body.url,venue:{name:"",postcode:"",town:"",url:"",icon:"",venue_id:req.body.venue_id}});

            }//if trig
          }//if init

          fs.writeFile(__dirname + "/" + "search.json" , JSON.stringify(data), function(err) {
            if(err) {
              return console.log(err);
            }//fs write
          })//fs read
          console.log("Saved the event!");
          res.send({"status":"success"});
        });

      });
    }else{
      console.log("error");
      var myObj = {"error": "not authorised, wrong token" };
      var myJSON = JSON.stringify(myObj);

      res.send(myJSON);
    }
  }
});
});

//POST add venue by admin.
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/events2017/venues/add', function(req, res) {
  var name=req.body.VeAddName;
  if (typeof name=="undefined"){
    name=req.body.name;
  }

  var postcode=req.body.VeAddPostcode;
  if (typeof postcode=="undefined"){
    postcode=req.body.postcode;
    if (typeof postcode=="undefined"){
      postcode="";
    }
  }

  var town=req.body.VeAddTown;
  if (typeof town=="undefined"){
    town=req.body.town;
    if (typeof town=="undefined"){
      town="";
    }
  }

  var urlReq=req.body.VeAddUrl;
  if (typeof urlReq=="undefined"){
    urlReq=req.body.url;
    if (typeof urlReq=="undefined"){
      urlReq="";
    }
  }

  var icon=req.body.VeAddIcon;
  if (typeof icon=="undefined"){
    icon=req.body.icon;
    if (typeof icon=="undefined"){
      icon="";
    }
  }



  var str=req.connection.remoteAddress;
  // http://185.122.58.169:8090
  if(typeof req.body.auth_token != 'undefined' && typeof req.cookies.auth_token == 'undefined'){
    var url='http://127.0.0.1:8090/events2017/auth?auth_token='+req.body.auth_token+'&ip='+str;
  }
  else if(typeof req.query.auth_token != 'undefined' && typeof req.cookies.auth_token == 'undefined'){
    var url='http://127.0.0.1:8090/events2017/auth?auth_token='+req.query.auth_token+'&ip='+str;
  }else{
    var url='http://127.0.0.1:8090/events2017/auth?auth_token='+req.cookies.auth_token+'&ip='+str;
  }
  request({
    url: url,
    method:'GET',
    json: true,
  }, function (error, response, body)
  {
    if (!error && response.statusCode === 200)
    {

      var resp=response.body;
      console.log(typeof req.body.name);
      console.log(resp);

      if (resp && typeof name!="undefined"){

        var venue_id="v_"+(Math.random()*1000000000000000000);

        fs.readFile( __dirname + "/" + "exVenues.json" , 'utf8', function (err, data) {//"exEvents.json

        data=JSON.parse(data);
        data.venues[venue_id]={"name":name,"postcode":postcode,"town":town,"url":urlReq,"icon":icon};

        fs.writeFile(__dirname + "/" + "exVenues.json" , JSON.stringify(data), function(err) {
          if(err) {
            return console.log(err);
          }

          console.log("The file was saved!");
        });

        res.send({"status":"success"});
      });
    }else{
      console.log("error");
      var myObj = {"error": "not authorised, wrong token" };
      var myJSON = JSON.stringify(myObj);
      // res.status(400).send('Current password does not match');
      res.status(400);
      res.send(myJSON);
    }
  }}) //request end

});
//login parser POST AUTH.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.post('/events2017/auth', function(req, res) {

  var str=req.connection.remoteAddress;

  var frs=JSON.stringify({'ip':req.connection.remoteAddress})
  var scn=JSON.parse(frs);
  var trd= scn.ip.toString();
  var final=trd.indexOf("129.234.");
  var suffix=str.substring(str.indexOf(":"),str.length)

  var uniq=new Date()
  var mili=uniq.getMilliseconds();
  if (final<0) {
    req.cookies.auth_token="";
    var d2 = new Date(d.getTime()+120*60000)
    setCookie('auth_token', mili+"userNon"+req.body.username+"_"+suffix, {
      domain: 'http://127.0.0.1:8090/events2017',//http://185.122.58.169:8090
      res:res,
      expires:d2
    });
    res.cookie('auth_token',mili+"userNon"+req.body.username+"_"+suffix, { maxAge: 120*60000, httpOnly: true })
    req.cookies.auth_token=mili+"userNon"+req.body.username+"_"+suffix;
  }
  else{
    var d2 = new Date(d.getTime()+120*60000)
    setCookie('auth_token', mili+"concerT"+req.body.username+"_"+suffix, {
      domain: 'http://127.0.0.1:8090/events2017',
      res:res,
      expires:d2
    });
    res.cookie('auth_token',mili+"concerT"+req.body.username+"_"+suffix, { maxAge: 120*60000, httpOnly: true })
    req.cookies.auth_token=mili+"concerT"+req.body.username+"_"+suffix;
  }
  res.redirect("/events2017/admin.html");
});
var server = app.listen(8090, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})
