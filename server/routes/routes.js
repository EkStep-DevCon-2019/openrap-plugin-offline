var contentService = require('../service/content-service');

module.exports = function(app, dirname) {
	
	app.post('/action/content/v3/create', function(req, res, next) {
  		contentService.createContent(req, res);
	});
	app.post('/action/content/v3/update/:contentId', function(req, res, next) {
  		contentService.updateContent(req, res);
	});
	app.post('/action/content/v3/upload/:contentId', function(req, res, next) {
  		contentService.uploadContent(req, res);
	});
	app.get('/action/content/v3/:contentId', function(req, res, next) {
  		contentService.readContent(req, res);
	});
	app.post('/action/content/v3/search', function(req, res, next) {
  		contentService.searchContent(req, res);
	});
	app.post('/action/assessment/v3/items/create', function(req, res, next) {
  		contentService.createItem(req, res);
	});
	app.post('/action/assessment/v3/items/update/:itemId', function(req, res, next) {
  		contentService.updateItem(req, res);
	});
	app.post('/action/assessment/v3/items/read/:itemId', function(req, res, next) {
  		contentService.readItem(req, res);
	});
};









