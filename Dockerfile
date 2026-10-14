FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY BackEnd/pom.xml ./pom.xml
COPY BackEnd/src ./src
COPY FrontEnd/ ./src/main/resources/static/

RUN mvn --batch-mode --no-transfer-progress verify

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/target/cei-pass-api-0.1.0-SNAPSHOT.jar ./app.jar

ENV SESSION_COOKIE_SECURE=true

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
