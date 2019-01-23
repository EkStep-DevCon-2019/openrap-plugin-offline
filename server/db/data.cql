CREATE KEYSPACE IF NOT EXISTS openrap_db WITH replication = {'class': 'SimpleStrategy','replication_factor': '1'};

CREATE TABLE IF NOT EXISTS openrap_db.content_index (
	identifier text,
	objecttype text,
	status text,
	metadata text,
	createdby text,
	createddate timestamp,
	updateddate timestamp,
	PRIMARY KEY (createdby, status, identifier)
);

CREATE TABLE IF NOT EXISTS openrap_db.asset_index (
	identifier text,
	mediatype text,
	metadata text,
	location text,
	createdby text,
	createddate timestamp,
	PRIMARY KEY (createdby, mediatype, identifier)
);

CREATE TABLE IF NOT EXISTS openrap_db.question_bank (
	identifier text,
	objecttype text,
	metadata text,
	createddate timestamp,
	updateddate timestamp,
	PRIMARY KEY (identifier)
);

CREATE TABLE IF NOT EXISTS openrap_db.telemetry (
	mid text,
	event text,
	PRIMARY KEY (mid)
);