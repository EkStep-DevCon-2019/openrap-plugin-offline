var fs = require('fs');
var ExpressCassandra = require('express-cassandra');
var models = ExpressCassandra.createClient({
    clientOptions: {
        contactPoints: ['127.0.0.1'],
        protocolOptions: { port: 9042 },
        keyspace: 'openrap_db',
        queryOptions: {consistency: ExpressCassandra.consistencies.one}
    },
    ormOptions: {
        defaultReplicationStrategy : {
            class: 'SimpleStrategy',
            replication_factor: 1
        },
        migration: 'safe'
    }
});

var ContentModel = models.loadSchema('content_index', {
    fields:{
        identifier    : "text",
        objectType : "text",
        status     : "text",
        metadata : "text",
        stageIcons : "blob",
        data : "blob",
        createdDate : "timestamp",
        updatedDate: "timestamp"
    },
    key:["name"]
});

var QuestionBank = models.loadSchema('question_bank', {
    fields:{
        identifier    : "text",
        objectType : "text",
        metadata : "text",
        data : "blob",
        createdDate : "timestamp",
        updatedDate: "timestamp"
    },
    key:["name"]
});

exports.createContent = function(req, res) {

}

exports.updateContent = function(req, res) {
    
}

exports.uploadContent = function(req, res) {
    
}

exports.readContent = function(req, res) {
    
}

exports.searchContent = function(req, res) {
    
}

exports.createItem = function(req, res) {
    
}

exports.updateItem = function(req, res) {
    
}

exports.readItem = function(req, res) {
    
}