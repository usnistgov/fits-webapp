set -e

function header_section() {
  echo "\033[1;96m\033[43m\t ** $1 ** \t\x1B[K\033[0m"
}


while getopts ":b:v:f:lp" flag
do
    case "${flag}" in
        v) VERSION=${OPTARG};;
        l) AS_LATEST=y;;
        p) PUSH_DOCKERHUB=y;;
    esac
done

if [ -z "$VERSION" ]; then
    echo "Image docker version required. (-v)"
    exit 1
fi

if [ -z "$AS_LATEST" ]; then
    AS_LATEST=n
fi

if [ -z "$PUSH_DOCKERHUB" ]; then
    PUSH_DOCKERHUB=n
fi

SANITIZED_VERSION=$(printf '%q' "$VERSION")
TAGS="-t nist775hit/fits-webapp:$SANITIZED_VERSION"
if [ "$AS_LATEST" == "y" ]; then
  TAGS="$TAGS -t nist775hit/fits-webapp:latest"
fi

echo "$TAGS"

if [ "$PUSH_DOCKERHUB" == "y" ]; then
  read -p "Are you sure you want to push Images $TAGS to DockerHub? (yes/no): " CONFIRM
  if [ "$CONFIRM" == "yes" ]; then
        docker buildx build -f ./Dockerfile --platform linux/amd64,linux/arm64 --push $TAGS .
        header_section "Image nist775hit/fits-webapp:$SANITIZED_VERSION successfully pushed to DockerHub"
        if [ "$AS_LATEST" == "y" ]; then
          header_section "Image nist775hit/fits-webapp:latest successfully pushed to DockerHub"
        fi
      else
        header_section "Skipping push to DockerHub"
    fi
else
  header_section "Building Docker Image version: $SANITIZED_VERSION (local only)"
  docker buildx build -f ./Dockerfile --load $TAGS .
fi
