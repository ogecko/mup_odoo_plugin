setup:
	@docker-compose -p <%= name %> down
	@docker-compose -p <%= name %> build 
	@docker-compose -p <%= name %> up -d postgres
start:
	@docker-compose -p <%= name %> up -d 
stop:
	@docker-compose -p <%= name %> stop
debug:
	@docker-compose -p <%= name %> up -d postgres
