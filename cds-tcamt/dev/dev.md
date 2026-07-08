# Fits v1 UI compilation
The UI was made in AngularJS, with dependencies are inacceassible.
A docker image was created to provide those dependencies.
Docker image is hosted on Dockerhub.

## Compose
run 
```docker compose -f docker-compose-ui-compilation.yml run fits-dev``` or ``run-ui-compilation.sh`` within cds-tcamt folder

[//]: # (## In container)

[//]: # ()
[//]: # (```shell)

[//]: # (cd cds-tcamt-client)

[//]: # (npm install;)

[//]: # (npm run bower --config.interactive=false;)

[//]: # (npm run build;)

[//]: # (exit;)

[//]: # (```)