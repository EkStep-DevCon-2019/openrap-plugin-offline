var express = require('express'),
    http = require('follow-redirects').http,
    path = require('path'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    proxy = require('express-http-proxy'),
    urlHelper = require('url');

http.globalAgent.maxSockets = 100000;

var app = express();

// all environments
app.set('port', 4000);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(express.static(path.join(__dirname, '.')));

app.use('/content/preview', proxy('dev.ekstep.in', {
    https: true,
    proxyReqPathResolver: function(req) {
        return "/content/preview" + urlHelper.parse(req.url).path;
    },
    userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
        return proxyResData;
    }
}));

app.use('/action', proxy('dev.ekstep.in', {
    https: true,
    proxyReqPathResolver: function(req) {
        return "/api" + urlHelper.parse(req.url).path;
    },
    proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
        // you can update headers 
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        proxyReqOpts.headers['user-id'] = 'content-editor';
        proxyReqOpts.headers['authorization'] = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiYWYyYzg1OWIxMDg0NzhkYjMyNmYwZDQxNjMwZWMzMSJ9.YZjU6kKNg9F5BvS7JrXTfrxyTEULjR49v7wRD-CT9sg';
        return proxyReqOpts;
    }
}));

app.use('/assets/public', proxy('dev.ekstep.in', {
    https: true,
    proxyReqPathResolver: function(req) {
        return "/assets/public" + urlHelper.parse(req.url).path;
    }
}));

app.use('/content-plugins', proxy('dev.ekstep.in', {
    https: true,
    proxyReqPathResolver: function(req) {
        return "/content-plugins" + urlHelper.parse(req.url).path;
    }
}));

var routes = __dirname + '/server/routes',
    route_files = fs.readdirSync(routes);
route_files.forEach(function(file) {
    require(routes + '/' + file)(app, __dirname);
});

var server = http.createServer(app).listen(app.get('port'), 1500);
server.timeout = 0;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
