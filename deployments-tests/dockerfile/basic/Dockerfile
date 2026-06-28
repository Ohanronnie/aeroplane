FROM postgres:17-alpine

RUN apk add --no-cache python3

WORKDIR /app
COPY app-server.py start-services.sh ./
COPY init-db.sql /docker-entrypoint-initdb.d/01-init-db.sql
RUN chmod +x /app/start-services.sh

ENV POSTGRES_DB=aeroplane_test
ENV POSTGRES_USER=aeroplane
ENV POSTGRES_PASSWORD=aeroplane
ENV PORT=8080

EXPOSE 8080 5432

CMD ["/app/start-services.sh"]
