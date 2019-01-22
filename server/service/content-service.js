var fs = require('fs');
var _ = require('lodash');

var ExpressCassandra = require('express-cassandra');
var models = ExpressCassandra.createClient({
    clientOptions: {
        contactPoints: ['127.0.0.1'],
        protocolOptions: { port: 9042 },
        keyspace: 'openrap_db',
        queryOptions: { consistency: ExpressCassandra.consistencies.one }
    },
    ormOptions: {
        defaultReplicationStrategy: {
            class: 'SimpleStrategy',
            replication_factor: 1
        },
        migration: 'safe'
    }
});

var ContentModel = models.loadSchema('content_index', {
    fields: {
        identifier: "text",
        objecttype: "text",
        status: "text",
        metadata: "text",
        stageicons: "blob",
        data: "blob",
        createdby: "text",
        createddate: "timestamp",
        updateddate: "timestamp"
    },
    key: ["createdby", "status", "identifier"]
});

var QuestionBank = models.loadSchema('question_bank', {
    fields: {
        identifier: "text",
        objecttype: "text",
        metadata: "text",
        data: "blob",
        createddate: "timestamp",
        updateddate: "timestamp"
    },
    key: ["identifier"]
});

var response = {
    "id": "ekstep.content.info",
    "ver": "3.0",
    "ts": "YYYY-MM-DDThh:mm:ssZ+/-nn.nn",
    "params": {
        "resmsgid": "",
        "msgid": "",
        "err": "0",
        "status": "successful",
        "errmsg": ""
    },
    "result": {},
    "responseCode": "OK"
}

exports.createContent = function(req, res, next) {

    if (req.body && req.body.mimeType === 'application/vnd.ekstep.ecml-archive') {

        var identifier = "do_" + new Date().getTime();
        var metadata = {
            identifier: identifier,
            objectType: "Content",
            name: req.body.name,
            subject: req.body.subject,
            contentType: 'Resource',
            mimeType: req.body.mimeType,
            medium: req.body.medium,
            createdby: req.body.userId
        }
        var content = new ContentModel({
            identifier: identifier,
            objecttype: "Content",
            status: "Draft",
            metadata: JSON.stringify(metadata),
            createdby: req.body.userId,
            createddate: Date.now(),
            updateddate: Date.now()
        });
        content.save(function(err) {
            if (err) {
                console.log(err);
                next(err);
            } else {
                res.json(metadata);
            }
        });
    }
}

exports.updateContent = function(req, res, next) {

}

exports.uploadContent = function(req, res) {

}

exports.readContent = function(req, res, next) {
    // createdby: {'$in': ["1", "2", "3"]}, status: {'$in': ["Draft"]}, 
    ContentModel.findOne({ identifier: req.params.contentId }, { raw: true, allow_filtering: true }, function(err, content) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            var data = JSON.parse(content.metadata);
            data.body = content.body;
            data.stageIcons = content.stageicons;
            data.versionKey = "1495172265314";
            var resp = JSON.parse(JSON.stringify(response));
            resp.result.content = data;
            res.json(resp);
        }
    });
}

exports.searchContent = function(req, res, next) {

    var query = {};
    if (req.body.request.filters.status) {
        query.status = { "$in": req.body.request.filters.status }
    }
    if (req.body.request.filters.createdBy) {
        if (_.isArray(req.body.request.filters.createdBy)) {
            query.createdby = { "$in": req.body.request.filters.createdBy }
        } else {
            query.createdby = req.body.request.filters.createdBy
        }
    }

    ContentModel.find(query, { raw: true, allow_filtering: true }, function(err, contents) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            var resp = JSON.parse(JSON.stringify(response));
            resp.result.totalCount = contents.length;
            resp.result.content = [];
            contents.forEach(function(content) {
                var data = JSON.parse(content.metadata);
                data.versionKey = "1495172265314";
                resp.result.content.push(data);
            })
            res.json(resp);
        }
    });
}

function updateStatus(req, res, next, newStatus) {
    ContentModel.findOne({ identifier: req.params.contentId }, { raw: true, allow_filtering: true }, function(err, content) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            var cloneContent = JSON.parse(JSON.stringify(content));
            cloneContent.status = newStatus;
            var contentToBeUpdated = new ContentModel(cloneContent);
            contentToBeUpdated.save(function(err) {
                if (err) {
                    console.log(err);
                    next(err);
                } else {
                    ContentModel.delete({createdby: content.createdby, status: content.status, identifier: content.identifier}, function(err){
                        if (err) {
                            console.log(err);
                            next(err);
                        } else {
                            var resp = JSON.parse(JSON.stringify(response));
                            resp.result.versionKey = "1495172265314";
                            res.json(resp);
                        }
                    });
                }
            });
        }
    });
}

exports.sendForReview = function(req, res, next) {
    updateStatus(req, res, next, "Review");
}

exports.publish = function(req, res, next) {
    updateStatus(req, res, next, "Live");
}

exports.createItem = function(req, res) {

}

exports.updateItem = function(req, res) {

}

exports.readItem = function(req, res) {

}