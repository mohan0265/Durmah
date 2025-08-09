.PHONY: dev test seed clean install

install:
	pnpm install

dev: install
	docker-compose up -d supabase
	pnpm run dev

test:
	pnpm run test

seed:
	pnpm run seed

clean:
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/dist packages/*/dist

docker-build:
	docker build -f infra/docker/server.Dockerfile -t durmah-server .
	docker build -f infra/docker/admin.Dockerfile -t durmah-admin .
