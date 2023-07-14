#!/bin/bash
dlDir=$1
phpDir=$2
extVersion=$3

cd $dlDir
echo 'Downloading...'
curl -C - -O -s http://pecl.php.net/get/xdebug-$extVersion.tgz
echo 'Downloaded'
if [ -d "xdebug-$extVersion" ]; then
 rm -rf "xdebug-$extVersion"
fi
if [ -f "xdebug-$extVersion.tgz" ]; then
  tar -zxf xdebug-$extVersion.tgz
else
  exit 1
fi

export HOMEBREW_NO_AUTO_UPDATE=1
brew install pkg-config autoconf automake libtool
cd "xdebug-$extVersion"
$phpDir/bin/phpize
./configure --with-php-config=$phpDir/bin/php-config
arch -x86_64 make -j4
make install
