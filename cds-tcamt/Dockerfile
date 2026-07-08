# ==========================================
# Stage 1: Build UI
# ==========================================
FROM --platform=linux/amd64  nist775hit/fits-dev-environment:latest AS ui-builder

SHELL ["/bin/bash", "-c"]

# Set the working directory
WORKDIR /app
# Bind the source code into the container
COPY . .
RUN chmod +x dev/in-container-compilation.sh && dev/in-container-compilation.sh

# ==========================================
# Stage 2: Build JAR
# ==========================================
FROM eclipse-temurin:8-jdk AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git maven jq\
    && rm -rf /var/lib/apt/lists/*

# Copy ONLY the API from the ui-build stage
COPY --from=ui-builder /app/cds-tcamt-controller ./cds-tcamt-controller
COPY pom.xml ./pom.xml
COPY  dev ./dev
RUN chmod +x ./cds-tcamt-controller/dependencies.sh && chmod +x ./cds-tcamt-controller/build-with-dependencies.sh && ./cds-tcamt-controller/build-with-dependencies.sh


# ==========================================
# Stage 3: Build Deploy
# ==========================================
FROM tomcat:9.0.108-jdk8-temurin-noble AS deploy
RUN rm -rf /usr/local/tomcat/webapps/*
RUN rm -rf /usr/local/tomcat/webapps.dist
RUN sed -i '/<\/web-app>/i \
    <error-page>\n\
      <exception-type>java.lang.Throwable<\/exception-type>\n\
      <location>/error.html<\/location>\n\
    <\/error-page>\n \
    <error-page>\n\
      <error-code>0<\/error-code>\n\
      <location>/error.html<\/location>\n\
    <\/error-page>\n' /usr/local/tomcat/conf/web.xml
COPY ./error.html /usr/local/tomcat/webapps/ROOT/error.html
COPY --from=builder /app/cds-tcamt-controller/target/fits.war /usr/local/tomcat/webapps/fits.war