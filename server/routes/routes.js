var contentService = require('../service/content-service');

module.exports = function(app, dirname) {
	
	app.post('/action/content/v3/create', contentService.createContent);
	app.patch('/action/content/v3/update/:contentId', contentService.updateContent);
	app.post('/action/content/v3/upload/:contentId', contentService.uploadContent);
	app.get('/action/content/v3/read/:contentId', contentService.readContent);
	app.post('/action/content/v3/search', contentService.searchContent);
	app.post('/action/assessment/v3/items/create', contentService.createItem);
	app.post('/action/assessment/v3/items/update/:itemId', contentService.updateItem);
	app.post('/action/assessment/v3/items/read/:itemId', contentService.readItem);

	app.post('/action/content/v3/review/:contentId', contentService.sendForReview);
	app.post('/action/content/v3/publish/:contentId', contentService.publish);
	
};