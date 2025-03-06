FROM ubuntu:18.04

WORKDIR /root

# Install required packages
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y build-essential chrpath libssl-dev libxft-dev
RUN apt-get install -y libfreetype6 libfreetype6-dev
RUN apt-get install -y libfontconfig1 libfontconfig1-dev
RUN apt-get install -y curl wget git

# Install Node v8
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

# Install PHANTOM_JS
ENV PHANTOM_JS="phantomjs-1.9.8-linux-x86_64"
RUN apt-get install -y wget
RUN wget https://bitbucket.org/ariya/phantomjs/downloads/$PHANTOM_JS.tar.bz2
RUN tar xvjf $PHANTOM_JS.tar.bz2
RUN mv $PHANTOM_JS /usr/local/share
RUN ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin

# Installing Ruby
RUN curl -sSL https://rvm.io/mpapis.asc | gpg --import -
RUN curl -sSL https://rvm.io/pkuczynski.asc | gpg --import -
RUN curl -sSL https://get.rvm.io | bash -s stable
ENV PATH=$PATH:/usr/local/rvm/gems/ruby-3.1.0/bin:/usr/local/rvm/gems/ruby-3.1.0@global/bin:/usr/local/rvm/rubies/ruby-3.1.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/rvm/bin
RUN rvm install 3.1.0
RUN gem update --system
RUN gem install compass

# Install Java 8
RUN apt-get install -y zip maven
RUN curl -s "https://get.sdkman.io" | bash
RUN /bin/bash -c "source /root/.sdkman/bin/sdkman-init.sh; sdk version; sdk install java 8.0.432-tem"

# Custom Git Config
COPY .gitconfig .
WORKDIR /etc/app
COPY . .