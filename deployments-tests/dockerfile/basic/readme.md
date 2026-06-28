# Dockerfile Basic

HTTP app built from the root `Dockerfile`. The container starts Postgres, seeds a few rows, and serves endpoints that read from that database.

Use this fixture to verify that Auto detects a Dockerfile at the deployment root and builds with Docker instead of Railpack.

## Run

```sh
docker build -t aeroplane-dockerfile-basic .
docker run --rm -p 8080:8080 -p 5432:5432 aeroplane-dockerfile-basic
```

## Routes

- `GET /`
- `GET /health`
- `GET /messages`

## Database

```sh
psql postgresql://aeroplane:aeroplane@127.0.0.1:5432/aeroplane_test -c "SELECT * FROM messages ORDER BY id;"
```

When deploying through Aeroplane as a source service, set the app port to `8080`.
