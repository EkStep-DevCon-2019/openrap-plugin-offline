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
        createdby: "text",
        createddate: "timestamp",
        updateddate: "timestamp"
    },
    key: ["createdby", "status", "identifier"]
});

var AssetModel = models.loadSchema('asset_index', {
    fields: {
        identifier: "text",
        mediatype: "text",
        location: "text",
        metadata: "text",
        createdby: "text",
        createddate: "timestamp"
    },
    key: ["createdby", "mediatype", "identifier"]
});

var QuestionBank = models.loadSchema('question_bank', {
    fields: {
        identifier: "text",
        objecttype: "text",
        metadata: "text",
        createddate: "timestamp",
        updateddate: "timestamp"
    },
    key: ["identifier"]
});

var TelemetryModel = models.loadSchema('telemetry', {
    fields: {
        mid: "text",
        event: "text"
    },
    key: ["mid"]
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

    var identifier = "do_" + new Date().getTime();
    if (req.body && req.body.mimeType === 'application/vnd.ekstep.ecml-archive') {
        var metadata = {
            identifier: identifier,
            objectType: "Content",
            name: req.body.name,
            subject: req.body.subject,
            contentType: 'Resource',
            mimeType: req.body.mimeType,
            medium: req.body.medium,
            createdby: req.body.userId,
            versionKey: "1495172265314"
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
    } else {
        var metadata = req.body.request.content;
        metadata.identifier = identifier;
        metadata.node_id = identifier;
        var asset = new AssetModel({
            identifier: identifier,
            mediatype: metadata.mediaType,
            metadata: JSON.stringify(metadata),
            createdby: metadata.createdBy,
            createddate: Date.now()
        });
        asset.save(function(err) {
            if (err) {
                console.log(err);
                next(err);
            } else {
                var resp = JSON.parse(JSON.stringify(response));
                resp.result.node_id = identifier;
                res.json(resp);
            }
        });
    }
}

exports.updateContent = function(req, res, next) {
    ContentModel.findOne({ identifier: req.params.contentId }, { raw: true, allow_filtering: true }, function(err, content) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            var metadata = JSON.parse(content.metadata);
            var newMetadata = _.assign(metadata, req.body.request.content);
            content.metadata = JSON.stringify(newMetadata);
            content.updateddate = Date.now();
            var contentToBeUpdated = new ContentModel(content);
            contentToBeUpdated.save(function(err){
                if(err) {
                    console.log(err);
                    next(err);
                }
                else {
                    var resp = JSON.parse(JSON.stringify(response));
                    resp.result.versionKey = "1495172265314";
                    res.json(resp);
                }
            });
        }
    });
}

exports.uploadContent = function(req, res, next) {
    
    AssetModel.findOne({ identifier: req.params.contentId }, { raw: true, allow_filtering: true }, function(err, asset) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            var metadata = JSON.parse(asset.metadata);
            metadata.node_id = metadata.identifier;
            metadata.content_url = "/" + req.file.path;
            metadata.downloadUrl = "/" + req.file.path;
            asset.metadata = JSON.stringify(metadata);
            asset.location = "/" + req.file.path;

            var assetToBeUpdated = new AssetModel(asset);
            assetToBeUpdated.save(function(err){
                if(err) {
                    console.log(err);
                    next(err);
                }
                else {
                    var resp = JSON.parse(JSON.stringify(response));
                    resp.result = metadata;
                    res.json(resp);
                }
            });
        }
    });
}

exports.readContent = function(req, res, next) {
    // createdby: {'$in': ["1", "2", "3"]}, status: {'$in': ["Draft"]}, 
    ContentModel.findOne({ identifier: req.params.contentId }, { raw: true, allow_filtering: true }, function(err, content) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            var resp = JSON.parse(JSON.stringify(response));
            resp.result.content = JSON.parse(content.metadata);
            res.json(resp);
        }
    });
}

exports.searchContent = function(req, res, next) {

    var query = {};
    
    if(req.body.request.filters.mediaType) {
        if (req.body.request.filters.createdBy) {
            if (_.isArray(req.body.request.filters.createdBy)) {
                query.createdby = { "$in": req.body.request.filters.createdBy }
            } else {
                query.createdby = req.body.request.filters.createdBy
            }
        }
        if (req.body.request.filters.mediaType) {
            if (_.isArray(req.body.request.filters.mediaType)) {
                query.mediatype = { "$in": req.body.request.filters.mediaType }
            } else {
                query.mediatype = req.body.request.filters.mediaType
            }
        }
        AssetModel.find(query, { raw: true, allow_filtering: true }, function(err, assets) {
            if (err) {
                console.log(err);
                next(err);
            } else {
                var resp = JSON.parse(JSON.stringify(response));
                resp.result.totalCount = assets.length;
                resp.result.content = [];
                assets.forEach(function(asset) {
                    var data = JSON.parse(asset.metadata);
                    resp.result.content.push(data);
                })
                res.json(resp);
            }
        });
    } else {
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
                    data.status = content.status;
                    data.updateddate = content.updateddate;
                    data.stageIcons = undefined;
                    data.body = undefined;
                    resp.result.content.push(data);
                })
                res.json(resp);
            }
        });
    }
    
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

exports.readChannel = function(req, res, next) {
    res.json({"id":"ekstep.learning.channel.read","ver":"1.0","ts":"2019-01-23T09:46:34ZZ","params":{"resmsgid":"d2669774-4f79-49d6-959b-aa68f6952310","msgid":null,"err":null,"status":"successful","errmsg":null},"responseCode":"OK","result":{"channel":{"identifier":"0124784842112040965","code":"0124784842112040965","frameworks":[{"identifier":"tn_k-12-3","name":"tn_k-12-3","objectType":"Framework","relation":"hasSequenceMember","description":"tn_k-12-3","index":1,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null},{"identifier":"od_k-12_5","name":"od_k-12_5","objectType":"Framework","relation":"hasSequenceMember","description":"sample State Framework od_k-12_5","index":2,"status":null,"depth":null,"mimeType":null,"visibility":null,"compatibilityLevel":null}],"consumerId":"a9cb3a83-a164-4bf0-aa49-b834cebf1c07","channel":"in.ekstep","description":"This is the ROOT ORG","createdOn":"2018-04-09T05:40:58.644+0000","versionKey":"1547206729970","appId":"staging.diksha.app","name":"OD","lastUpdatedOn":"2019-01-11T11:38:49.970+0000","defaultFramework":"tn_k-12-3","status":"Live"}}});
}

exports.readFramework = function(req, res, next) {
    res.json({"id":"ekstep.learning.framework.read","ver":"1.0","ts":"2019-01-23T09:53:04ZZ","params":{"resmsgid":"0b8c6173-9ebc-4134-99f5-4f242a3c836d","msgid":null,"err":null,"status":"successful","errmsg":null},"responseCode":"OK","result":{"framework":{"identifier":"NCF","code":"NCF","name":"NCF framework","description":"NCF ","graph_id":"domain","nodeType":"DATA_NODE","type":"K-12","node_id":21979,"objectType":"Framework","categories":[{"identifier":"ncf_board","code":"board","terms":[{"associations":[{"identifier":"ncf_gradelevel_kindergarten","code":"kindergarten","translations":null,"name":"KG","description":"KG","category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade1","code":"grade1","translations":null,"name":"Class 1","description":"Class 1","category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade2","code":"grade2","translations":null,"name":"Class 2","description":"Class 2","category":"gradeLevel","status":"Live"},{"identifier":"ncf_gradelevel_grade4","code":"grade4","translations":null,"name":"Class 4","description":"Class 4","category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade3","code":"grade3","translations":null,"name":"Class 3","description":"Class 3","category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade5","code":"grade5","translations":null,"name":"Class 5","description":"Class 5","category":"gradelevel","status":"Live"}],"identifier":"ncf_board_ncert","code":"ncert","translations":null,"name":"NCERT","description":"","index":1,"category":"board","status":"Live"},{"identifier":"ncf_board_cbse","code":"cbse","translations":null,"name":"CBSE","description":"","index":2,"category":"board","status":"Live"},{"identifier":"ncf_board_icse","code":"icse","translations":null,"name":"ICSE","description":"","index":3,"category":"board","status":"Live"},{"identifier":"ncf_board_upboard","code":"upboard","translations":null,"name":"State (Uttar Pradesh)","description":"State (Uttar Pradesh)","index":4,"category":"board","status":"Live"},{"identifier":"ncf_board_apboard","code":"apboard","translations":null,"name":"State (Andhra Pradesh)","description":"State (Andhra Pradesh)","index":5,"category":"board","status":"Live"},{"identifier":"ncf_board_tnboard","code":"tnboard","translations":null,"name":"State (Tamil Nadu)","description":"State (Tamil Nadu)","index":6,"category":"board","status":"Live"},{"identifier":"ncf_board_ncte","code":"ncte","translations":null,"name":"NCTE","description":"","index":7,"category":"board","status":"Live"},{"identifier":"ncf_board_mscert","code":"mscert","translations":null,"name":"State (Maharashtra)","description":"State (Maharashtra)","index":8,"category":"board","status":"Live"},{"identifier":"ncf_board_bser","code":"bser","translations":null,"name":"State (Rajasthan)","description":"State (Rajasthan)","index":9,"category":"board","status":"Live"},{"identifier":"ncf_board_others","code":"others","translations":null,"name":"Other","description":"Other","index":10,"category":"board","status":"Live"}],"translations":null,"name":"Curriculum","description":"","index":1,"status":"Live"},{"identifier":"ncf_gradelevel","code":"gradeLevel","terms":[{"identifier":"ncf_gradelevel_kindergarten","code":"kindergarten","translations":null,"name":"KG","description":"KG","index":1,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade1","code":"grade1","translations":null,"name":"Class 1","description":"Class 1","index":2,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade2","code":"grade2","translations":null,"name":"Class 2","description":"Class 2","index":3,"category":"gradeLevel","status":"Live"},{"identifier":"ncf_gradelevel_grade3","code":"grade3","translations":null,"name":"Class 3","description":"Class 3","index":4,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade4","code":"grade4","translations":null,"name":"Class 4","description":"Class 4","index":5,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade5","code":"grade5","translations":null,"name":"Class 5","description":"Class 5","index":6,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade6","code":"grade6","translations":null,"name":"Class 6","description":"Class 6","index":7,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade7","code":"grade7","translations":null,"name":"Class 7","description":"Class 7","index":8,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade8","code":"grade8","translations":null,"name":"Class 8","description":"Class 8","index":9,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade9","code":"grade9","translations":null,"name":"Class 9","description":"Class 9","index":10,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade10","code":"grade10","translations":null,"name":"Class 10","description":"Class 10","index":11,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade11","code":"grade11","translations":null,"name":"Class 11","description":"Class 11","index":12,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_grade12","code":"grade12","translations":null,"name":"Class 12","description":"Class 12","index":13,"category":"gradelevel","status":"Live"},{"identifier":"ncf_gradelevel_others","code":"others","translations":null,"name":"Other","description":"","index":14,"category":"gradeLevel","status":"Live"}],"translations":null,"name":"Class","description":"","index":2,"status":"Live"},{"identifier":"ncf_subject","code":"subject","terms":[{"identifier":"ncf_subject_mathematics","code":"mathematics","translations":null,"name":"Mathematics","description":"","index":1,"category":"subject","status":"Live"},{"identifier":"ncf_subject_english","code":"english","translations":null,"name":"English","description":"","index":2,"category":"subject","status":"Live"},{"identifier":"ncf_subject_tamil","code":"tamil","translations":null,"name":"Tamil","description":"","index":3,"category":"subject","status":"Live"},{"identifier":"ncf_subject_telugu","code":"telugu","translations":null,"name":"Telugu","description":"","index":4,"category":"subject","status":"Live"},{"identifier":"ncf_subject_geography","code":"geography","translations":null,"name":"Geography","description":"","index":5,"category":"subject","status":"Live"},{"identifier":"ncf_subject_urdu","code":"urdu","translations":null,"name":"Urdu","description":"","index":6,"category":"subject","status":"Live"},{"identifier":"ncf_subject_kannada","code":"kannada","translations":null,"name":"Kannada","description":"","index":7,"category":"subject","status":"Live"},{"identifier":"ncf_subject_assamese","code":"assamese","translations":null,"name":"Assamese","description":"","index":8,"category":"subject","status":"Live"},{"identifier":"ncf_subject_physics","code":"physics","translations":null,"name":"Physics","description":"","index":9,"category":"subject","status":"Live"},{"identifier":"ncf_subject_chemistry","code":"chemistry","translations":null,"name":"Chemistry","description":"","index":10,"category":"subject","status":"Live"},{"identifier":"ncf_subject_hindi","code":"hindi","translations":null,"name":"Hindi","description":"","index":11,"category":"subject","status":"Live"},{"identifier":"ncf_subject_marathi","code":"marathi","translations":null,"name":"Marathi","description":"","index":12,"category":"subject","status":"Live"},{"identifier":"ncf_subject_environmentalstudies","code":"environmentalstudies","translations":null,"name":"EvS","description":"EvS","index":13,"category":"subject","status":"Live"},{"identifier":"ncf_subject_politicalscience","code":"politicalscience","translations":null,"name":"Political Science","description":"","index":14,"category":"subject","status":"Live"},{"identifier":"ncf_subject_bengali","code":"bengali","translations":null,"name":"Bengali","description":"","index":15,"category":"subject","status":"Live"},{"identifier":"ncf_subject_history","code":"history","translations":null,"name":"History","description":"","index":16,"category":"subject","status":"Live"},{"identifier":"ncf_subject_gujarati","code":"gujarati","translations":null,"name":"Gujarati","description":"","index":17,"category":"subject","status":"Live"},{"identifier":"ncf_subject_biology","code":"biology","translations":null,"name":"Biology","description":"","index":18,"category":"subject","status":"Live"},{"identifier":"ncf_subject_oriya","code":"oriya","translations":null,"name":"Odia","description":"Odia","index":19,"category":"subject","status":"Live"},{"identifier":"ncf_subject_punjabi","code":"punjabi","translations":null,"name":"Punjabi","description":"","index":20,"category":"subject","status":"Live"},{"identifier":"ncf_subject_nepali","code":"nepali","translations":null,"name":"Nepali","description":"","index":21,"category":"subject","status":"Live"},{"identifier":"ncf_subject_malayalam","code":"malayalam","translations":null,"name":"Malayalam","description":"","index":22,"category":"subject","status":"Live"},{"identifier":"ncf_subject_socialstudies","code":"socialstudies","translations":null,"name":"Social Studies","description":"Social Studies","index":23,"category":"subject","status":"Live"},{"identifier":"ncf_subject_science","code":"science","translations":null,"name":"Science","description":"Science","index":24,"category":"subject","status":"Live"},{"identifier":"ncf_subject_sanskrit","code":"sanskrit","translations":null,"name":"Sanskrit","description":"Sanskrit","index":25,"category":"subject","status":"Live"},{"identifier":"ncf_subject_healthandphysicaleducation","code":"healthandphysicaleducation","translations":null,"name":"Health and Physical Education","description":"Health and Physical Education","index":26,"category":"subject","status":"Live"},{"identifier":"ncf_subject_economics","code":"economics","translations":null,"name":"Economics","description":"Economics","index":27,"category":"subject","status":"Live"}],"translations":null,"name":"Subject","description":"","index":3,"status":"Live"},{"identifier":"ncf_medium","code":"medium","terms":[{"identifier":"ncf_medium_english","code":"english","translations":null,"name":"English","description":"","index":1,"category":"medium","status":"Live"},{"identifier":"ncf_medium_hindi","code":"hindi","translations":null,"name":"Hindi","description":"","index":2,"category":"medium","status":"Live"},{"identifier":"ncf_medium_oriya","code":"oriya","translations":null,"name":"Odia","description":"Odia","index":3,"category":"medium","status":"Live"},{"identifier":"ncf_medium_telugu","code":"telugu","translations":null,"name":"Telugu","description":"","index":4,"category":"medium","status":"Live"},{"identifier":"ncf_medium_kannada","code":"kannada","translations":null,"name":"Kannada","description":"","index":5,"category":"medium","status":"Live"},{"identifier":"ncf_medium_marathi","code":"marathi","translations":null,"name":"Marathi","description":"","index":6,"category":"medium","status":"Live"},{"identifier":"ncf_medium_assamese","code":"assamese","translations":null,"name":"Assamese","description":"","index":7,"category":"medium","status":"Live"},{"identifier":"ncf_medium_bengali","code":"bengali","translations":null,"name":"Bengali","description":"","index":8,"category":"medium","status":"Live"},{"identifier":"ncf_medium_gujarati","code":"gujarati","translations":null,"name":"Gujarati","description":"","index":9,"category":"medium","status":"Live"},{"identifier":"ncf_medium_urdu","code":"urdu","translations":null,"name":"Urdu","description":"","index":10,"category":"medium","status":"Live"},{"identifier":"ncf_medium_other","code":"other","translations":null,"name":"Other","description":"","index":11,"category":"medium","status":"Live"}],"translations":null,"name":"Medium","description":"","index":4,"status":"Live"}]}}});
}

exports.saveEditorTelemetry = function(req, res, next) {
    var tevent = JSON.parse(req.body.event);
    var event = new TelemetryModel({
        mid: tevent.mid,
        event: req.body.event
    });
    event.save(function(err) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            var resp = JSON.parse(JSON.stringify(response));
            res.json(resp);
        }
    });
}

exports.savePlayerTelemetry = function(req, res, next) {
    var queries = [];
    req.body.events.forEach(function(event) {
        var event = new TelemetryModel({
            mid: event.mid,
            event: JSON.stringify(event)
        });
        queries.push(event.save({return_query: true}));
    });
    models.doBatch(queries, function(err){
        if (err) {
            console.log(err);
            next(err);
        } else {
            var resp = JSON.parse(JSON.stringify(response));
            res.json(resp);
        }
    });
}

exports.createItem = function(req, res) {

}

exports.updateItem = function(req, res) {

}

exports.readItem = function(req, res) {

}