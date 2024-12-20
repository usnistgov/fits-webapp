FROM tomcat:9.0.91-jdk8-temurin-noble
RUN rm -rf /usr/local/tomcat/webapps/*
RUN rm -rf /usr/local/tomcat/webapps.dist
COPY ./cds-tcamt-controller/target/fits.war /usr/local/tomcat/webapps/fits.war