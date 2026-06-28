# Deployments Tests

Small deployment smoke-test apps grouped by language, runtime, and framework.

Most app examples expose the same routes:

- `GET /` returns a short service message.
- `GET /health` returns a JSON health response.

Most app examples read the `PORT` environment variable and fall back to `8080`. The Dockerfile example also starts Postgres inside the container.

## Structure

```txt
deployments-tests/
  dotnet/
    aspnet-core/
  dockerfile/
    basic/
  go/
    vanilla/
    fiber/
  java/
    vanilla/
    spring-boot/
  js/
    node/
    express/
  python/
    vanilla/
  rust/
    vanilla/
    axum/
```

## Run Commands

| Example | Command |
| --- | --- |
| .NET ASP.NET Core | `cd dotnet/aspnet-core && dotnet run` |
| Dockerfile basic | `cd dockerfile/basic && docker build -t aeroplane-dockerfile-basic . && docker run --rm -p 8080:8080 -p 5432:5432 aeroplane-dockerfile-basic` |
| Go vanilla | `cd go/vanilla && go run .` |
| Go Fiber | `cd go/fiber && go run .` |
| Java vanilla | `cd java/vanilla && java server.java` |
| Java Spring Boot | `cd java/spring-boot && mvn spring-boot:run` |
| JavaScript Node | `cd js/node && npm start` |
| JavaScript Express | `cd js/express && npm install && npm start` |
| Python vanilla | `cd python/vanilla && python3 main.py` |
| Rust vanilla | `cd rust/vanilla && cargo run` |
| Rust Axum | `cd rust/axum && cargo run` |

Run from this directory:

```sh
cd deployments-tests
PORT=8080 <command>
```
