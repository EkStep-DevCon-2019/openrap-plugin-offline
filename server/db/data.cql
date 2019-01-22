CREATE KEYSPACE IF NOT EXISTS openrap_db WITH replication = {'class': 'SimpleStrategy','replication_factor': '1'};

CREATE TABLE IF NOT EXISTS openrap_db.content_index (
	identifier text,
	objectType text,
	status text,
	metadata text,
	stage_icons blob,
	data blob,
	createdDate timestamp,
	updatedDate timestamp,
	PRIMARY KEY (identifier, status)
);

CREATE TABLE IF NOT EXISTS openrap_db.question_bank (
	identifier text,
	objectType text,
	metadata text,
	data blob,
	createdDate timestamp,
	updatedDate timestamp,
	PRIMARY KEY (identifier)
);