CREATE KEYSPACE IF NOT EXISTS openrap_db WITH replication = {'class': 'SimpleStrategy','replication_factor': '1'};

CREATE TABLE IF NOT EXISTS openrap_db.content_index (
	identifier text,
	objecttype text,
	status text,
	metadata text,
	stageicons blob,
	data blob,
	createdby text,
	createddate timestamp,
	updateddate timestamp,
	PRIMARY KEY (createdby, status, identifier)
);

CREATE TABLE IF NOT EXISTS openrap_db.question_bank (
	identifier text,
	objecttype text,
	metadata text,
	data blob,
	createddate timestamp,
	updateddate timestamp,
	PRIMARY KEY (identifier)
);